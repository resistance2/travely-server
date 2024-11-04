import mongoose, { Schema, Types } from 'mongoose';

export interface ITravel {
  userId: Types.ObjectId;
  thumbnail: string;
  travelTitle: string;
  travelContent: object;
  tag: string[];
  travelCourse: string[];
  includedItems: string[];
  excludedItems: string[];
  meetingTime: string[];
  meetingLocation: object;
  travelPrice: number;
  travelFAQ: object[];
  reviews: Types.ObjectId[];
  bookmark: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
  teamId: Types.ObjectId[];
  travelTotalScore?: number;
  travelActive: boolean;
  reviewWrite: boolean;
  isDeleted: boolean;
}

export interface IReview {
  userId: Types.ObjectId;
  travelId: Types.ObjectId;
  reviewImg: string[];
  createdDate: Date;
  content: string;
  travelScore: number;
}

export interface IAppliedUser {
  userId: Types.ObjectId;
  appliedAt: Date;
  status: 'waiting' | 'approved' | 'rejected';
}

export interface ITeam {
  travelId: Types.ObjectId;
  personLimit: number;
  appliedUsers: IAppliedUser[];
  travelStartDate: Date;
  travelEndDate: Date;
}

export interface IUser {
  userProfileImage: string;
  socialName: string;
  userName: string;
  userEmail: string;
  phoneNumber: string;
  mbti: string;
  myCreatedTravel: Types.ObjectId[];
  myPassedTravel: Types.ObjectId[];
  myReviews: Types.ObjectId[];
  myBookmark: Types.ObjectId[];
  isVerifiedUser: boolean;
}

const TravelSchema: Schema<ITravel> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    thumbnail: { type: String, required: true },
    travelTitle: { type: String, required: true },
    travelContent: { type: Object, required: true },
    tag: { type: [String], required: true, default: [] },
    travelCourse: { type: [String], required: true, default: [] },
    includedItems: { type: [String], default: [] },
    excludedItems: { type: [String], default: [] },
    meetingTime: { type: [String], default: [] },
    meetingLocation: { type: Object },
    travelPrice: { type: Number, required: true },
    travelFAQ: { type: [Object], default: [] },
    reviews: [{ type: Schema.Types.ObjectId, ref: 'Review', default: [] }],
    bookmark: [{ type: Schema.Types.ObjectId, default: [] }],
    createdAt: { type: Date, default: Date.now, required: true },
    updatedAt: { type: Date, default: Date.now, required: true },
    teamId: [{ type: Schema.Types.ObjectId, ref: 'Team', default: [] }],
    travelTotalScore: { type: Number },
    travelActive: { type: Boolean, default: true },
    reviewWrite: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const Travel = mongoose.model<ITravel>('Travel', TravelSchema);

const ReviewSchema: Schema<IReview> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    travelId: { type: Schema.Types.ObjectId, required: true, ref: 'Travel' },
    reviewImg: { type: [String], default: [] },
    createdDate: { type: Date, default: Date.now },
    content: { type: String, required: true },
    travelScore: { type: Number, required: true },
  },
  { timestamps: true },
);

export const Review = mongoose.model<IReview>('Review', ReviewSchema);

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
  },
  { timestamps: true, id: false, _id: true },
);

export const User = mongoose.model<IUser>('User', UserSchema);
