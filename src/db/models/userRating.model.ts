import mongoose, { Schema } from 'mongoose';
import { IUserRating } from '../interfaces/userRating.interface';
import { applyDeletedFilter } from '../middleware/soft-delete.middleware';

const UserRatingSchema: Schema<IUserRating> = new Schema(
  {
    fromUserId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    toUserId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    userScore: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now, required: true },
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
applyDeletedFilter(UserRatingSchema);

export const UserRating = mongoose.model<IUserRating>('UserRating', UserRatingSchema);
