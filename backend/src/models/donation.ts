import mongoose, { Schema } from "mongoose";
import { v4 as uuidv4 } from "uuid";
import { foodCategory } from "./NotificationPreference.js";
export enum MeasurementUnit {
  KG = "KG",
  G = "G",
  L = "L",
  ML = "ML",
  Unit = "Unit",
  PerRequest = "PerRequest",
}
export enum DonationStatus {
  Active = "Active",
  Paused = "Paused",
  PendingCancellation = "PendingCancellation",
  Cancelled = "Cancelled",
  SoldOut = "SoldOut",
}
export interface IDonation {
  _id: string;
  donorProfileId: string;
  name: string;
  description?: string;
  measurementUnit: string;
  foodCategory?: foodCategory;
  isVegetarian?: boolean | null;
  donationLimit: number;
  price: number;
  remainingQuantity: number;
  ration: number;
  status?: DonationStatus;
  revenue: number;
  createdAt: Date;
  closedAt?: Date | null;
}
const DonationSchema = new Schema<IDonation>({
  _id: {
    type: String,
    required: true,
    default: () => uuidv4(),
  },
  donorProfileId: {
    type: String,
    ref: "DonorProfile",
    required: true,
    index: true,
  },
  name: {
    type: String,
    unique: true,
    index: true,
    required: true,
  },
  description: {
    type: String,
  },
  measurementUnit: {
    type: String,
    enum: Object.values(MeasurementUnit),
  },
  foodCategory: {
    type: String,
    enum: Object.values(foodCategory),
  },
  isVegetarian: {
    type: Boolean,
    default: null,
  },
  donationLimit: {
    type: Number,
    default: 0,
  },
  price: {
    type: Number,
    default: 0,
    min: 0,
  },
  remainingQuantity: {
    type: Number,
    default: 0,
    min: 0,
  },
  ration: {
    type: Number,
    default: 0,
    min: 0,
  },
  status: {
    type: String,
    enum: Object.values(DonationStatus),
  },
  revenue: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
  },
  closedAt: {
    type: Date,
    default: null,
  },
});

export const Donation = mongoose.model<IDonation>("Donation", DonationSchema);
