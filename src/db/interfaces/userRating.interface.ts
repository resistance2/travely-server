import { Types } from 'mongoose';
import { ISoftDelete, ITimestamps } from './common.interface';

export interface IUserRating extends ITimestamps, ISoftDelete {
  fromUserId: Types.ObjectId; // 평가를한 유저
  toUserId: Types.ObjectId; // 평가를 받은 유저
  userScore: number;
  createdAt: Date;
}
