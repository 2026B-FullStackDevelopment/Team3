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

// Vietnam's 63 provinces/municipalities — MUST match the backend's canonical
// list (backend/src/shared/constants/vietnamCities.js), which register validates
// against via isVietnamCity. Feeds the City dropdown (SRS 1A.1.4 / 1B.1.4).
export const VN_CITIES = Object.freeze([
  'Hanoi',
  'Ho Chi Minh City',
  'Hai Phong',
  'Da Nang',
  'Can Tho',
  'An Giang',
  'Ba Ria - Vung Tau',
  'Bac Giang',
  'Bac Kan',
  'Bac Lieu',
  'Bac Ninh',
  'Ben Tre',
  'Binh Dinh',
  'Binh Duong',
  'Binh Phuoc',
  'Binh Thuan',
  'Ca Mau',
  'Cao Bang',
  'Dak Lak',
  'Dak Nong',
  'Dien Bien',
  'Dong Nai',
  'Dong Thap',
  'Gia Lai',
  'Ha Giang',
  'Ha Nam',
  'Ha Tinh',
  'Hai Duong',
  'Hau Giang',
  'Hoa Binh',
  'Hung Yen',
  'Khanh Hoa',
  'Kien Giang',
  'Kon Tum',
  'Lai Chau',
  'Lam Dong',
  'Lang Son',
  'Lao Cai',
  'Long An',
  'Nam Dinh',
  'Nghe An',
  'Ninh Binh',
  'Ninh Thuan',
  'Phu Tho',
  'Phu Yen',
  'Quang Binh',
  'Quang Nam',
  'Quang Ngai',
  'Quang Ninh',
  'Quang Tri',
  'Soc Trang',
  'Son La',
  'Tay Ninh',
  'Thai Binh',
  'Thai Nguyen',
  'Thanh Hoa',
  'Thua Thien Hue',
  'Tien Giang',
  'Tra Vinh',
  'Tuyen Quang',
  'Vinh Long',
  'Vinh Phuc',
  'Yen Bai',
])

// Password policy surfaced in the register form (mirrors backend validation).
export const PASSWORD_RULES = Object.freeze({
  minLength: 8,
  requireNumber: true,
  requireSpecial: true,
  requireUppercase: true,
})

// Avatar upload rules — mirror the backend (middleware/upload.js): JPEG/PNG/WebP,
// 2 MB max. The frontend validates on pick for fast feedback; the backend still
// enforces (incl. magic-byte sniffing) as the security boundary.
export const AVATAR_ALLOWED_MIME_TYPES = Object.freeze(['image/jpeg', 'image/png', 'image/webp'])
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024
