//Donation value type of BE for frontend
export const DonationStatus = Object.freeze({
  ACTIVE: "Active",
  PAUSED: "Paused",
  PENDING_CANCELLATION: "PendingCancellation",
  CANCELLED: "Cancelled",
  SOLD_OUT: "SoldOut",
});

export const MeasurementUnit = Object.freeze({
  KG: "KG",
  G: "G",
  L: "L",
  ML: "ML",
  UNIT: "Unit",
  PER_REQUEST: "PerRequest",
});

export const FoodCategory = Object.freeze({
  FRUIT: "Fruit",
  VEGETABLE: "Vegetable",
  MEAT: "Meat",
  COOKED_DISH: "CookedDish",
  BAKED_GOODS: "BakedGoods",
  DRINK: "Drink",
});

export const MAX_DONATION_IMAGE_BYTES = 5 * 1024 * 1024;
export const DONATION_IMAGE_TYPES = Object.freeze([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export function validateDonationImage(file) {
  if (!file) return "A food image is required.";
  if (!DONATION_IMAGE_TYPES.includes(file.type)) {
    return "Image must be a JPEG, PNG, or WebP file.";
  }
  if (file.size > MAX_DONATION_IMAGE_BYTES) {
    return "Image must be 5 MB or smaller.";
  }
  return null;
}

export const STATUS_LABELS = Object.freeze({
  [DonationStatus.ACTIVE]: "Active",
  [DonationStatus.PAUSED]: "Paused",
  [DonationStatus.PENDING_CANCELLATION]: "Pending Cancellation",
  [DonationStatus.CANCELLED]: "Cancelled",
  [DonationStatus.SOLD_OUT]: "Sold Out",
});

export const UNIT_LABELS = Object.freeze({
  [MeasurementUnit.KG]: "Kilograms",
  [MeasurementUnit.G]: "Grams",
  [MeasurementUnit.L]: "Litres",
  [MeasurementUnit.ML]: "Millilitres",
  [MeasurementUnit.UNIT]: "Per Unit",
  [MeasurementUnit.PER_REQUEST]: "Per Request",
});

export const CATEGORY_LABELS = Object.freeze({
  [FoodCategory.FRUIT]: "Fruit",
  [FoodCategory.VEGETABLE]: "Vegetable",
  [FoodCategory.MEAT]: "Meat",
  [FoodCategory.COOKED_DISH]: "Cooked Dish",
  [FoodCategory.BAKED_GOODS]: "Baked Goods",
  [FoodCategory.DRINK]: "Drink",
});

function assertWireValue(value, values, field) {
  if (!values.includes(value)) {
    throw new TypeError(`Unsupported ${field}: ${String(value)}`);
  }
  return value;
}

/**
 * @typedef {Object} DonationListing
 * @property {string} id
 * @property {string} donorProfileId
 * @property {string} name
 * @property {string} description
 * @property {string|null} imageUrl
 * @property {'KG'|'G'|'L'|'ML'|'Unit'|'PerRequest'} measurementUnit
 * @property {'Fruit'|'Vegetable'|'Meat'|'CookedDish'|'BakedGoods'|'Drink'} foodCategory
 * @property {boolean|null} isVegetarian
 * @property {number} donationLimit
 * @property {number} price
 * @property {number} remainingQuantity
 * @property {number} ration
 * @property {'Active'|'Paused'|'PendingCancellation'|'Cancelled'|'SoldOut'} status
 * @property {number} revenue
 * @property {string} createdAt
 * @property {string|null} closedAt
 * @property {{allowsOnlineReservation: boolean, warningMessages: string[]}} reservationPolicy
 */

export function normalizeDonationListing(transport) {
  const id = transport?.id ?? transport?._id;
  if (!id) throw new TypeError("Donation listing is missing an id.");

  return {
    id: String(id),
    donorProfileId: String(transport.donorProfileId ?? ""),
    name: String(transport.name ?? ""),
    description: String(transport.description ?? ""),
    imageUrl: transport.imageUrl ? String(transport.imageUrl) : null,
    measurementUnit: assertWireValue(
      transport.measurementUnit,
      Object.values(MeasurementUnit),
      "measurement unit",
    ),
    foodCategory: assertWireValue(
      transport.foodCategory,
      Object.values(FoodCategory),
      "food category",
    ),
    isVegetarian:
      transport.isVegetarian == null
        ? null
        : Boolean(transport.isVegetarian),
    donationLimit: Number(transport.donationLimit ?? 0),
    price: Number(transport.price ?? 0),
    remainingQuantity: Number(transport.remainingQuantity ?? 0),
    ration: Number(transport.ration ?? 0),
    status: assertWireValue(
      transport.status,
      Object.values(DonationStatus),
      "status",
    ),
    revenue: Number(transport.revenue ?? 0),
    createdAt: String(transport.createdAt ?? ""),
    closedAt: transport.closedAt == null ? null : String(transport.closedAt),
    reservationPolicy: {
      allowsOnlineReservation: Boolean(
        transport.reservationPolicy?.allowsOnlineReservation,
      ),
      warningMessages: Array.isArray(
        transport.reservationPolicy?.warningMessages,
      )
        ? transport.reservationPolicy.warningMessages.map(String)
        : [],
    },
  };
}
