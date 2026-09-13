/** Maps a NotificationPreference doc to its safe response shape (no internal FK). */
export function toNotificationPreferenceDTO(pref) {
  return {
    id: pref._id,
    foodCategory: pref.foodCategory,
    isVegetarian: pref.isVegetarian,
    priceRangeMin: pref.priceRangeMin,
    priceRangeMax: pref.priceRangeMax,
    city: pref.city,
  };
}

/** Maps a list of NotificationPreference docs. */
export function toNotificationPreferenceDTOList(list) {
  return list.map(toNotificationPreferenceDTO);
}
