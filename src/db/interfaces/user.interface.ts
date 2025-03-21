import { Types } from 'mongoose';
import { ITimestamps } from './common.interface';

export interface IUser extends ITimestamps {
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
  userScore: number;
  backAccount: {
    bankCode: string;
    accountNumber: string;
  };
}
