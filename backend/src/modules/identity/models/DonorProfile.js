import mongoose, { Schema } from "mongoose";
import { v4 as uuidv4 } from "uuid";

const DonorProfileSchema = new Schema({
  _id: {
    type: String,
    default: () => uuidv4(),
  },

  userId: {
    type: String,
    required: true,
    ref: "User",
    index: true,
  },

  companyName: {
    type: String,
  },

  taxCode: {
    type: String,
    unique: true,
    required: true,
  },

  city: {
    type: String,
  },

  address: {
    type: String,
  },

  avatarUrl: {
    type: String,
    default: null,
  },

  location: {
    type: {
      type: String,
      enum: ["Point"],
      required: true,
      default: "Point",
    },

    coordinates: {
      type: [Number],
      required: true,
    },
  },
});

DonorProfileSchema.index({ location: "2dsphere" });

export const DonorProfile = mongoose.model("DonorProfile", DonorProfileSchema);
