/**
 * Domain constants shared across the app (SRS A.1.4).
 * Mirrors the backend business rules — see docs/BUSINESS_RULES.md §2.
 */

export const USER_ROLES = Object.freeze({
  RECIPIENT: 'Recipient',
  DONOR: 'Donor',
  ADMIN: 'Admin',
})

export const ACCOUNT_STATUS = Object.freeze({
  ACTIVE: 'Active',
  DEACTIVATED: 'Deactivated',
})

// Fixed six food categories (BUSINESS_RULES §2).
export const FOOD_CATEGORIES = Object.freeze([
  'Fruit',
  'Vegetable',
  'Meat',
  'Cooked Dish',
  'Baked Goods',
  'Drink',
])

// Fixed measurement units (BUSINESS_RULES §2).
export const MEASUREMENT_UNITS = Object.freeze(['kg', 'g', 'L', 'ml', 'Unit'])

// Price rule: either free, or an integer strictly greater than 1000 VND.
export const MIN_PAID_PRICE_VND = 1000

// Premium subscription price.
export const PREMIUM_PRICE_USD = 5

// Vietnamese cities/municipalities (dropdown source — BUSINESS_RULES §2).
export const VN_CITIES = Object.freeze([
  'Ho Chi Minh City',
  'Ha Noi',
  'Da Nang',
  'Hai Phong',
  'Can Tho',
  'Bien Hoa',
  'Hue',
  'Nha Trang',
  'Buon Ma Thuot',
  'Vung Tau',
])

// Password policy surfaced in the register form (mirrors backend validation).
export const PASSWORD_RULES = Object.freeze({
  minLength: 8,
  requireNumber: true,
  requireSpecial: true,
  requireUppercase: true,
})
