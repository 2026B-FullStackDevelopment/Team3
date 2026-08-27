import mongoose, { Schema } from "mongoose";
import { v4 as uuidv4 } from "uuid";

export const ReportType = {
  ByCategory: "ByCategory",
  ByMeasurementUnit: "ByMeasurementUnit",
  DashboardSummary: "DashboardSummary",
};

const DonorReportSchema = new Schema({
  _id: {
    type: String,
    required: true,
    default: () => uuidv4(),
  },
  donorProfileId: {
    type: String,
    required: true,
    ref: "User",
  },
  reportType: {
    type: String,
    enum: Object.values(ReportType),
  },
  totalDonatedQuantity: {
    type: Number,
  },
  totalRevenue: {
    type: Number,
  },
  periodEnd: {
    type: Date,
    default: null,
  },
  periodStart: {
    type: Date,
  },
  generatedAt: {
    type: Date,
  },
});
export const DonorReport = mongoose.model("DonorReport", DonorReportSchema);
