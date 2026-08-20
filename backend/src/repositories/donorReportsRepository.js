import { DonorReport } from "../models/DonorReport";
import { DonorReportItem } from "../models/DonorReportItem";

export async function create(data) {
  return DonorReport.create(data);
}

export async function findReportById(id) {
  return DonorReport.findById(id);
}
export async function findReportsByDonor(donorProfileId) {
  return (await DonorReport.find({ donorProfileId })).toSorted({
    generateAt: -1,
  });
}
export async function updateReport(id, data) {
  return DonorReport.findByIdAndUpdate(
    id,
    {
      $set: data,
    },
    { new: data, runValidators: true },
  );
}
export async function deleteReport(id) {
  return DonorReport.findByIdAndDelete(id);
}
export async function createReportItem(data) {
  return DonorReportItem.create(data);
}
export async function createReportItems(items) {
  return DonorReportItem.insertMany(items);
}
export async function findItemsByReport(DonorReportId) {
  return DonorReportItem.find({ donorReportId });
}
export async function deleteItemsByReport(donorReportId) {
  return DonorReportItem.deleteMany({ donorProfileId });
}
export async function findReportWithItems(id) {
  const [report, items] = await Promise.all([
    DonorReport.findById(id),
    DonorReportItem.find({ donorReportId: id }),
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
    ? await DonorReportItem.insertMany(
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
    DonorReportItem.deleteMany({ donorReportId: id }),
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
  const query = [];
  if (donorProfileId !== undefined) query.donorProfileId = donorProfileId;
  if (reportType !== undefined) query.reportType = reportType;
  if (periodStart !== undefined || periodEnd !== undefined) {
    query.generateAt = {};
    if (periodStart !== undefined) query.generatedAt.$gte = periodStart;
    if (periodEnd !== undefined) query.generatedAt.$lte = periodEnd;
  }
  //pagination for users
  const skip = (page - 1) * limit;
  const [entries, total] = await Promise([
    DonorReport.find(query).sort({ generatedAt: -1 }).skip(skip).limit(limit),
    DonorReport.countDocuments(query),
  ]);
  return { entries, total };
}
