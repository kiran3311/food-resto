import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import { MenuItem } from "../models/MenuItem";
import { catchAsync } from "../utils/catchAsync";
import { AppError } from "../utils/appError";
import { getOwnerStall } from "../utils/getOwnerStall";
import { toPublicFilePath } from "../middleware/upload";

const createMenuSchema = z.object({
  body: z.object({
    itemName: z.string().min(2).max(100),
    description: z.string().max(600).optional(),
    price: z.coerce.number().min(0),
    costPrice: z.coerce.number().min(0).optional(),
    currency: z.enum(["USD", "INR", "EUR", "GBP"]).optional(),
    category: z.string().max(80).optional(),
    isAvailable: z.coerce.boolean().optional()
  })
});

const updateMenuSchema = z.object({
  body: z.object({
    itemName: z.string().min(2).max(100).optional(),
    description: z.string().max(600).optional(),
    price: z.coerce.number().min(0).optional(),
    costPrice: z.coerce.number().min(0).optional(),
    currency: z.enum(["USD", "INR", "EUR", "GBP"]).optional(),
    category: z.string().max(80).optional(),
    isAvailable: z.coerce.boolean().optional()
  })
});

const listMenuSchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
    search: z.string().optional(),
    category: z.string().optional(),
    isAvailable: z.enum(["true", "false"]).optional()
  })
});

export const createMenuItem = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("Unauthorized", StatusCodes.UNAUTHORIZED);
  }

  createMenuSchema.parse({ body: req.body });

  const stall = await getOwnerStall(req.user.id);
  const isAvailable =
    req.body.isAvailable !== undefined ? req.body.isAvailable === "true" : true;

  const menuItem = await MenuItem.create({
    stallId: stall.id,
    itemName: req.body.itemName,
    description: req.body.description,
    price: Number(req.body.price),
    costPrice: req.body.costPrice !== undefined ? Number(req.body.costPrice) : 0,
    currency: req.body.currency ?? "USD",
    category: req.body.category,
    isAvailable,
    image: req.file ? toPublicFilePath(req.file.filename) : undefined
  });

  res.status(StatusCodes.CREATED).json({
    message: "Menu item created",
    menuItem
  });
});

export const listMenuItems = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("Unauthorized", StatusCodes.UNAUTHORIZED);
  }

  const parsed = listMenuSchema.parse({ query: req.query });
  const { page, limit, search, category, isAvailable } = parsed.query;

  const stall = await getOwnerStall(req.user.id);

  const filter: Record<string, unknown> = { stallId: stall.id };

  if (search) {
    filter.itemName = { $regex: search, $options: "i" };
  }

  if (category) {
    filter.category = category;
  }

  if (isAvailable) {
    filter.isAvailable = isAvailable === "true";
  }

  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    MenuItem.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    MenuItem.countDocuments(filter)
  ]);

  res.status(StatusCodes.OK).json({
    items,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  });
});

export const updateMenuItem = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("Unauthorized", StatusCodes.UNAUTHORIZED);
  }

  updateMenuSchema.parse({ body: req.body });

  const stall = await getOwnerStall(req.user.id);

  const updateData: Record<string, unknown> = {
    ...req.body
  };

  if (req.body.isAvailable !== undefined) {
    updateData.isAvailable = req.body.isAvailable === "true";
  }

  if (req.file) {
    updateData.image = toPublicFilePath(req.file.filename);
  }

  const item = await MenuItem.findOneAndUpdate(
    { _id: req.params.id, stallId: stall.id },
    { $set: updateData },
    { new: true, runValidators: true }
  );

  if (!item) {
    throw new AppError("Menu item not found", StatusCodes.NOT_FOUND);
  }

  res.status(StatusCodes.OK).json({
    message: "Menu item updated",
    menuItem: item
  });
});

export const deleteMenuItem = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("Unauthorized", StatusCodes.UNAUTHORIZED);
  }

  const stall = await getOwnerStall(req.user.id);

  const item = await MenuItem.findOneAndDelete({ _id: req.params.id, stallId: stall.id });
  if (!item) {
    throw new AppError("Menu item not found", StatusCodes.NOT_FOUND);
  }

  res.status(StatusCodes.OK).json({
    message: "Menu item deleted"
  });
});
