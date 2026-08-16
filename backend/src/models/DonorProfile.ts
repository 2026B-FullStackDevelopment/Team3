import mongoose, { Schema, type StringSchemaDefinition } from "mongoose";
import { v4 as uuidv4 } from "uuid";

export interface IDonorProfile {
  _id: string;
  userId: string;
  taxCode: string;
  companyName: string;
  city?: string;
  avatarUrl?: string;
  address: string;
  location: {
    type: "Point";
    coordinates: number[];
  };
}

const DonorProfileSchema = new Schema<IDonorProfile>({
  _id: {
    type: String,
    required: true,
    default: () => uuidv4(),
  },
  userId: {
    type: String,
    required: true,
    ref: "User",
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
export const DonorProfile = mongoose.model<IDonorProfile>(
  "DonorProfile",
  DonorProfileSchema,
);
