import mongoose, { Schema } from "mongoose";
import { v4 as uuidv4 } from "uuid";
import { FoodCategory } from "../../../shared/constants/foodCategory.js";
import { MeasurementUnit } from "../../donation/models/donation.model.js";

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
    enum: Object.values(FoodCategory),
  },
  measurementUnit: {
    type: String,
    enum: Object.values(MeasurementUnit),
  },
  donatedQuantity: {
    type: Number,
    default: 0,
    min: 0,
  },
  donationCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  revenue: {
    type: Number,
    default: 0,
    min: 0,
  },
});
export const DonorReportItem = mongoose.model(
  "DonorReportItem",
  DonorReportItemSchema,
);
