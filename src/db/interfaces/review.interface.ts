import { Types } from 'mongoose';
import { ISoftDelete } from './common.interface';

export interface IReview extends ISoftDelete {
  userId: Types.ObjectId;
  title: string;
  content: string;
  travelId: Types.ObjectId;
  reviewImg: string[];
  createdDate: Date;
  travelScore: number;
}
