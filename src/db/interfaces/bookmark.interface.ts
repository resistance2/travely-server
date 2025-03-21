import { Types } from 'mongoose';
import { ISoftDelete, ITimestamps } from './common.interface';

export interface IBookmark {
  userId: Types.ObjectId;
  travelId: Types.ObjectId;
  bookmarkAt: Date;
}
