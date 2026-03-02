import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";
import { z } from "zod";
import { Combo } from "../models/Combo";
import { MenuItem } from "../models/MenuItem";
import { Order } from "../models/Order";
import { Stall } from "../models/Stall";
import { catchAsync } from "../utils/catchAsync";
import { AppError } from "../utils/appError";
import { getOwnerStall } from "../utils/getOwnerStall";
import { generateOrderToken } from "../utils/orderToken";

const createOrderSchema = z.object({
  body: z.object({
    customerName: z.string().max(80).optional(),
    lines: z
      .array(
        z.object({
          itemType: z.enum(["menu", "combo"]),
          entityId: z.string().min(1),
          quantity: z.coerce.number().int().min(1)
        })
      )
      .min(1)
  })
});

const listOrdersSchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
    status: z.enum(["Pending", "Preparing", "Ready", "Completed", "Cancelled"]).optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional()
  })
});

const updateStatusSchema = z.object({
  body: z.object({
    status: z.enum(["Pending", "Preparing", "Ready", "Completed", "Cancelled"])
  })
});

type CreateOrderLine = z.infer<typeof createOrderSchema>["body"]["lines"][number];

const mapById = <T extends { _id: Types.ObjectId }>(items: T[]): Map<string, T> => {
  const map = new Map<string, T>();
  items.forEach((item) => map.set(item._id.toString(), item));
  return map;
};

const buildGuestName = (): string => `Guest-${Date.now().toString().slice(-6)}`;

export const createOrder = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("Unauthorized", StatusCodes.UNAUTHORIZED);
  }

  const parsed = createOrderSchema.parse({ body: req.body });
  const { customerName, lines } = parsed.body;

  const stall = await getOwnerStall(req.user.id);

  const menuIds = lines
    .filter((line) => line.itemType === "menu")
    .map((line) => new Types.ObjectId(line.entityId));

  const comboIds = lines
    .filter((line) => line.itemType === "combo")
    .map((line) => new Types.ObjectId(line.entityId));

  const [menuItems, combos] = await Promise.all([
    MenuItem.find({ _id: { $in: menuIds }, stallId: stall.id }),
    Combo.find({ _id: { $in: comboIds }, stallId: stall.id })
  ]);

  const menuMap = mapById(menuItems);
  const comboMap = mapById(combos);

  const comboMenuItemIds = Array.from(
    new Set(
      combos.flatMap((combo) => combo.items.map((id) => id.toString()))
    )
  ).map((id) => new Types.ObjectId(id));

  const comboMenuItems = await MenuItem.find({
    _id: { $in: comboMenuItemIds },
    stallId: stall.id
  });

  const comboMenuMap = mapById(comboMenuItems);

  const orderItems = lines.map((line: CreateOrderLine) => {
      if (line.itemType === "menu") {
        const item = menuMap.get(line.entityId);
        if (!item) {
          throw new AppError("Menu item not found", StatusCodes.BAD_REQUEST);
        }
        return {
          itemId: new Types.ObjectId(line.entityId),
          itemType: "menu" as const,
          name: item.itemName,
          price: item.price,
          quantity: line.quantity,
          cost: item.costPrice ?? 0
        };
      }

      const combo = comboMap.get(line.entityId);
      if (!combo) {
        throw new AppError("Combo not found", StatusCodes.BAD_REQUEST);
      }

      const comboCost = combo.items.reduce((sum, menuId) => {
        const menuItem = comboMenuMap.get(menuId.toString());
        return sum + (menuItem?.costPrice ?? 0);
      }, 0);

      return {
        itemId: new Types.ObjectId(line.entityId),
        itemType: "combo" as const,
        name: combo.comboName,
        price: combo.comboPrice,
        quantity: line.quantity,
        cost: comboCost
      };
    });

  const totals = orderItems.reduce(
    (acc, item) => {
      acc.totalAmount += item.price * item.quantity;
      acc.totalCost += item.cost * item.quantity;
      return acc;
    },
    { totalAmount: 0, totalCost: 0 }
  );

  const orderToken = await generateOrderToken(new Types.ObjectId(stall.id));

  const order = await Order.create({
    stallId: new Types.ObjectId(stall.id),
    orderToken,
    customerName: customerName?.trim() || buildGuestName(),
    items: orderItems,
    totalAmount: Number(totals.totalAmount.toFixed(2)),
    totalCost: Number(totals.totalCost.toFixed(2)),
    status: "Pending"
  });

  res.status(StatusCodes.CREATED).json({
    message: "Order created",
    order
  });
});

export const listOrders = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("Unauthorized", StatusCodes.UNAUTHORIZED);
  }

  const parsed = listOrdersSchema.parse({ query: req.query });
  const { page, limit, status, dateFrom, dateTo } = parsed.query;

  const stall = await getOwnerStall(req.user.id);

  const filter: Record<string, unknown> = { stallId: stall.id };
  if (status) {
    filter.status = status;
  }

  if (dateFrom || dateTo) {
    filter.createdAt = {};
    if (dateFrom) {
      (filter.createdAt as Record<string, Date>).$gte = new Date(dateFrom);
    }
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      (filter.createdAt as Record<string, Date>).$lte = end;
    }
  }

  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Order.countDocuments(filter)
  ]);

  res.status(StatusCodes.OK).json({
    orders,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  });
});

export const updateOrderStatus = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("Unauthorized", StatusCodes.UNAUTHORIZED);
  }

  updateStatusSchema.parse({ body: req.body });

  const stall = await getOwnerStall(req.user.id);

  const order = await Order.findOneAndUpdate(
    { _id: req.params.id, stallId: stall.id },
    { $set: { status: req.body.status } },
    { new: true, runValidators: true }
  );

  if (!order) {
    throw new AppError("Order not found", StatusCodes.NOT_FOUND);
  }

  res.status(StatusCodes.OK).json({
    message: "Order status updated",
    order
  });
});

export const getOrderById = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("Unauthorized", StatusCodes.UNAUTHORIZED);
  }

  const stall = await getOwnerStall(req.user.id);

  const order = await Order.findOne({ _id: req.params.id, stallId: stall.id });
  if (!order) {
    throw new AppError("Order not found", StatusCodes.NOT_FOUND);
  }

  const stallInfo = await Stall.findById(stall.id).select("stallName logo contact address");

  res.status(StatusCodes.OK).json({
    order,
    stall: stallInfo
  });
});
