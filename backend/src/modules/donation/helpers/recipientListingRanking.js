import { ValidationError } from "../../../shared/errors/errors.js";

export function normalizeCoordinates(filters) {
  if (filters.latitude === undefined && filters.longitude === undefined) {
    return null;
  }
  const latitude = Number(filters.latitude);
  const longitude = Number(filters.longitude);
  if (
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90 ||
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180
  ) {
    throw new ValidationError(
      "latitude and longitude must be valid coordinates",
    );
  }
  return { latitude, longitude };
}

export function matchesPreference(listing, donor, preference) {
  return (
    preference.foodCategory.includes(listing.foodCategory) &&
    (preference.isVegetarian == null ||
      preference.isVegetarian === listing.isVegetarian) &&
    listing.price >= preference.priceRangeMin &&
    listing.price <= preference.priceRangeMax &&
    donor?.city?.localeCompare(preference.city, undefined, {
      sensitivity: "accent",
    }) === 0
  );
}

export function isSameMunicipality(left, right) {
  if (!left || !right) return false;
  return left.localeCompare(right, undefined, { sensitivity: "accent" }) === 0;
}

export function distanceKm(origin, donor) {
  const [longitude, latitude] = donor?.location?.coordinates ?? [];
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return Infinity;
  }
  const radians = (degrees) => (degrees * Math.PI) / 180;
  const latDelta = radians(latitude - origin.latitude);
  const lonDelta = radians(longitude - origin.longitude);
  const a =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(radians(origin.latitude)) *
      Math.cos(radians(latitude)) *
      Math.sin(lonDelta / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
