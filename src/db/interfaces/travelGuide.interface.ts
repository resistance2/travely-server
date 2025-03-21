import { Types } from 'mongoose';
import { ISoftDelete, ITimestamps } from './common.interface';

export interface ITravelGuide extends ITimestamps, ISoftDelete {
  userId: Types.ObjectId;
  thumbnail: string | null;
  travelTitle: string;
  travelContent: string;
  bookmark: Types.ObjectId[];
  teamId: Types.ObjectId[];
}
