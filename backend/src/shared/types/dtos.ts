import { v4 as uuidv4 } from "uuid";
export type EntityID = string;

export interface CreateListingInput {
  name: string;
  description?: string;
  measurementUnit: "KG" | "G" | "L" | "ML" | "Unit" | "PerRequest";
  foodCategory:
    "Fruit" | "Vegetables" | "Meat" | "CookedDish" | "BakedGoods" | "Drink";
  isVegetarian?: boolean;
  donationLimit?: Number;
  price: Number;
  remaininQuantity: Number;
  location?: { type: "Point"; coordinates: [number, number] };
}
export interface FoodListing extends CreateListingInput {
  id: string;
  donorProfileId: string;
  status: "Active" | "Paused" | "PendingCancellation" | "Cancelled" | "SoldOut";
  createAt: Date;
  closedAt: Date;
}

export interface ManualDonationInput {
  name: string;
  foodCategory: CreateListingInput["foodCategory"];
  measurementUnit: CreateListingInput["measurementUnit"];
  quantity: Number;
  recipientDescription: string;
}
export interface DonationTransactionDTO {
  id: string;
  donorProfileId: string;
  name: string;
  foodCategory: CreateListingInput["foodCategory"];
  measurementUnit: CreateListingInput["measurementUnit"];
  quantity: Number;
  createAt: Date;
}

export interface DonorReportDTO {
  id: string;
  donorProfileId: string;
  reportType: "ByCategory" | "ByMeasurementUnit" | "DashboardSummary";
  periodStart: Date;
  periodEnd: Date;
  totalDonatedQuantity: Number;
  totalRevenue: Number;
  generatedAt: Date;
  items: DonorReportDTO[];
}
export interface DonorReportItemDTO {
  id: string;
  donorProfileId: string;
  foodCategory: CreateListingInput["foodCategory"];
  measurementUnit: CreateListingInput["measurementUnit"];
  donatedQuantity: Number;
  revenue: Number;
  donationCount: Number;
}
uuidv4();
