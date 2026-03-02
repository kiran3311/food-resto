import { Router } from "express";
import {
  createMenuItem,
  deleteMenuItem,
  listMenuItems,
  updateMenuItem
} from "../controllers/menuController";
import { authorize, protect } from "../middleware/auth";
import { upload } from "../middleware/upload";
import { IUserRole } from "../models/User";

export const menuRouter = Router();

menuRouter.use(protect, authorize(IUserRole.OWNER));

menuRouter.get("/", listMenuItems);
menuRouter.post("/", upload.single("image"), createMenuItem);
menuRouter.put("/:id", upload.single("image"), updateMenuItem);
menuRouter.delete("/:id", deleteMenuItem);