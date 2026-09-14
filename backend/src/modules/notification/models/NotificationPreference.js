import mongoose, { Schema } from "mongoose";
import { v4 as uuidv4 } from "uuid";
import { FoodCategory } from "../../../shared/constants/foodCategory.js";

const NotificationPreferenceSchema = new Schema({
  _id: {
    type: String,
    required: true,
    default: () => uuidv4(),
  },
  recipientProfileId: {
    type: String,
    required: true,
    ref: "RecipientProfile",
  },
  foodCategory: {
    type: [String],
    enum: Object.values(FoodCategory),
  },
  isVegetarian: {
    type: Boolean,
  },
  priceRangeMin: {
    type: Number,
    min: 0,
    default: 0,
    required: true,
  },
  priceRangeMax: {
    type: Number,
    min: 0,
    default: 0,
    required: true,
  },
  city: {
    type: String,
  },
}, { timestamps: true });
export const NotificationPreference = mongoose.model(
  "NotificationPreference",
  NotificationPreferenceSchema,
);
