import { MeasurementUnit } from "@/lib/donation.js";

/** Converts form values into the payload expected by the Donation API. */
export function buildListingPayload(values) {
  const perRequest = values.measurementUnit === MeasurementUnit.PER_REQUEST;

  return {
    name: values.name.trim(),
    description: values.description.trim(),
    foodCategory: values.foodCategory,
    measurementUnit: values.measurementUnit,
    isVegetarian:
      values.isVegetarian === "unspecified"
        ? null
        : values.isVegetarian === "yes",
    remainingQuantity: perRequest ? 1 : values.remainingQuantity,
    donationLimit: perRequest ? 0 : values.donationLimit,
    ration: perRequest ? 0 : values.ration,
    price: values.price > 0 && values.price < 1000 ? 0 : values.price,
  };
}

/** Builds a partial edit payload containing only fields changed by the user. */
export function buildEditListingPayload(values, dirtyFields) {
  const fullPayload = buildListingPayload(values);
  const payload = {};

  for (const field of Object.keys(fullPayload)) {
    if (dirtyFields[field]) payload[field] = fullPayload[field];
  }

  // Changing to Per Request also resets its non-editable inventory values.
  if (
    dirtyFields.measurementUnit &&
    values.measurementUnit === MeasurementUnit.PER_REQUEST
  ) {
    payload.remainingQuantity = 1;
    payload.donationLimit = 0;
    payload.ration = 0;
  }

  return payload;
}
