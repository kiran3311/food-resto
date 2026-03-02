import { Router } from "express";
import { getDashboardSummary } from "../controllers/dashboardController";
import { authorize, protect } from "../middleware/auth";
import { IUserRole } from "../models/User";

export const dashboardRouter = Router();

dashboardRouter.use(protect, authorize(IUserRole.OWNER));

dashboardRouter.get("/summary", getDashboardSummary);