import { Types } from 'mongoose';
import { ISoftDelete, ITimestamps } from './common.interface';

export interface ITravel extends ITimestamps, ISoftDelete {
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
  travelFAQ: { question: string; answer: string }[] | null;
  teamId: Types.ObjectId[];
  travelActive: boolean;
  reviewWrite: boolean;
  meetingPlace: string | null;
}
