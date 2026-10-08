import Notification from '../models/Notification.js';
import PeerInterview from '../models/PeerInterview.js';
import { emitToUser } from '../realtime/socketServer.js';

export const serializeNotification = (item) => ({
  id: item._id,
  type: item.type,
  message: item.message,
  actor: item.actor ? { id: item.actor._id || item.actor, name: item.actor.name } : null,
  roomId: item.room,
  interviewId: item.interview,
  createdAt: item.createdAt,
  readAt: item.readAt,
});

export const createUserNotification = async ({ recipient, actor = null, type, message, room = null, interview = null }) => {
  if (!recipient) return null;
  const notification = await Notification.create({ recipient, actor, type, message, room, interview });
  const payload = serializeNotification(notification);
  emitToUser(recipient, 'notification:new', payload);
  return notification;
};

export const notifyUpcomingInterviews = async () => {
  const now = new Date();
  const cutoff = new Date(now.getTime() + 10 * 60 * 1000);
  const upcoming = await PeerInterview.find({
    status: 'scheduled',
    startsAt: { $gt: now, $lte: cutoff },
    startReminderSentAt: null,
  }).select('_id room host participant');

  for (const interview of upcoming) {
    const claimed = await PeerInterview.findOneAndUpdate(
      { _id: interview._id, status: 'scheduled', startReminderSentAt: null },
      { $set: { startReminderSentAt: now } },
      { new: true }
    );
    if (!claimed) continue;
    const recipients = new Set([claimed.host.toString(), claimed.participant.toString()]);
    await Promise.all([...recipients].map((recipient) => createUserNotification({
      recipient,
      type: 'interview_reminder',
      message: 'Your interview starts in 10 minutes.',
      room: claimed.room,
      interview: claimed._id,
    })));
  }
  return upcoming.length;
};

export const startInterviewReminderScheduler = () => {
  const timer = setInterval(() => notifyUpcomingInterviews().catch((error) => {
    console.error('[Realtime] Could not send interview reminders:', error.message);
  }), 30 * 1000);
  timer.unref?.();
  return timer;
};

export default { createUserNotification, serializeNotification };
