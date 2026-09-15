import { ValidationError } from "../../../shared/errors/errors.js";
import * as donation from "../../donation/interfaces/donation.interface.js";
import * as reservation from "../../reservation/interfaces/reservation.interface.js";

function parseDate(value, fieldName, endOfDay = false) {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string") {
    throw new ValidationError(`${fieldName} must be a date string`);
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ValidationError(`${fieldName} must be a valid date`);
  }

  if (endOfDay && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    date.setUTCHours(23, 59, 59, 999);
  }

  return date;
}

function normalizeDashboardFilters(filters = {}) {
  const periodStart = parseDate(filters.periodStart, "periodStart");
  const periodEnd = parseDate(filters.periodEnd, "periodEnd", true);

  if (
    periodStart !== undefined &&
    periodEnd !== undefined &&
    periodStart > periodEnd
  ) {
    throw new ValidationError("periodStart cannot be after periodEnd");
  }

  return { periodStart, periodEnd };
}

export function toBreakdownDto(row, labelField) {
  return {
    label: row[labelField] ?? "Unknown",
    donatedQuantity: Number(row.donatedQuantity ?? 0),
    donationCount: Number(row.donationCount ?? 0),
    revenue: Number(row.revenue ?? 0),
  };
}

export function toDashboardStatsDto(
  summary,
  categoryRows,
  measurementUnitRows,
  filters,
) {
  return {
    generatedAt: new Date().toISOString(),
    periodStart: filters.periodStart?.toISOString() ?? null,
    periodEnd: filters.periodEnd?.toISOString() ?? null,
    totalDonatedQuantity: Number(summary.totalDonatedQuantity ?? 0),
    totalRevenue: Number(summary.totalRevenue ?? 0),
    donationCount: Number(summary.donationCount ?? 0),
    byCategory: categoryRows.map((row) => toBreakdownDto(row, "foodCategory")),
    byMeasurementUnit: measurementUnitRows.map((row) =>
      toBreakdownDto(row, "measurementUnit"),
    ),
  };
}

function addBreakdownValue(breakdowns, label, values) {
  const current = breakdowns.get(label) ?? {
    donatedQuantity: 0,
    donationCount: 0,
    revenue: 0,
  };
  current.donatedQuantity += values.donatedQuantity;
  current.donationCount += values.donationCount;
  current.revenue += values.revenue;
  breakdowns.set(label, current);
}

function compareBreakdownLabels(left, right, labelField) {
  const leftLabel = left[labelField];
  const rightLabel = right[labelField];
  if (leftLabel === rightLabel) return 0;
  if (leftLabel === null || leftLabel === undefined) return -1;
  if (rightLabel === null || rightLabel === undefined) return 1;
  return String(leftLabel).localeCompare(String(rightLabel));
}

function toBreakdownRows(breakdowns, labelField) {
  return [...breakdowns.entries()]
    .map(([label, values]) => ({ [labelField]: label, ...values }))
    .sort((left, right) =>
      compareBreakdownLabels(left, right, labelField),
    );
}

export function buildDashboardAggregates(dimensions, collectedRows) {
  const dimensionsByDonationId = new Map(
    dimensions.map((dimension) => [dimension.donationId, dimension]),
  );
  const summary = {
    totalDonatedQuantity: 0,
    totalRevenue: 0,
    donationCount: 0,
  };
  const categories = new Map();
  const measurementUnits = new Map();

  for (const row of collectedRows) {
    const dimension = dimensionsByDonationId.get(row.donationId);
    if (!dimension) continue;

    const values = {
      donatedQuantity: Number(row.donatedQuantity ?? 0),
      donationCount: Number(row.donationCount ?? 0),
      revenue: Number(row.revenue ?? 0),
    };
    summary.totalDonatedQuantity += values.donatedQuantity;
    summary.totalRevenue += values.revenue;
    summary.donationCount += values.donationCount;
    addBreakdownValue(categories, dimension.foodCategory, values);
    addBreakdownValue(
      measurementUnits,
      dimension.measurementUnit,
      values,
    );
  }

  return {
    summary,
    categoryRows: toBreakdownRows(categories, "foodCategory"),
    measurementUnitRows: toBreakdownRows(
      measurementUnits,
      "measurementUnit",
    ),
  };
}

export async function getDashboardStats(donorProfileId, filters = {}) {
  if (!donorProfileId) {
    throw new ValidationError("donorProfileId is required");
  }

  const normalizedFilters = normalizeDashboardFilters(filters);
  const dimensions = await donation.listDonorReportingDimensions(
    donorProfileId,
  );
  const collectedRows =
    dimensions.length === 0
      ? []
      : await reservation.summarizeCollectedReservationsByDonation(
          dimensions.map((dimension) => dimension.donationId),
          normalizedFilters,
        );
  const { summary, categoryRows, measurementUnitRows } =
    buildDashboardAggregates(dimensions, collectedRows);

  return toDashboardStatsDto(
    summary,
    categoryRows,
    measurementUnitRows,
    normalizedFilters,
  );
}
