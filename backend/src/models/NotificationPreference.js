import mongoose, { Schema } from "mongoose";
import { v4 as uuidv4 } from "uuid";
export const foodCategory = {
  Fruit: "Fruit",
  Vegetable: "Vegetable",
  Meat: "Meat",
  CookedDish: "CookedDish",
  BakedGoods: "BakedGoods",
  Drink: "Drink",
};

const NotificationPreferenceSchema =
  new Schema() <
  INotificationPreference >
  {
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
      enum: Object.values(foodCategory),
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
  };
export const NotificationPreference = mongoose.model(
  "NotificationPreference",
  NotificationPreferenceSchema,
);
