import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  type: { type: String, enum: ['room_joined', 'room_left', 'interview_scheduled', 'interview_reminder', 'interview_joined', 'interview_started', 'interview_ended', 'doubt_response'], required: true },
  message: { type: String, required: true, maxlength: 240 },
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'StudyRoom', default: null },
  interview: { type: mongoose.Schema.Types.ObjectId, ref: 'PeerInterview', default: null },
  readAt: { type: Date, default: null },
}, { timestamps: true });

notificationSchema.index({ recipient: 1, createdAt: -1 });

export const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
