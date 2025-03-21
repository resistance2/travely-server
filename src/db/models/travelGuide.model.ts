import mongoose, { Schema } from 'mongoose';
import { ITravelGuide } from '../interfaces/travelGuide.interface';
import { applyDeletedFilter } from '../middleware/soft-delete.middleware';

const TravelGuideSchema: Schema<ITravelGuide> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    thumbnail: { type: String, default: null },
    travelTitle: { type: String, required: true },
    travelContent: { type: String, required: true },
    bookmark: [{ type: Schema.Types.ObjectId, default: [] }],
    createdAt: { type: Date, default: Date.now, required: true },
    updatedAt: { type: Date, default: Date.now, required: true },
    teamId: [{ type: Schema.Types.ObjectId, ref: 'Team', default: [] }],
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    query: {
      isDeleted: false,
    },
  },
);

// Apply soft delete middleware
applyDeletedFilter(TravelGuideSchema);

export const TravelGuide = mongoose.model<ITravelGuide>('TravelGuide', TravelGuideSchema);
