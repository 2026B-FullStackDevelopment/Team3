/**
 * Food categories shared by Donation, Notification, and Donor Report.
 * Kept outside feature modules so no bounded context owns global vocabulary.
 */
export const FoodCategory = Object.freeze({
  Fruit: "Fruit",
  Vegetable: "Vegetable",
  Meat: "Meat",
  CookedDish: "CookedDish",
  BakedGoods: "BakedGoods",
  Drink: "Drink",
});
