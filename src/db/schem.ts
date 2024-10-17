import mongoose, { Schema, Document } from 'mongoose';

export interface ITravel extends Document {
  id: string;
  userId: mongoose.Types.ObjectId;
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
  reviews?: mongoose.Types.ObjectId[];
  bookmark?: mongoose.Types.ObjectId[];
  createAt: Date;
  updateAt: Date;
  teamId?: mongoose.Types.ObjectId[];
  travelTotalScore?: number;
}

const TravelSchema: Schema = new Schema(
  {
    id: { type: String, required: true, unique: true },
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
    bookmark: [{ type: Schema.Types.ObjectId, ref: 'User', default: [] }],
    createAt: { type: Date, default: Date.now, required: true },
    updateAt: { type: Date, default: Date.now, required: true },
    teamId: [{ type: Schema.Types.ObjectId, ref: 'Team', default: [] }],
    travelTotalScore: { type: Number },
  },
  { timestamps: true },
);

export const Travel = mongoose.model<ITravel>('Travel', TravelSchema);

export interface IReview extends Document {
  id: string;
  userId: mongoose.Types.ObjectId;
  travelId: mongoose.Types.ObjectId;
  reviewImg?: string[];
  createdDate: Date;
  content: string;
  travelScore: number;
}

const ReviewSchema: Schema = new Schema(
  {
    id: { type: String, required: true, unique: true },
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

export interface IAppliedUser {
  userId: mongoose.Types.ObjectId;
  appliedAt: Date;
  status: 'waiting' | 'approved' | 'rejected';
}

export const AppliedUserSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  appliedAt: { type: Date, default: Date.now, required: true },
  status: {
    type: String,
    enum: ['waiting', 'approved', 'rejected'],
    default: 'waiting',
    required: true,
  },
});

export interface ITeam extends Document {
  id: string;
  travelId: mongoose.Types.ObjectId;
  personLimit: number;
  appliedUsers: IAppliedUser[];
  travelStartDate: Date;
  travelEndDate: Date;
}

const TeamSchema: Schema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    travelId: { type: Schema.Types.ObjectId, required: true, ref: 'Travel' },
    personLimit: { type: Number, required: true },
    appliedUsers: [AppliedUserSchema],
    travelStartDate: { type: Date, required: true },
    travelEndDate: { type: Date, required: true },
  },
  { timestamps: true },
);

export const Team = mongoose.model<ITeam>('Team', TeamSchema);

export interface IUser extends Document {
  id: string;
  userProfileImage: string;
  userName: string;
  userId: string;
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
    userId: { type: String, required: true, unique: true },
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
