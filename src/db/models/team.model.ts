import mongoose, { Schema } from 'mongoose';
import { IAppliedUser, ITeam } from '../interfaces/team.interface';

// Create the applied user schema
export const AppliedUserSchema: Schema<IAppliedUser> = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  appliedAt: { type: Date, default: Date.now, required: true },
  status: {
    type: String,
    enum: ['waiting', 'approved', 'rejected'],
    default: 'waiting',
    required: true,
  },
});

// Create the team schema
const TeamSchema: Schema = new Schema(
  {
    travelId: { type: Schema.Types.ObjectId, required: true, ref: 'Travel' },
    personLimit: { type: Number, required: true },
    appliedUsers: [AppliedUserSchema],
    travelStartDate: { type: Date, required: true },
    travelEndDate: { type: Date, required: true },
  },
  { timestamps: true },
);

export const Team = mongoose.model<ITeam>('Team', TeamSchema);
