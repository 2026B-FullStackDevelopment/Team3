import mongoose, { Schema } from "mongoose";
import { v4 as uuidv4 } from "uuid";
import { foodCategory } from "../../notifications/models/NotificationPreference.js";
export const MeasurementUnit = {
  KG: "KG",
  G: "G",
  L: "L",
  ML: "ML",
  Unit: "Unit",
  PerRequest: "PerRequest",
};
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
};

export const Donation = mongoose.model("Donation", DonationSchema);
