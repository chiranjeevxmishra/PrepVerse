import crypto from 'node:crypto';
import mongoose from 'mongoose';
import StudyRoom from '../models/StudyRoom.js';
import PeerInterview from '../models/PeerInterview.js';
import RoomMessage from '../models/RoomMessage.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { createUserNotification, notifyUpcomingInterviews, serializeNotification } from '../services/notificationService.js';
import { emitToStudyRoom, getStudyRoomPresence, removeUserFromStudyRoom } from '../realtime/socketServer.js';

const responseInterview = (interview) => ({
  id: interview._id,
  roomId: interview.room,
  host: interview.host,
  participant: interview.participant,
  joinedUsers: interview.joinedUsers,
  status: interview.status,
  startsAt: interview.startsAt,
  startedAt: interview.startedAt,
  endedAt: interview.endedAt,
});

const respondError = (res, status, message) => res.status(status).json({ success: false, message });
const isValidId = (id) => mongoose.isValidObjectId(id);
const findMemberRoom = async (roomId, userId) => StudyRoom.findOne({ _id: roomId, members: userId })
  .populate('owner', 'name avatar')
  .populate('members', 'name avatar');

export const createRoom = async (req, res, next) => {
  try {
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    if (name.length < 2 || name.length > 80) return respondError(res, 400, 'Room name must be between 2 and 80 characters.');
    const topic = typeof req.body?.topic === 'string' ? req.body.topic.trim() : '';
    if (topic.length > 120) return respondError(res, 400, 'Room topic cannot exceed 120 characters.');
    let joinCode = crypto.randomBytes(5).toString('hex').toUpperCase();
    while (await StudyRoom.exists({ joinCode })) joinCode = crypto.randomBytes(5).toString('hex').toUpperCase();
    const room = await StudyRoom.create({ name, topic, owner: req.user._id, members: [req.user._id], joinCode });
    return res.status(201).json({ success: true, room: { id: room._id, name: room.name, topic: room.topic, owner: req.user, memberCount: 1, joinCode } });
  } catch (error) { return next(error); }
};

export const joinRoom = async (req, res, next) => {
  try {
    const joinCode = typeof req.body?.joinCode === 'string' ? req.body.joinCode.trim().toUpperCase() : '';
    if (!/^[A-F0-9]{10}$/.test(joinCode)) return respondError(res, 400, 'Enter a valid 10-character room code.');
    const room = await StudyRoom.findOne({ joinCode }).select('+joinCode');
    if (!room) return respondError(res, 404, 'Study room not found.');
    if (room.members.length >= 20 && !room.members.some((id) => id.equals(req.user._id))) return respondError(res, 409, 'This room has reached its 20-member limit.');
    const alreadyMember = room.members.some((id) => id.equals(req.user._id));
    if (!alreadyMember) {
      const wasEmpty = room.members.length === 0;
      room.members.push(req.user._id);
      if (wasEmpty) {
        room.owner = req.user._id;
        room.archivedAt = null;
      }
      await room.save();
      if (!wasEmpty && room.owner && !room.owner.equals(req.user._id)) {
        await createUserNotification({
          recipient: room.owner,
          actor: req.user._id,
          type: 'room_joined',
          message: `${req.user.name} joined your study room.`,
          room: room._id,
        });
      }
      emitToStudyRoom(room._id, 'room:member_joined', { userId: req.user._id, name: req.user.name });
    }
    const populated = await findMemberRoom(room._id, req.user._id);
    return res.status(alreadyMember ? 200 : 201).json({ success: true, room: populated, alreadyMember });
  } catch (error) { return next(error); }
};

export const listRooms = async (req, res, next) => {
  try {
    const rooms = await StudyRoom.find({ members: req.user._id })
      .populate('owner', 'name avatar').populate('members', 'name avatar').sort({ updatedAt: -1 });
    return res.status(200).json({ success: true, rooms: rooms.map((room) => ({
      id: room._id, name: room.name, owner: room.owner, members: room.members, memberCount: room.members.length,
      topic: room.topic,
      onlineUsers: getStudyRoomPresence(room._id),
    })) });
  } catch (error) { return next(error); }
};

export const getRoom = async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) return respondError(res, 400, 'Invalid room ID.');
    const room = await findMemberRoom(req.params.id, req.user._id);
    if (!room) return respondError(res, 404, 'Study room not found.');
    const interviews = await PeerInterview.find({ room: room._id }).sort({ startsAt: -1 }).limit(30);
    return res.status(200).json({ success: true, room: {
      id: room._id, name: room.name, owner: room.owner, members: room.members,
      topic: room.topic,
      onlineUsers: getStudyRoomPresence(room._id), interviews: interviews.map(responseInterview),
    } });
  } catch (error) { return next(error); }
};

export const getRoomMessages = async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) return respondError(res, 400, 'Invalid room ID.');
    const roomExists = await StudyRoom.exists({ _id: req.params.id, members: req.user._id });
    if (!roomExists) return respondError(res, 404, 'Study room not found.');
    const messages = await RoomMessage.find({ room: req.params.id }).sort({ createdAt: -1 }).limit(100)
      .populate('author', 'name avatar').populate({ path: 'replyTo', populate: { path: 'author', select: 'name' } });
    return res.status(200).json({ success: true, messages: messages.reverse() });
  } catch (error) { return next(error); }
};

export const leaveRoom = async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) return respondError(res, 400, 'Invalid room ID.');
    const room = await StudyRoom.findOne({ _id: req.params.id, members: req.user._id });
    if (!room) return respondError(res, 404, 'Study room not found.');

    const interviews = await PeerInterview.find({
      room: room._id,
      status: { $ne: 'ended' },
      $or: [{ host: req.user._id }, { participant: req.user._id }],
    });
    for (const interview of interviews) {
      interview.status = 'ended';
      interview.endedAt = new Date();
      await interview.save();
      emitToStudyRoom(room._id, 'interview:ended', responseInterview(interview));
      const otherId = interview.host.equals(req.user._id) ? interview.participant : interview.host;
      await createUserNotification({ recipient: otherId, actor: req.user._id, type: 'interview_ended', message: `${req.user.name} left the room and ended the interview.`, room: room._id, interview: interview._id });
    }

    emitToStudyRoom(room._id, 'room:member_left', { userId: req.user._id, name: req.user.name });
    room.members = room.members.filter((memberId) => !memberId.equals(req.user._id));
    const wasOwner = room.owner?.equals(req.user._id) || false;
    if (wasOwner) room.owner = room.members[0] || null;
    if (room.members.length === 0) room.archivedAt = new Date();
    await room.save();
    await removeUserFromStudyRoom(room._id, req.user._id);
    if (room.owner) {
      await createUserNotification({ recipient: room.owner, actor: req.user._id, type: 'room_left', message: `${req.user.name} left your study room.`, room: room._id });
    }
    return res.status(200).json({ success: true, left: true, archived: room.members.length === 0 });
  } catch (error) { return next(error); }
};

export const createRoomMessage = async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) return respondError(res, 400, 'Invalid room ID.');
    const room = await StudyRoom.findOne({ _id: req.params.id, members: req.user._id });
    if (!room) return respondError(res, 404, 'Study room not found.');
    const text = typeof req.body?.text === 'string' ? req.body.text.trim() : '';
    if (!text || text.length > 2000) return respondError(res, 400, 'Message must be between 1 and 2,000 characters.');
    const replyTo = req.body?.replyTo || null;
    let parent = null;
    if (replyTo) {
      if (!isValidId(replyTo)) return respondError(res, 400, 'Invalid message reply ID.');
      parent = await RoomMessage.findOne({ _id: replyTo, room: room._id });
      if (!parent) return respondError(res, 404, 'Message to reply to was not found.');
    }
    const message = await RoomMessage.create({ room: room._id, author: req.user._id, text, replyTo });
    const populated = await RoomMessage.findById(message._id).populate('author', 'name avatar');
    emitToStudyRoom(room._id, 'room:message', populated);
    if (parent && !parent.author.equals(req.user._id)) {
      await createUserNotification({
        recipient: parent.author,
        actor: req.user._id,
        type: 'doubt_response',
        message: `${req.user.name} responded to your doubt.`,
        room: room._id,
      });
    }
    return res.status(201).json({ success: true, message: populated });
  } catch (error) { return next(error); }
};

export const createInterview = async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) return respondError(res, 400, 'Invalid room ID.');
    const room = await StudyRoom.findOne({ _id: req.params.id, members: req.user._id });
    if (!room) return respondError(res, 404, 'Study room not found.');
    const participantId = req.body?.participantId;
    if (!isValidId(participantId) || participantId.toString() === req.user._id.toString()) return respondError(res, 400, 'Choose another room member as your interview partner.');
    if (!room.members.some((id) => id.equals(participantId))) return respondError(res, 404, 'Interview partner must be a member of this room.');
    const startsAt = new Date(req.body?.startsAt);
    if (Number.isNaN(startsAt.getTime()) || startsAt.getTime() < Date.now() + 60_000 || startsAt.getTime() > Date.now() + 60 * 24 * 60 * 60 * 1000) {
      return respondError(res, 400, 'Choose a start time at least one minute and no more than 60 days from now.');
    }
    const interview = await PeerInterview.create({ room: room._id, host: req.user._id, participant: participantId, startsAt });
    const recipient = await User.findById(participantId).select('name');
    await createUserNotification({ recipient: participantId, actor: req.user._id, type: 'interview_scheduled', message: `${req.user.name} scheduled a peer interview with you.`, room: room._id, interview: interview._id });
    emitToStudyRoom(room._id, 'interview:created', responseInterview(interview));
    await notifyUpcomingInterviews();
    return res.status(201).json({ success: true, interview: responseInterview(interview), participantName: recipient?.name });
  } catch (error) { return next(error); }
};

const findParticipantInterview = async (interviewId, userId) => PeerInterview.findOne({ _id: interviewId, $or: [{ host: userId }, { participant: userId }] });

export const joinInterview = async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) return respondError(res, 400, 'Invalid interview ID.');
    const interview = await findParticipantInterview(req.params.id, req.user._id);
    if (!interview) return respondError(res, 404, 'Interview not found.');
    if (!(await StudyRoom.exists({ _id: interview.room, members: req.user._id }))) return respondError(res, 404, 'Interview not found.');
    if (interview.status === 'ended') return respondError(res, 409, 'This interview has ended.');
    const alreadyJoined = interview.joinedUsers.some((id) => id.equals(req.user._id));
    if (!alreadyJoined) interview.joinedUsers.push(req.user._id);
    const allJoined = [interview.host, interview.participant].every((id) => interview.joinedUsers.some((joined) => joined.equals(id)));
    if (allJoined && interview.status === 'scheduled') interview.status = 'ready';
    if (!alreadyJoined) await interview.save();
    const otherId = interview.host.equals(req.user._id) ? interview.participant : interview.host;
    if (!alreadyJoined) {
      await createUserNotification({ recipient: otherId, actor: req.user._id, type: 'interview_joined', message: `${req.user.name} joined your interview.`, room: interview.room, interview: interview._id });
      emitToStudyRoom(interview.room, 'interview:participant_joined', { interviewId: interview._id, userId: req.user._id, name: req.user.name, status: interview.status });
    }
    return res.status(200).json({ success: true, interview: responseInterview(interview), alreadyJoined });
  } catch (error) { return next(error); }
};

export const startInterview = async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) return respondError(res, 400, 'Invalid interview ID.');
    const interview = await PeerInterview.findOne({ _id: req.params.id, host: req.user._id });
    if (!interview) return respondError(res, 404, 'Interview not found.');
    if (!(await StudyRoom.exists({ _id: interview.room, members: req.user._id }))) return respondError(res, 404, 'Interview not found.');
    if (interview.status === 'ended') return respondError(res, 409, 'This interview has ended.');
    const allJoined = [interview.host, interview.participant].every((id) => interview.joinedUsers.some((joined) => joined.equals(id)));
    if (!allJoined) return respondError(res, 409, 'Both interview participants must join before starting.');
    if (interview.status !== 'in_progress') {
      interview.status = 'in_progress';
      interview.startedAt = new Date();
      await interview.save();
      emitToStudyRoom(interview.room, 'interview:started', responseInterview(interview));
      await Promise.all([interview.host, interview.participant].map((recipient) => createUserNotification({
        recipient, actor: req.user._id, type: 'interview_started', message: 'Your peer interview has started.', room: interview.room, interview: interview._id,
      })));
    }
    return res.status(200).json({ success: true, interview: responseInterview(interview) });
  } catch (error) { return next(error); }
};

export const endInterview = async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) return respondError(res, 400, 'Invalid interview ID.');
    const interview = await findParticipantInterview(req.params.id, req.user._id);
    if (!interview) return respondError(res, 404, 'Interview not found.');
    if (!(await StudyRoom.exists({ _id: interview.room, members: req.user._id }))) return respondError(res, 404, 'Interview not found.');
    if (interview.status !== 'ended') {
      interview.status = 'ended';
      interview.endedAt = new Date();
      await interview.save();
      emitToStudyRoom(interview.room, 'interview:ended', responseInterview(interview));
      const otherId = interview.host.equals(req.user._id) ? interview.participant : interview.host;
      await createUserNotification({ recipient: otherId, actor: req.user._id, type: 'interview_ended', message: `${req.user.name} ended the interview.`, room: interview.room, interview: interview._id });
    }
    return res.status(200).json({ success: true, interview: responseInterview(interview) });
  } catch (error) { return next(error); }
};

export const listNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id }).sort({ createdAt: -1 }).limit(50).populate('actor', 'name');
    return res.status(200).json({ success: true, notifications: notifications.map(serializeNotification), unreadCount: notifications.filter((item) => !item.readAt).length });
  } catch (error) { return next(error); }
};

export const markNotificationRead = async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) return respondError(res, 400, 'Invalid notification ID.');
    const notification = await Notification.findOneAndUpdate({ _id: req.params.id, recipient: req.user._id }, { $set: { readAt: new Date() } }, { new: true }).populate('actor', 'name');
    if (!notification) return respondError(res, 404, 'Notification not found.');
    return res.status(200).json({ success: true, notification: serializeNotification(notification) });
  } catch (error) { return next(error); }
};

export const markAllNotificationsRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ recipient: req.user._id, readAt: null }, { $set: { readAt: new Date() } });
    return res.status(200).json({ success: true });
  } catch (error) { return next(error); }
};

export default { createRoom, joinRoom, leaveRoom, listRooms, getRoom, getRoomMessages, createRoomMessage, createInterview, joinInterview, startInterview, endInterview, listNotifications, markNotificationRead, markAllNotificationsRead };
