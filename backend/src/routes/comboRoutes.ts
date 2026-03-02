import { Router } from "express";
import {
  createCombo,
  deleteCombo,
  listCombos,
  updateCombo
} from "../controllers/comboController";
import { authorize, protect } from "../middleware/auth";
import { IUserRole } from "../models/User";

export const comboRouter = Router();

comboRouter.use(protect, authorize(IUserRole.OWNER));

comboRouter.get("/", listCombos);
comboRouter.post("/", createCombo);
comboRouter.put("/:id", updateCombo);
comboRouter.delete("/:id", deleteCombo);