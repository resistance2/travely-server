import mongoose, { Schema } from 'mongoose';
import { IUser } from '../interfaces/user.interface';

const UserSchema: Schema = new Schema(
  {
    userProfileImage: { type: String },
    socialName: { type: String, required: true, unique: true },
    userName: { type: String },
    userEmail: { type: String, unique: true },
    phoneNumber: { type: String },
    mbti: { type: String },
    myCreatedTravel: [{ type: Schema.Types.ObjectId, ref: 'Travel', default: [] }],
    myPassedTravel: [{ type: Schema.Types.ObjectId, ref: 'Travel', default: [] }],
    myReviews: [{ type: Schema.Types.ObjectId, ref: 'Review', default: [] }],
    myBookmark: [{ type: Schema.Types.ObjectId, ref: 'Travel', default: [] }],
    isVerifiedUser: { type: Boolean, default: false },
    userScore: { type: Number, default: 0 },
    backAccount: {
      bankCode: { type: String, default: null },
      accountNumber: { type: String, default: null },
    },
  },
  { timestamps: true, id: false, _id: true },
);

export const User = mongoose.model<IUser>('User', UserSchema);
