import mongoose, { Schema } from "mongoose";
import { v4 as uuidv4 } from "uuid";
import { foodCategory } from "./NotificationPreference.js";
import { MeasurementUnit } from "./Donation.js";

export interface IDonorReportItem {
  _id: string;
  donorReportId: string;
  foodCategory: string;
  measurementUnit: string;
  donatedQuantity: Number;
  revenue: Number;
  donationCount: Number;
}

const DonorReportItemSchema = new Schema<IDonorReportItem>({
  _id: {
    type: String,
    required: true,
    default: () => uuidv4(),
  },
  donorReportId: {
    type: String,
    required: true,
    ref: "DonorReport",
  },
  foodCategory: {
    type: String,
    enum: Object.values(foodCategory),
  },
  measurementUnit: {
    type: String,
    enum: Object.values(MeasurementUnit),
  },
  donatedQuantity: {
    type: Number,
  },
  donationCount: {
    type: Number,
  },
  revenue: {
    type: Number,
  },
});
export const DonorReportItem = mongoose.model<IDonorReportItem>(
  "DonorReportItem",
  DonorReportItemSchema,
);
