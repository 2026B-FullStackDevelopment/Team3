import { Schema } from "mongoose";
import { v4 as uuidv4 } from "uuid";
export enum foodCategory {
  Fruit = "Fruit",
  Vegetable = "Vegetable",
  Meat = "Meat",
}
const NotificationPreference = new Schema({
  id: {
    type: String,
    required: true,
  },
  recipientProfileId: {
    type: String,
    required: true,
    ref: "User",
  },
  foodCategory: {
    type: String,
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
});
