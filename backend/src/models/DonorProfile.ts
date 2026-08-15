import mongoose, { Schema } from "mongoose";
import { v4 as uuidv4 } from "uuid";

const DonorProfileSchema = new Schema({
  id: {
    type: String,
    required: true,
    default: uuidv4,
  },
  userId: {
    type: String,
    required: true,
    ref: "User",
  },
  taxCode: {
    type: String,
    unique: true,
    required: true,
  },
  city: {
    type: String,
  },
  avatarUrl: {
    type: String,
  },
  location: {
    type: {
      type: String,
      enum: ["Point"],
      required: true,
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  },
});
DonorProfileSchema.index({ location: "2dsphere" });
export const DonorProfile = mongoose.model("DonorProfile", DonorProfileSchema);
