import { Types } from 'mongoose';

/**
 * Common interfaces for database models
 */

export interface ITimestamps {
  createdAt: Date;
  updatedAt: Date;
}

export interface ISoftDelete {
  isDeleted: boolean;
}

export interface IReference {
  ref: string;
  type: typeof Types.ObjectId;
}
