import { Types } from 'mongoose';
import { ISoftDelete, ITimestamps } from './common.interface';

export interface IComment extends ITimestamps, ISoftDelete {
  userId: Types.ObjectId;
  travelId: Types.ObjectId;
  comment: string;
}
