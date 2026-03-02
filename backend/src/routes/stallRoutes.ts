import { Router } from "express";
import { getMyStall, upsertMyStall } from "../controllers/stallController";
import { authorize, protect } from "../middleware/auth";
import { upload } from "../middleware/upload";
import { IUserRole } from "../models/User";

export const stallRouter = Router();

stallRouter.use(protect, authorize(IUserRole.OWNER));

stallRouter.get("/me", getMyStall);
stallRouter.post("/me", upload.single("logo"), upsertMyStall);
stallRouter.put("/me", upload.single("logo"), upsertMyStall);