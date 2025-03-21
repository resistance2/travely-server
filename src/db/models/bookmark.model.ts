import mongoose, { Schema } from 'mongoose';
import { IBookmark } from '../interfaces/bookmark.interface';

const BookmarkSchema: Schema<IBookmark> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    travelId: { type: Schema.Types.ObjectId, required: true, ref: 'Travel' },
    bookmarkAt: { type: Date, default: Date.now, required: true },
  },
  {
    timestamps: true,
  },
);

export const Bookmark = mongoose.model<IBookmark>('Bookmark', BookmarkSchema);
