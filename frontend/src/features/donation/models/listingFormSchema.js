import { z } from "zod";
import {
  FoodCategory,
  MeasurementUnit,
  validateDonationImage,
} from "@/features/donation/models/donation.js";

/** Creates the listing validation rules for create, edit, or duplicate mode. */
export function createListingFormSchema(mode) {
  return z
    .object({
      name: z.string().trim().min(1, "Listing name is required."),
      description: z
        .string()
        .max(500, "Description must be 500 characters or fewer."),
      foodCategory: z.enum(Object.values(FoodCategory)),
      measurementUnit: z.enum(Object.values(MeasurementUnit)),
      isVegetarian: z.enum(["unspecified", "yes", "no"]),
      remainingQuantity: z.coerce
        .number()
        .min(0, "Quantity cannot be negative."),
      donationLimit: z.coerce
        .number()
        .min(0, "Donation limit cannot be negative."),
      ration: z.coerce.number().min(0, "Ration cannot be negative."),
      price: z.coerce.number().min(0, "Price cannot be negative."),
      image: z.any().nullable().optional(),
    })
    .superRefine((values, context) => {
      if (mode === "create") {
        const imageError = validateDonationImage(values.image);
        if (imageError) {
          context.addIssue({
            code: "custom",
            path: ["image"],
            message: imageError,
          });
        }
      }

      // Per Request listings are created/duplicated with quantity 1 by the
      // payload builder, but an existing sold-out listing legitimately has 0.
      if (
        values.measurementUnit !== MeasurementUnit.PER_REQUEST &&
        values.remainingQuantity <= 0
      ) {
        context.addIssue({
          code: "custom",
          path: ["remainingQuantity"],
          message: "Quantity must be greater than zero.",
        });
      }

      if (
        values.measurementUnit === MeasurementUnit.UNIT &&
        !Number.isInteger(values.remainingQuantity)
      ) {
        context.addIssue({
          code: "custom",
          path: ["remainingQuantity"],
          message: "Per Unit quantity must be a whole number.",
        });
      }

      if (values.ration > 0 && values.ration > values.remainingQuantity) {
        context.addIssue({
          code: "custom",
          path: ["ration"],
          message: "Ration cannot exceed remaining quantity.",
        });
      }

      if (values.donationLimit > 0 && values.ration > values.donationLimit) {
        context.addIssue({
          code: "custom",
          path: ["ration"],
          message: "Ration cannot exceed donation limit.",
        });
      }
    });
}

export const listingFormDefaults = {
  name: "",
  description: "",
  foodCategory: FoodCategory.FRUIT,
  measurementUnit: MeasurementUnit.KG,
  isVegetarian: "unspecified",
  remainingQuantity: 1,
  donationLimit: 1,
  ration: 0,
  price: 0,
  image: null,
};
