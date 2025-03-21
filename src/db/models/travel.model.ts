import mongoose, { Schema } from 'mongoose';
import { ITravel } from '../interfaces/travel.interface';
import { applyDeletedFilter } from '../middleware/soft-delete.middleware';

const TravelSchema: Schema<ITravel> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    thumbnail: { type: String, required: true },
    travelTitle: { type: String, required: true },
    travelContent: { type: String, required: true },
    tag: { type: [String], required: true, default: [] },
    travelCourse: { type: [String], required: true, default: [] },
    includedItems: { type: [String], default: [] },
    excludedItems: { type: [String], default: [] },
    meetingTime: { type: [String], default: [] },
    meetingLocation: { type: Object },
    travelPrice: { type: Number, required: true },
    travelFAQ: { type: [{ question: String, answer: String }], default: [] },
    createdAt: { type: Date, default: Date.now, required: true },
    updatedAt: { type: Date, default: Date.now, required: true },
    teamId: [{ type: Schema.Types.ObjectId, ref: 'Team', default: [] }],
    travelActive: { type: Boolean, default: true },
    reviewWrite: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    meetingPlace: { type: String, default: null },
  },
  {
    timestamps: true,
    query: {
      isDeleted: false,
    },
  },
);

// Apply soft delete middleware
applyDeletedFilter(TravelSchema);

export const Travel = mongoose.model<ITravel>('Travel', TravelSchema);
