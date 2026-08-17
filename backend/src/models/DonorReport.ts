import mongoose, { Schema } from "mongoose";
import { v4 as uuidv4 } from "uuid";

export enum ReportType {
  ByCategory = "ByCategory",
  ByMeasurementUnit = "ByMeasurementUnit",
  DashboardSummary = "DashboardSummary",
}

export interface IDonorReport {
  _id: string;
  donorProfileId: string;
  reportType: string;
  totalDonatedQuantity: Number;
  totalRevenue: Number;
  periodStart: Date;
  periodEnd: Date | null;
  generatedAt: Date;
}

const DonorReportSchema = new Schema<IDonorReport>({
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
export const DonorReport = mongoose.model<IDonorReport>(
  "DonorReport",
  DonorReportSchema,
);
