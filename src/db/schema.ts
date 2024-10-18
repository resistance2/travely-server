import mongoose, { Schema, Document } from 'mongoose';

export interface ITravel extends Document {
  id: string;
  userId: string;
  thumbnail: string;
  travelTitle: string;
  travelContent: object;
  tag: string[];
  travelCourse: string[];
  includedItems?: string[];
  excludedItems?: string[];
  meetingTime?: string[];
  meetingLocation?: object;
  travelPrice: number;
  travelFAQ?: object[];
  reviews?: string[];
  bookmark?: string[];
  createAt: Date;
  updateAt: Date;
  teamId?: string[];
  travelTotalScore?: number;
  travelActive: boolean;
  reviewWrite: boolean;
  isDeleted: boolean;
}

const TravelSchema: Schema = new Schema(
  {
    _id: { type: String, required: true },
    id: { type: String, required: true, unique: true },
    userId: { type: [String], required: true, ref: 'User' },
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
    reviews: [{ type: String, ref: 'Review', default: [] }],
    bookmark: [{ type: String }],
    createAt: { type: Date, default: Date.now, required: true },
    updateAt: { type: Date, default: Date.now, required: true },
    teamId: [{ type: [String], ref: 'Team', default: [] }],
    travelTotalScore: { type: Number },
    travelActive: { type: Boolean, default: true },
    reviewWrite: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const Travel = mongoose.model<ITravel>('Travel', TravelSchema);

export interface IReview extends Document {
  id: string;
  userId: string;
  travelId: string;
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

export interface IAppliedUser {
  userId: string;
  appliedAt: Date;
  status: 'waiting' | 'approved' | 'rejected';
}

export const AppliedUserSchema = new Schema({
  userId: { type: String, ref: 'User', required: true },
  appliedAt: { type: Date, default: Date.now, required: true },
  status: {
    type: String,
    enum: ['waiting', 'approved', 'rejected'],
    default: 'waiting',
    required: true,
  },
});

export interface ITeam extends Document {
  _id: string;
  id: string;
  travelId: string;
  personLimit: number;
  appliedUsers?: IAppliedUser[];
  travelStartDate: Date;
  travelEndDate: Date;
}

const TeamSchema: Schema = new Schema(
  {
    _id: { type: String, required: true },
    id: { type: String, required: true, unique: true },
    travelId: { type: String, required: true, ref: 'Travel' },
    personLimit: { type: Number, required: true },
    appliedUsers: [AppliedUserSchema],
    travelStartDate: { type: Date, required: true },
    travelEndDate: { type: Date, required: true },
  },
  { timestamps: true },
);

export const Team = mongoose.model<ITeam>('Team', TeamSchema);

export interface IUser extends Document {
  _id: string;
  id: string;
  userProfileImage: string;
  userName: string;
  userId: string;
  userEmail: string;
  phoneNumber: string;
  mbti: string;
  myCreatedTravel: string[];
  myPassedTravel: string[];
  myReviews: string[];
  myBookmark: mongoose.Types.ObjectId[];
}

const UserSchema: Schema = new Schema(
  {
    _id: { type: String, required: true },
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
