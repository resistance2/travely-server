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
  reviews?: mongoose.Types.ObjectId[];
  bookmark?: mongoose.Types.ObjectId[];
  createAt: Date;
  updateAt: Date;
  teamId?: mongoose.Types.ObjectId[];
  travelTotalScore?: number;
}

const TravelSchema: Schema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
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
    reviews: [{ type: Schema.Types.ObjectId, ref: 'Review', default: [] }],
    bookmark: [{ type: Schema.Types.ObjectId, ref: 'User', default: [] }],
    createAt: { type: Date, default: Date.now, required: true },
    updateAt: { type: Date, default: Date.now, required: true },
    teamId: [{ type: Schema.Types.ObjectId, ref: 'Team', default: [] }],
    travelTotalScore: { type: Number },
  },
  { timestamps: true },
);

export const Travel = mongoose.model<ITravel>('Travel', TravelSchema);
