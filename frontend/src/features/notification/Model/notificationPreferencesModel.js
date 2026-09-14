// FE display labels ↔ backend enum. Only these two differ (spaces removed).
const LABEL_TO_ENUM = { 'Cooked Dish': 'CookedDish', 'Baked Goods': 'BakedGoods' }
const ENUM_TO_LABEL = { CookedDish: 'Cooked Dish', BakedGoods: 'Baked Goods' }

/** Display label → backend enum value. */
export function categoryToEnum(label) {
  return LABEL_TO_ENUM[label] ?? label
}

/** Backend enum value → display label. */
export function enumToLabel(value) {
  return ENUM_TO_LABEL[value] ?? value
}

/** A backend preference DTO → the view-model (display-label categories). */
export function formatPreference(pref) {
  return {
    id: pref.id,
    categories: (pref.foodCategory ?? []).map(enumToLabel),
    isVegetarian: pref.isVegetarian,
    priceRangeMin: pref.priceRangeMin,
    priceRangeMax: pref.priceRangeMax,
    city: pref.city,
  }
}

/** Maps a list of preferences (order preserved). */
export function formatPreferences(list) {
  return (list ?? []).map(formatPreference)
}

/** Form values → the backend request body. */
export function toPreferencePayload(form) {
  return {
    foodCategory: form.categories.map(categoryToEnum),
    isVegetarian: form.vegetarian === 'vegetarian',
    priceRangeMin: Number(form.min),
    priceRangeMax: Number(form.max),
    city: form.city,
  }
}
