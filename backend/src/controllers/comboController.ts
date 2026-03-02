import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";
import { z } from "zod";
import { Combo } from "../models/Combo";
import { MenuItem } from "../models/MenuItem";
import { catchAsync } from "../utils/catchAsync";
import { AppError } from "../utils/appError";
import { getOwnerStall } from "../utils/getOwnerStall";

const createComboSchema = z.object({
  body: z.object({
    comboName: z.string().min(2).max(120),
    items: z.array(z.string().min(1)).min(2),
    comboPrice: z.coerce.number().min(0)
  })
});

const updateComboSchema = z.object({
  body: z.object({
    comboName: z.string().min(2).max(120).optional(),
    items: z.array(z.string().min(1)).min(2).optional(),
    comboPrice: z.coerce.number().min(0).optional()
  })
});

const toObjectIds = (ids: string[]): Types.ObjectId[] =>
  ids.map((id) => new Types.ObjectId(id));

const calculateComboPricing = async (
  stallId: string,
  itemIds: Types.ObjectId[],
  comboPrice: number
): Promise<{ originalPrice: number; discountPercentage: number }> => {
  const menuItems = await MenuItem.find({
    _id: { $in: itemIds },
    stallId
  });

  if (menuItems.length !== itemIds.length) {
    throw new AppError(
      "Some menu items were not found in your stall",
      StatusCodes.BAD_REQUEST
    );
  }

  const originalPrice = menuItems.reduce((sum, item) => sum + item.price, 0);
  if (comboPrice > originalPrice) {
    throw new AppError(
      "Combo price cannot exceed original total",
      StatusCodes.BAD_REQUEST
    );
  }

  const discountPercentage =
    originalPrice > 0
      ? Number((((originalPrice - comboPrice) / originalPrice) * 100).toFixed(2))
      : 0;

  return { originalPrice, discountPercentage };
};

export const createCombo = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("Unauthorized", StatusCodes.UNAUTHORIZED);
  }

  const parsed = createComboSchema.parse({ body: req.body });
  const { comboName, items, comboPrice } = parsed.body;

  const stall = await getOwnerStall(req.user.id);
  const itemIds = toObjectIds(items);

  const { originalPrice, discountPercentage } = await calculateComboPricing(
    stall.id,
    itemIds,
    comboPrice
  );

  const combo = await Combo.create({
    stallId: new Types.ObjectId(stall.id),
    comboName,
    items: itemIds,
    comboPrice,
    originalPrice,
    discountPercentage
  });

  res.status(StatusCodes.CREATED).json({
    message: "Combo created",
    combo
  });
});

export const listCombos = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("Unauthorized", StatusCodes.UNAUTHORIZED);
  }

  const stall = await getOwnerStall(req.user.id);

  const combos = await Combo.find({ stallId: stall.id })
    .populate("items", "itemName price")
    .sort({ createdAt: -1 });

  res.status(StatusCodes.OK).json({ combos });
});

export const updateCombo = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("Unauthorized", StatusCodes.UNAUTHORIZED);
  }

  const parsed = updateComboSchema.parse({ body: req.body });
  const { comboName, items, comboPrice } = parsed.body;

  const stall = await getOwnerStall(req.user.id);

  const combo = await Combo.findOne({ _id: req.params.id, stallId: stall.id });
  if (!combo) {
    throw new AppError("Combo not found", StatusCodes.NOT_FOUND);
  }

  const itemIds: Types.ObjectId[] = items
    ? toObjectIds(items)
    : combo.items.map((item) => new Types.ObjectId(item.toString()));
  const updatedComboPrice = comboPrice !== undefined ? comboPrice : combo.comboPrice;

  const { originalPrice, discountPercentage } = await calculateComboPricing(
    stall.id,
    itemIds,
    updatedComboPrice
  );

  combo.comboName = comboName ?? combo.comboName;
  combo.items = itemIds;
  combo.comboPrice = updatedComboPrice;
  combo.originalPrice = originalPrice;
  combo.discountPercentage = discountPercentage;

  await combo.save();

  res.status(StatusCodes.OK).json({
    message: "Combo updated",
    combo
  });
});

export const deleteCombo = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("Unauthorized", StatusCodes.UNAUTHORIZED);
  }

  const stall = await getOwnerStall(req.user.id);

  const combo = await Combo.findOneAndDelete({ _id: req.params.id, stallId: stall.id });
  if (!combo) {
    throw new AppError("Combo not found", StatusCodes.NOT_FOUND);
  }

  res.status(StatusCodes.OK).json({
    message: "Combo deleted"
  });
});
