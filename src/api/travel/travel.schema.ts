import mongoose, { Schema, Document } from 'mongoose';

export interface ITravel extends Document {
  id: string;
  userId: mongoose.Types.ObjectId;
  thumbnail: string;
  travelTitle: string;
  travelContent: object;
  tag: string[];
  travelCourse: string[];
  includedItems?: string[];
  excludedItems?: string[];
  meetingTime?: string[];
  meetingLocation?: object;
  travelPrice: number;
  travelFAQ?: object[];
  reviews?: string[];
  bookmark?: string[];
  createAt: Date;
  updateAt: Date;
  teamId?: string[];
  travelTotalScore?: number;
}

const TravelSchema: Schema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    userId: { type: [String], required: true, ref: 'User' },
    thumbnail: { type: String, required: true },
    travelTitle: { type: String, required: true },
    travelContent: { type: Object, required: true },
    tag: { type: [String], required: true, default: [] },
    travelCourse: { type: [String], required: true, default: [] },
    includedItems: { type: [String], default: [] },
    excludedItems: { type: [String], default: [] },
    meetingTime: { type: [String], default: [] },
    meetingLocation: { type: Object },
    travelPrice: { type: Number, required: true },
    travelFAQ: { type: [Object], default: [] },
    reviews: [{ type: [String], ref: 'Review', default: [] }],
    bookmark: [{ type: [String], ref: 'User', default: [] }],
    createAt: { type: Date, default: Date.now, required: true },
    updateAt: { type: Date, default: Date.now, required: true },
    teamId: [{ type: [String], ref: 'Team', default: [] }],
    travelTotalScore: { type: Number },
  },
  { timestamps: true },
);

export const Travel = mongoose.model<ITravel>('Travel', TravelSchema);
