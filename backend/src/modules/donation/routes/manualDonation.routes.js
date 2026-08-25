import { Router } from "express";

import { createManualDonation } from "../controllers/manualDonation.js";

export const manualDonationRoutes = Router({ mergeParams: true });

manualDonationRoutes.post("/", createManualDonation);
