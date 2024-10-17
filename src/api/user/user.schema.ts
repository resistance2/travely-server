import mongoose, { Schema, Document } from 'mongoose';
export interface IUser extends Document {
  id: string;
  userProfileImage: string;
  userName: string;
  userEmail: string;
  phoneNumber: string;
  mbti: string;
  myCreatedTravel: string[];
  myPassedTravel: string[];
  myReviews: string[];
  myBookmark: string[];
}

const UserSchema: Schema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    userProfileImage: { type: String },
    userName: { type: String, required: true },
    userEmail: { type: String, required: true, unique: true },
    phoneNumber: { type: String },
    mbti: { type: String },
    myCreatedTravel: [{ type: [String], ref: 'Travel', default: [] }],
    myPassedTravel: [{ type: [String], ref: 'Travel', default: [] }],
    myReviews: [{ type: [String], ref: 'Review', default: [] }],
    myBookmark: [{ type: [String], ref: 'Travel', default: [] }],
  },
  { timestamps: true },
);

export const User = mongoose.model<IUser>('User', UserSchema);
