import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { Server } from 'socket.io';
import { ENV } from '../config/env.js';
import User from '../models/User.js';
import StudyRoom from '../models/StudyRoom.js';

let io;
const onlineByRoom = new Map();
const userChannel = (userId) => `user:${userId}`;
const studyChannel = (roomId) => `study:${roomId}`;

const getHandshakeToken = (socket) => {
  const authToken = socket.handshake.auth?.token;
  if (typeof authToken === 'string' && authToken.trim()) return authToken.trim();
  const authorization = socket.handshake.headers.authorization;
  if (typeof authorization === 'string' && authorization.startsWith('Bearer ')) return authorization.slice(7);
  const cookie = socket.handshake.headers.cookie?.split(';').map((part) => part.trim()).find((part) => part.startsWith('token='));
  return cookie ? decodeURIComponent(cookie.slice(6)) : null;
};

const presencePayload = (roomId) => [...(onlineByRoom.get(roomId)?.entries() || [])]
  .map(([userId, user]) => ({ userId, name: user.name }));

const isRoomMember = async (roomId, userId) => Boolean(await StudyRoom.exists({ _id: roomId, members: userId }));

export const attachSocketServer = (httpServer) => {
  io = new Server(httpServer, {
    cors: { origin: ENV.CORS_ORIGIN, credentials: true },
    allowRequest: (req, callback) => {
      const origin = req.headers.origin;
      callback(null, !origin || origin === ENV.CORS_ORIGIN);
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = getHandshakeToken(socket);
      if (!token) return next(new Error('Authentication required'));
      const decoded = jwt.verify(token, ENV.JWT_SECRET);
      const user = await User.findById(decoded.id).select('_id name role');
      if (!user) return next(new Error('Account not found'));
      socket.data.user = { id: user._id.toString(), name: user.name, role: user.role };
      return next();
    } catch {
      return next(new Error('Invalid or expired authentication token'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.data.user;
    socket.join(userChannel(user.id));
    socket.data.studyRooms = new Set();

    socket.on('room:subscribe', async (payload = {}, acknowledge = () => {}) => {
      const roomId = typeof payload?.roomId === 'string' ? payload.roomId : '';
      try {
        if (!mongoose.isValidObjectId(roomId) || !(await isRoomMember(roomId, user.id))) {
          acknowledge({ ok: false, error: 'You are not a member of this study room.' });
          return;
        }
        if (socket.data.studyRooms.has(roomId)) {
          acknowledge({ ok: true, onlineUsers: presencePayload(roomId) });
          return;
        }

        socket.data.studyRooms.add(roomId);
        await socket.join(studyChannel(roomId));
        let roomUsers = onlineByRoom.get(roomId);
        if (!roomUsers) {
          roomUsers = new Map();
          onlineByRoom.set(roomId, roomUsers);
        }
        const existingUser = roomUsers.get(user.id);
        const isFirstSocket = !existingUser;
        const entry = existingUser || { name: user.name, sockets: new Set() };
        entry.sockets.add(socket.id);
        roomUsers.set(user.id, entry);

        acknowledge({ ok: true, onlineUsers: presencePayload(roomId) });
        if (isFirstSocket) socket.to(studyChannel(roomId)).emit('room:user_joined', { userId: user.id, name: user.name });
      } catch {
        acknowledge({ ok: false, error: 'Could not subscribe to this study room.' });
      }
    });

    socket.on('room:unsubscribe', async (payload = {}, acknowledge = () => {}) => {
      const roomId = typeof payload?.roomId === 'string' ? payload.roomId : '';
      if (!socket.data.studyRooms.has(roomId)) {
        acknowledge({ ok: true });
        return;
      }
      socket.data.studyRooms.delete(roomId);
      await socket.leave(studyChannel(roomId));
      removePresence(roomId, user.id, socket.id);
      acknowledge({ ok: true });
    });

    socket.on('disconnect', () => {
      for (const roomId of socket.data.studyRooms) removePresence(roomId, user.id, socket.id);
    });
  });

  return io;
};

const removePresence = (roomId, userId, socketId) => {
  const roomUsers = onlineByRoom.get(roomId);
  const entry = roomUsers?.get(userId);
  if (!entry) return;
  entry.sockets.delete(socketId);
  if (entry.sockets.size === 0) {
    roomUsers.delete(userId);
    io?.to(studyChannel(roomId)).emit('room:user_left', { userId });
  }
  if (roomUsers.size === 0) onlineByRoom.delete(roomId);
};

export const getSocketServer = () => io;

export const emitToUser = (userId, event, payload) => {
  io?.to(userChannel(userId.toString())).emit(event, payload);
};

export const emitToStudyRoom = (roomId, event, payload) => {
  io?.to(studyChannel(roomId.toString())).emit(event, payload);
};

export const removeUserFromStudyRoom = async (roomId, userId) => {
  const roomKey = roomId.toString();
  const userKey = userId.toString();
  const socketIds = [...(onlineByRoom.get(roomKey)?.get(userKey)?.sockets || [])];
  await Promise.all(socketIds.map(async (socketId) => {
    const socket = io?.sockets.sockets.get(socketId);
    if (!socket) return;
    socket.data.studyRooms.delete(roomKey);
    await socket.leave(studyChannel(roomKey));
    removePresence(roomKey, userKey, socketId);
  }));
};

export const getStudyRoomPresence = (roomId) => presencePayload(roomId.toString());

export default { attachSocketServer, getSocketServer, emitToUser, emitToStudyRoom, removeUserFromStudyRoom, getStudyRoomPresence };
