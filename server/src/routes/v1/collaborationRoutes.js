import express from 'express';
import {
  createInterview,
  createRoom,
  createRoomMessage,
  endInterview,
  getRoom,
  getRoomMessages,
  joinInterview,
  joinRoom,
  listNotifications,
  listRooms,
  leaveRoom,
  markAllNotificationsRead,
  markNotificationRead,
  startInterview,
} from '../../controllers/collaborationController.js';
import { getPeerMatches, getPeerProfile, updatePeerProfile } from '../../controllers/peerMatchingController.js';
import { protect } from '../../middleware/auth.js';

const router = express.Router();
router.use(protect);

router.get('/notifications', listNotifications);
router.patch('/notifications/read-all', markAllNotificationsRead);
router.patch('/notifications/:id/read', markNotificationRead);

router.get('/peer-profile', getPeerProfile);
router.patch('/peer-profile', updatePeerProfile);
router.get('/matches', getPeerMatches);

router.post('/rooms', createRoom);
router.get('/rooms', listRooms);
router.post('/rooms/join', joinRoom);
router.get('/rooms/:id', getRoom);
router.delete('/rooms/:id/members/me', leaveRoom);
router.get('/rooms/:id/messages', getRoomMessages);
router.post('/rooms/:id/messages', createRoomMessage);
router.post('/rooms/:id/interviews', createInterview);

router.post('/interviews/:id/join', joinInterview);
router.post('/interviews/:id/start', startInterview);
router.post('/interviews/:id/end', endInterview);

export default router;
