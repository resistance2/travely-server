import mongoose, { Schema, Types } from "mongoose";

export interface ITravel {
  userId: Types.ObjectId;
  thumbnail: string | null;
  travelTitle: string;
  travelContent: string;
  tag: string[];
  travelCourse: string[];
  includedItems: string[];
  excludedItems: string[];
  meetingTime: string[];
  meetingLocation: object;
  travelPrice: number;
  travelFAQ: string[];
  bookmark: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
  teamId: Types.ObjectId[];
  travelActive: boolean;
  reviewWrite: boolean;
  isDeleted: boolean;
  meetingPlace: string;
}

export interface ITravelGuide {
  userId: Types.ObjectId; // 글 작성자의 고유 ID (MongoDB ObjectId)
  thumbnail: string | null; // 게시글 썸네일 이미지 URL
  travelTitle: string; // 여행 게시글 제목
  travelContent: string; // 여행 게시글 본문 내용 (rich text 등 다양한 형식 지원)
  bookmark: Types.ObjectId[]; // 북마크한 사용자들의 ID 배열
  createdAt: Date; // 게시글 생성 일시
  updatedAt: Date; // 게시글 수정 일시
  teamId: Types.ObjectId[]; // 연관된 팀 정보들의 ID 배열 (1:N 관계)
  isDeleted: boolean; // 게시글 삭제 여부 플래그
}

export interface ITeam {
  travelId: Types.ObjectId; // 여행 일정 ID (MongoDB ObjectId)
  personLimit: number; // 모집 인원 제한
  appliedUsers: IAppliedUser[]; // 신청한 사용자들의 정보 배열
  travelStartDate: Date; // 여행 시작 날짜
  travelEndDate: Date; // 여행 종료 날짜
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
  status: "waiting" | "approved" | "rejected";
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
    userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    thumbnail: { type: String, required: true },
    travelTitle: { type: String, required: true },
    travelContent: { type: String, required: true },
    tag: { type: [String], required: true, default: [] },
    travelCourse: { type: [String], required: true, default: [] },
    includedItems: { type: [String], default: [] },
    excludedItems: { type: [String], default: [] },
    meetingTime: { type: [String], default: [] },
    meetingLocation: { type: Object },
    travelPrice: { type: Number, required: true },
    travelFAQ: { type: [String], default: [] },
    bookmark: [{ type: Schema.Types.ObjectId, default: [] }],
    createdAt: { type: Date, default: Date.now, required: true },
    updatedAt: { type: Date, default: Date.now, required: true },
    teamId: [{ type: Schema.Types.ObjectId, ref: "Team", default: [] }],
    travelActive: { type: Boolean, default: true },
    reviewWrite: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    meetingPlace: { type: String, required: true },
  },
  {
    timestamps: true,
    query: {
      isDeleted: false,
    },
  }
);

TravelSchema.pre(["find", "findOne"], function (next) {
  if (!Object.prototype.hasOwnProperty.call(this.getQuery(), "isDeleted")) {
    this?.where({ isDeleted: false });
  }
  next();
});

export const Travel = mongoose.model<ITravel>("Travel", TravelSchema);

const TravelGuideSchema: Schema<ITravelGuide> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    thumbnail: { type: String, required: true },
    travelTitle: { type: String, required: true },
    travelContent: { type: String, required: true },
    bookmark: [{ type: Schema.Types.ObjectId, default: [] }],
    createdAt: { type: Date, default: Date.now, required: true },
    updatedAt: { type: Date, default: Date.now, required: true },
    teamId: [{ type: Schema.Types.ObjectId, ref: "Team", default: [] }],
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    query: {
      isDeleted: false,
    },
  }
);

TravelGuideSchema.pre(["find", "findOne"], function (next) {
  if (!Object.prototype.hasOwnProperty.call(this.getQuery(), "isDeleted")) {
    this?.where({ isDeleted: false });
  }
  next();
});

export const TravelGuide = mongoose.model<ITravelGuide>(
  "TravelGuide",
  TravelGuideSchema
);

const ReviewSchema: Schema<IReview> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    travelId: { type: Schema.Types.ObjectId, required: true, ref: "Travel" },
    reviewImg: { type: [String], default: [] },
    createdDate: { type: Date, default: Date.now },
    content: { type: String, required: true },
    travelScore: { type: Number, required: true },
  },
  { timestamps: true }
);

export const Review = mongoose.model<IReview>("Review", ReviewSchema);

export const AppliedUserSchema: Schema<IAppliedUser> = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  appliedAt: { type: Date, default: Date.now, required: true },
  status: {
    type: String,
    enum: ["waiting", "approved", "rejected"],
    default: "waiting",
    required: true,
  },
});

const TeamSchema: Schema = new Schema(
  {
    travelId: { type: Schema.Types.ObjectId, required: true, ref: "Travel" },
    personLimit: { type: Number, required: true },
    appliedUsers: [AppliedUserSchema],
    travelStartDate: { type: Date, required: true },
    travelEndDate: { type: Date, required: true },
  },
  { timestamps: true }
);

export const Team = mongoose.model<ITeam>("Team", TeamSchema);

const UserSchema: Schema = new Schema(
  {
    userProfileImage: { type: String },
    socialName: { type: String, required: true, unique: true },
    userName: { type: String },
    userEmail: { type: String, unique: true },
    phoneNumber: { type: String },
    mbti: { type: String },
    myCreatedTravel: [
      { type: Schema.Types.ObjectId, ref: "Travel", default: [] },
    ],
    myPassedTravel: [
      { type: Schema.Types.ObjectId, ref: "Travel", default: [] },
    ],
    myReviews: [{ type: Schema.Types.ObjectId, ref: "Review", default: [] }],
    myBookmark: [{ type: Schema.Types.ObjectId, ref: "Travel", default: [] }],
    isVerifiedUser: { type: Boolean, default: false },
  },
  { timestamps: true, id: false, _id: true }
);

export const User = mongoose.model<IUser>("User", UserSchema);
