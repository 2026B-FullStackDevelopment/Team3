import * as donorStatisticService from "../services/donorStatistic.service.js";

function getDonorProfileId(req, res) {
  return (
    req.user?.donorProfileId ??
    req.auth?.donorProfileId ??
    res.locals?.donorProfileId
  );
}

function requireDonorProfileId(req, res) {
  const donorProfileId = getDonorProfileId(req, res);

  if (!donorProfileId) {
    res.status(401).json({
      error: "UNAUTHENTICATED",
      message: "An authenticated donor profile is required",
    });
    return null;
  }

  return String(donorProfileId);
}

export async function getDashboardReport(req, res, next) {
  try {
    const donorProfileId = requireDonorProfileId(req, res);
    if (!donorProfileId) return;

    const dashboard = await donorStatisticService.getDashboardStats(
      donorProfileId,
      req.query,
    );

    res.status(200).json(dashboard);
  } catch (error) {
    next(error);
  }
}
