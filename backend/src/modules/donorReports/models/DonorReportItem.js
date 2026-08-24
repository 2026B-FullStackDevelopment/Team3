import mongoose, { Schema } from "mongoose";
import { v4 as uuidv4 } from "uuid";
import { foodCategory } from "../../notifications/models/NotificationPreference.js";
import { MeasurementUnit } from "../../donations/models/donation.js";

const DonorReportItemSchema = new Schema({
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
export const DonorReportItem = mongoose.model(
  "DonorReportItem",
  DonorReportItemSchema,
);
