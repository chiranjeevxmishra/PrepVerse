import app from './src/app.js';
import { connectDB } from './src/config/db.js';
import User from './src/models/User.js';
import StudyRoom from './src/models/StudyRoom.js';
import PeerInterview from './src/models/PeerInterview.js';
import RoomMessage from './src/models/RoomMessage.js';
import Notification from './src/models/Notification.js';
import { attachSocketServer } from './src/realtime/socketServer.js';
import { io as createSocketClient } from 'socket.io-client';

let assertions = 0;
const assert = (condition, message) => {
  if (!condition) throw new Error(`FAIL: ${message}`);
  assertions += 1;
  console.log(`PASS: ${message}`);
};

const httpRequest = (url, { method = 'GET', token, body } = {}) => fetch(url, {
  method,
  headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
  ...(body === undefined ? {} : { body: JSON.stringify(body) }),
});

const connectSocket = (url, token) => new Promise((resolve, reject) => {
  const socket = createSocketClient(url, { auth: token ? { token } : {}, reconnection: false, timeout: 5000 });
  const timer = setTimeout(() => { socket.close(); reject(new Error('Socket connection timed out.')); }, 7000);
  socket.once('connect', () => { clearTimeout(timer); resolve(socket); });
  socket.once('connect_error', (error) => { clearTimeout(timer); reject(error); });
});

const waitFor = (socket, event, predicate = () => true, timeout = 5000) => new Promise((resolve, reject) => {
  const timer = setTimeout(() => { socket.off(event, listener); reject(new Error(`Timed out waiting for ${event}`)); }, timeout);
  const listener = (payload) => {
    if (!predicate(payload)) return;
    clearTimeout(timer); socket.off(event, listener); resolve(payload);
  };
  socket.on(event, listener);
});

const subscribe = (socket, roomId) => new Promise((resolve) => socket.emit('room:subscribe', { roomId }, resolve));
const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const run = async () => {
  await connectDB();
  const server = app.listen(5006);
  const ioServer = attachSocketServer(server);
  const api = 'http://127.0.0.1:5006/api/v1';
  const socketUrl = 'http://127.0.0.1:5006';
  const userIds = [];
  const sockets = [];
  try {
    const register = async (label) => {
      const response = await httpRequest(`${api}/auth/register`, {
        method: 'POST', body: { name: `Phase6 ${label}`, email: `phase6_${label.toLowerCase()}_${Date.now()}_${Math.random().toString(16).slice(2)}@prepverse.dev`, password: 'securePassword456' },
      });
      const data = await response.json();
      if (data.user?.id) userIds.push(data.user.id);
      return { response, data, token: data.token };
    };
    const host = await register('Host');
    const peer = await register('Peer');
    const outsider = await register('Outsider');
    assert(host.response.status === 201 && peer.response.status === 201 && outsider.response.status === 201, 'Three test users can authenticate independently');

    const unauthenticated = await httpRequest(`${api}/collaboration/rooms`, { method: 'POST', body: { name: 'Private room' } });
    assert(unauthenticated.status === 401, 'REST room access requires authentication');
    let rejected = false;
    try { await connectSocket(socketUrl); } catch { rejected = true; }
    assert(rejected, 'Socket connection without a valid token is rejected');

    const roomResponse = await httpRequest(`${api}/collaboration/rooms`, { method: 'POST', token: host.token, body: { name: 'Realtime DSA room' } });
    const createdRoom = await roomResponse.json();
    const roomId = createdRoom.room.id;
    const joinCode = createdRoom.room.joinCode;
    assert(roomResponse.status === 201 && /^[A-F0-9]{10}$/.test(joinCode), 'Owner can create a persistent room with a private invite code');

    const hostSocket = await connectSocket(socketUrl, host.token);
    const peerSocket = await connectSocket(socketUrl, peer.token);
    const outsiderSocket = await connectSocket(socketUrl, outsider.token);
    sockets.push(hostSocket, peerSocket, outsiderSocket);
    assert(hostSocket.connected && peerSocket.connected, 'Two independent authenticated browser sessions connect');

    const hostSubscribe = await subscribe(hostSocket, roomId);
    assert(hostSubscribe.ok && hostSubscribe.onlineUsers.length === 1, 'Room member can subscribe and see initial online presence');
    const hostJoinNotification = waitFor(hostSocket, 'notification:new', (item) => item.type === 'room_joined');
    const memberJoinedEvent = waitFor(hostSocket, 'room:member_joined', (item) => item.name === 'Phase6 Peer');
    const peerJoinResponse = await httpRequest(`${api}/collaboration/rooms/join`, { method: 'POST', token: peer.token, body: { joinCode } });
    const joinedRoom = await peerJoinResponse.json();
    assert(peerJoinResponse.status === 201 && joinedRoom.room.name === 'Realtime DSA room', 'Peer can join via invite code and membership is persisted');
    assert((await hostJoinNotification).message.includes('joined your study room'), 'Room owner receives a private real-time join notification');
    assert((await memberJoinedEvent).userId === peer.data.user.id, 'Room members receive the live membership event');

    const peerSubscribe = await subscribe(peerSocket, roomId);
    assert(peerSubscribe.ok && peerSubscribe.onlineUsers.length === 2, 'Second session sees both online study room members');
    const hostSawPeer = waitFor(hostSocket, 'room:user_joined', (item) => item.userId === peer.data.user.id);
    const outsiderSubscribe = await subscribe(outsiderSocket, roomId);
    assert(!outsiderSubscribe.ok, 'Non-member cannot subscribe to a private study room');
    assert((await hostSawPeer).name === 'Phase6 Peer', 'Room presence broadcasts a joined participant to authorized members');

    const liveMessage = waitFor(peerSocket, 'room:message', (item) => item.text === 'How does a binary search loop invariant work?');
    const doubtResponse = await httpRequest(`${api}/collaboration/rooms/${roomId}/messages`, { method: 'POST', token: host.token, body: { text: 'How does a binary search loop invariant work?' } });
    const doubt = await doubtResponse.json();
    assert(doubtResponse.status === 201 && doubt.message.text.includes('binary search'), 'Room doubts are persisted through REST');
    await liveMessage;
    const privateReplyNotification = waitFor(hostSocket, 'notification:new', (item) => item.type === 'doubt_response');
    const outsiderNotification = waitFor(outsiderSocket, 'notification:new', () => true, 300).then(() => true).catch(() => false);
    const replyResponse = await httpRequest(`${api}/collaboration/rooms/${roomId}/messages`, { method: 'POST', token: peer.token, body: { text: 'Keep low and high bounds around the remaining search interval.', replyTo: doubt.message._id } });
    assert(replyResponse.status === 201, 'Room member can reply to a peer doubt');
    assert((await privateReplyNotification).message === 'Phase6 Peer responded to your doubt.', 'Doubt author receives a private reply notification');
    assert(!(await outsiderNotification), 'Private notification is not broadcast to an unrelated user');

    const roomMessages = await httpRequest(`${api}/collaboration/rooms/${roomId}/messages`, { token: host.token });
    assert((await roomMessages.json()).messages.length === 2, 'Room messages persist and are available through REST');
    const outsiderRoomRead = await httpRequest(`${api}/collaboration/rooms/${roomId}`, { token: outsider.token });
    assert(outsiderRoomRead.status === 404, 'Non-member cannot read private room data over REST');

    const reminderHost = waitFor(hostSocket, 'notification:new', (item) => item.type === 'interview_reminder');
    const reminderPeer = waitFor(peerSocket, 'notification:new', (item) => item.type === 'interview_reminder');
    const interviewResponse = await httpRequest(`${api}/collaboration/rooms/${roomId}/interviews`, {
      method: 'POST', token: host.token, body: { participantId: peer.data.user.id, startsAt: new Date(Date.now() + 9 * 60 * 1000).toISOString() },
    });
    const scheduled = await interviewResponse.json();
    assert(interviewResponse.status === 201 && scheduled.interview.status === 'scheduled', 'Peer interview is scheduled through REST');
    assert((await reminderHost).message === 'Your interview starts in 10 minutes.', 'Host receives a persistent and live 10-minute reminder');
    assert((await reminderPeer).message === 'Your interview starts in 10 minutes.', 'Interview partner receives a private 10-minute reminder');

    const participantEvent = waitFor(hostSocket, 'interview:participant_joined', (item) => item.interviewId === scheduled.interview.id);
    const firstJoin = await httpRequest(`${api}/collaboration/interviews/${scheduled.interview.id}/join`, { method: 'POST', token: host.token });
    assert(firstJoin.status === 200 && (await firstJoin.json()).interview.joinedUsers.length === 1, 'First participant join is synchronized and stored');
    await participantEvent;
    const peerInterviewJoinNotification = waitFor(hostSocket, 'notification:new', (item) => item.type === 'interview_joined');
    const secondJoin = await httpRequest(`${api}/collaboration/interviews/${scheduled.interview.id}/join`, { method: 'POST', token: peer.token });
    const ready = await secondJoin.json();
    assert(secondJoin.status === 200 && ready.interview.status === 'ready', 'Interview becomes ready once both participants join');
    assert((await peerInterviewJoinNotification).message === 'Phase6 Peer joined your interview.', 'Interview partner receives a private participant-joined notification');

    const liveStarted = waitFor(peerSocket, 'interview:started', (item) => item.id === scheduled.interview.id);
    const started = await httpRequest(`${api}/collaboration/interviews/${scheduled.interview.id}/start`, { method: 'POST', token: host.token });
    assert(started.status === 200 && (await started.json()).interview.status === 'in_progress', 'Host starts the interview after both participants join');
    await liveStarted;
    const liveEnded = waitFor(hostSocket, 'interview:ended', (item) => item.id === scheduled.interview.id);
    const ended = await httpRequest(`${api}/collaboration/interviews/${scheduled.interview.id}/end`, { method: 'POST', token: peer.token });
    assert(ended.status === 200 && (await ended.json()).interview.status === 'ended', 'Participant can end the interview and persist final status');
    await liveEnded;

    const notifications = await httpRequest(`${api}/collaboration/notifications`, { token: host.token });
    const notificationData = await notifications.json();
    assert(notifications.status === 200 && notificationData.notifications.length >= 3, 'Each user can retrieve their own persisted notifications');
    const markRead = await httpRequest(`${api}/collaboration/notifications/${notificationData.notifications[0].id}/read`, { method: 'PATCH', token: host.token });
    assert(markRead.status === 200, 'Notification read state is persisted with owner authorization');

    console.log(`Task 6 checks passed: ${assertions}`);
  } finally {
    sockets.forEach((socket) => socket.close());
    await Promise.all(userIds.length ? [
      Notification.deleteMany({ recipient: { $in: userIds } }),
      RoomMessage.deleteMany({ author: { $in: userIds } }),
      PeerInterview.deleteMany({ $or: [{ host: { $in: userIds } }, { participant: { $in: userIds } }] }),
      StudyRoom.deleteMany({ $or: [{ owner: { $in: userIds } }, { members: { $in: userIds } }] }),
      User.deleteMany({ _id: { $in: userIds } }),
    ] : []);
    ioServer.close();
  }
};

run().then(() => process.exit(0)).catch((error) => {
  console.error(error);
  process.exit(1);
});
