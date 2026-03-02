import { Router } from "express";
import {
  createOrder,
  getOrderById,
  listOrders,
  updateOrderStatus
} from "../controllers/orderController";
import { authorize, protect } from "../middleware/auth";
import { IUserRole } from "../models/User";

export const orderRouter = Router();

orderRouter.use(protect, authorize(IUserRole.OWNER));

orderRouter.get("/", listOrders);
orderRouter.get("/:id", getOrderById);
orderRouter.post("/", createOrder);
orderRouter.patch("/:id/status", updateOrderStatus);