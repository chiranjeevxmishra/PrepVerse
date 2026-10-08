import mongoose from 'mongoose';

const peerInterviewSchema = new mongoose.Schema({
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'StudyRoom', required: true, index: true },
  host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  participant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  joinedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  status: { type: String, enum: ['scheduled', 'ready', 'in_progress', 'ended'], default: 'scheduled', index: true },
  startsAt: { type: Date, required: true, index: true },
  startedAt: { type: Date, default: null },
  endedAt: { type: Date, default: null },
  startReminderSentAt: { type: Date, default: null },
}, { timestamps: true });

peerInterviewSchema.index({ host: 1, startsAt: -1 });
peerInterviewSchema.index({ participant: 1, startsAt: -1 });

export const PeerInterview = mongoose.model('PeerInterview', peerInterviewSchema);
export default PeerInterview;
