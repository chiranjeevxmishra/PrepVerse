import mongoose from 'mongoose';

const roomMessageSchema = new mongoose.Schema({
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'StudyRoom', required: true, index: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true, trim: true, maxlength: 2000 },
  replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'RoomMessage', default: null },
}, { timestamps: true });

roomMessageSchema.index({ room: 1, createdAt: -1 });

export const RoomMessage = mongoose.model('RoomMessage', roomMessageSchema);
export default RoomMessage;
