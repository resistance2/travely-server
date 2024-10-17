import mongoose, { Schema, Document } from 'mongoose';
export interface IUser extends Document {
  id: string;
  userProfileImage: string;
  userName: string;
  userEmail: string;
  phoneNumber: string;
  mbti: string;
  myCreatedTravel: mongoose.Types.ObjectId[];
  myPassedTravel: mongoose.Types.ObjectId[];
  myReviews: mongoose.Types.ObjectId[];
  myBookmark: mongoose.Types.ObjectId[];
}

const UserSchema: Schema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    userProfileImage: { type: String },
    userName: { type: String, required: true },
    userEmail: { type: String, required: true, unique: true },
    phoneNumber: { type: String },
    mbti: { type: String },
    myCreatedTravel: [{ type: Schema.Types.ObjectId, ref: 'Travel', default: [] }],
    myPassedTravel: [{ type: Schema.Types.ObjectId, ref: 'Travel', default: [] }],
    myReviews: [{ type: Schema.Types.ObjectId, ref: 'Review', default: [] }],
    myBookmark: [{ type: Schema.Types.ObjectId, ref: 'Travel', default: [] }],
  },
  { timestamps: true },
);

export const User = mongoose.model<IUser>('User', UserSchema);
