import * as dashboardStatsRepository from "../repositories/dashboardStats.repository.js";
import { ValidationError } from "../../../shared/errors/errors.js";

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

export async function getDashboardStats(donorProfileId, filters = {}) {
  if (!donorProfileId) {
    throw new ValidationError("donorProfileId is required");
  }

  const normalizedFilters = normalizeDashboardFilters(filters);
  const repositoryFilters = {
    donorProfileId,
    ...normalizedFilters,
  };

  const [summary, categoryRows, measurementUnitRows] = await Promise.all([
    dashboardStatsRepository.aggregateSummary(repositoryFilters),
    dashboardStatsRepository.aggregateByCategory(repositoryFilters),
    dashboardStatsRepository.aggregateByMeasurementUnit(repositoryFilters),
  ]);

  return toDashboardStatsDto(
    summary,
    categoryRows,
    measurementUnitRows,
    normalizedFilters,
  );
}
