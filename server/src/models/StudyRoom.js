import mongoose from 'mongoose';

const studyRoomSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  topic: { type: String, trim: true, maxlength: 120, default: '' },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  joinCode: { type: String, required: true, unique: true, select: false },
  archivedAt: { type: Date, default: null, index: true },
}, { timestamps: true });

studyRoomSchema.index({ members: 1, updatedAt: -1 });

export const StudyRoom = mongoose.model('StudyRoom', studyRoomSchema);
export default StudyRoom;
