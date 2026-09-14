import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
import { FoodCategory } from "../../../shared/constants/foodCategory.js";
export const MeasurementUnit = {
  KG: "KG",
  G: "G",
  L: "L",
  ML: "ML",
  Unit: "Unit",
  PerRequest: "PerRequest",
};

export const PerRequestDonationWarning = [
  "Recipients may collect quantities at the discretion of the Donor",
  "Online reservation is not available for this donation",
  "Recipients may still visit the pickup location even after all food has been distributed",
];

export function isPerRequestMeasurementUnit(measurementUnit) {
  return measurementUnit === MeasurementUnit.PerRequest;
}

export function allowsOnlineReservationForMeasurementUnit(measurementUnit) {
  return !isPerRequestMeasurementUnit(measurementUnit);
}

export const DonationStatus = {
  Active: "Active",
  Paused: "Paused",
  PendingCancellation: "PendingCancellation",
  Cancelled: "Cancelled",
  SoldOut: "SoldOut",
};
export const DonationSchema = {
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
  // Every listing keeps the public URL produced by the image upload middleware.
  imageUrl: {
    type: String,
    required: true,
    trim: true,
  },
  measurementUnit: {
    type: String,
    enum: Object.values(MeasurementUnit),
  },
  foodCategory: {
    type: String,
    enum: Object.values(FoodCategory),
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
};

export const Donation = mongoose.model("Donation", DonationSchema);
