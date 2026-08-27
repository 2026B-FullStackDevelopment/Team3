import { DonorReport } from "../models/DonorReport.model.js";
import * as donorReportItemsRepository from "./donorReportItems.repository.js";

export async function create(data) {
  return DonorReport.create(data);
}

export async function findReportById(id) {
  return DonorReport.findById(id);
}
export async function findReportsByDonor(donorProfileId) {
  return (await DonorReport.find({ donorProfileId })).sort({
    generatedAt: -1,
  });
}
export async function updateReport(id, data) {
  return DonorReport.findByIdAndUpdate(
    id,
    {
      $set: data,
    },
    { new: true, runValidators: true },
  );
}
export async function deleteReport(id) {
  return DonorReport.findByIdAndDelete(id);
}
export async function createReportItem(data) {
  return donorReportItemsRepository.create(data);
}
export async function createReportItems(items) {
  return donorReportItemsRepository.createMany(items);
}
export async function findItemsByReport(donorReportId) {
  return donorReportItemsRepository.findByReportId(donorReportId);
}
export async function deleteItemsByReport(donorReportId) {
  return donorReportItemsRepository.deleteByReportId(donorReportId);
}
export async function findReportWithItems(id) {
  const [report, items] = await Promise.all([
    DonorReport.findById(id),
    donorReportItemsRepository.findByReportId(id),
  ]);
  if (!report) return null;

  return {
    report,
    items,
  };
}
export async function createReportWithItems(reportData, itemsData = []) {
  const report = await DonorReport.create(reportData);

  const items = itemsData.length
    ? await donorReportItemsRepository.createMany(
        itemsData.map((item) => ({
          ...item,
          donorReportId: report._id,
        })),
      )
    : [];

  return {
    report,
    items,
  };
}
export async function deleteReportWithItems(id) {
  const [report] = await Promise.all([
    DonorReport.findByIdAndDelete(id),
    donorReportItemsRepository.deleteByReportId(id),
  ]);
  return report;
}
export async function findAll(filters = {}) {
  const {
    donorProfileId,
    reportType,
    periodStart,
    periodEnd,
    page = 1,
    limit = 20,
  } = filters;
  const query = {};
  if (donorProfileId !== undefined) query.donorProfileId = donorProfileId;
  if (reportType !== undefined) query.reportType = reportType;
  if (periodStart !== undefined || periodEnd !== undefined) {
    query.generatedAt = {};
    if (periodStart !== undefined) query.generatedAt.$gte = periodStart;
    if (periodEnd !== undefined) query.generatedAt.$lte = periodEnd;
  }
  //pagination for users
  const skip = (page - 1) * limit;
  const [entries, total] = await Promise.all([
    DonorReport.find(query).sort({ generatedAt: -1 }).skip(skip).limit(limit),
    DonorReport.countDocuments(query),
  ]);
  return { entries, total };
}
