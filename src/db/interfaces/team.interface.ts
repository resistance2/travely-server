import { Types } from 'mongoose';
import { ITimestamps } from './common.interface';

export interface IAppliedUser {
  userId: Types.ObjectId;
  appliedAt: Date;
  status: 'waiting' | 'approved' | 'rejected';
}

export interface ITeam extends ITimestamps {
  travelId: Types.ObjectId;
  personLimit: number;
  appliedUsers: IAppliedUser[];
  travelStartDate: Date;
  travelEndDate: Date;
}
