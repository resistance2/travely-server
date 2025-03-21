import mongoose, { Schema } from 'mongoose';
import { IComment } from '../interfaces/comment.interface';
import { applyDeletedFilter } from '../middleware/soft-delete.middleware';

const TravelGuideCommentSchema: Schema<IComment> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    travelId: { type: Schema.Types.ObjectId, required: true, ref: 'Travel', refPath: 'onModel' },
    comment: { type: String, required: true },
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
applyDeletedFilter(TravelGuideCommentSchema);

export const TravelGuideComment = mongoose.model<IComment>(
  'TravelGuideComment',
  TravelGuideCommentSchema,
);
