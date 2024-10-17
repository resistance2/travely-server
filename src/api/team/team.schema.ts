import mongoose, { Schema, Document } from 'mongoose';

export interface IReview extends Document {
  id: string;
  userId: string[];
  travelId: string[];
  reviewImg?: string[];
  createdDate: Date;
  content: string;
  travelScore: number;
}

const ReviewSchema: Schema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    userId: { type: [String], required: true, ref: 'User' },
    travelId: { type: [String], required: true, ref: 'Travel' },
    reviewImg: { type: [String], default: [] },
    createdDate: { type: Date, default: Date.now },
    content: { type: String, required: true },
    travelScore: { type: Number, required: true },
  },
  { timestamps: true },
);

export const Review = mongoose.model<IReview>('Review', ReviewSchema);
