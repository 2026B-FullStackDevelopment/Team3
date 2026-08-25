import { DonorReportItem } from "../models/DonorReportItem.js";

export async function create(data) {
  return DonorReportItem.create(data);
}

export async function createMany(items) {
  if (items.length === 0) return [];

  return DonorReportItem.insertMany(items);
}

export async function findById(id) {
  return DonorReportItem.findById(id);
}

export async function findByReportId(donorReportId) {
  return DonorReportItem.find({ donorReportId });
}

export async function replaceForReport(donorReportId, items = []) {
  await DonorReportItem.deleteMany({ donorReportId });

  if (items.length === 0) return [];

  return DonorReportItem.insertMany(
    items.map((item) => ({
      ...item,
      donorReportId,
    })),
  );
}

export async function deleteByReportId(donorReportId) {
  return DonorReportItem.deleteMany({ donorReportId });
}
