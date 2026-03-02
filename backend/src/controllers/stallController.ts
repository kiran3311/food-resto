import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import { Stall } from "../models/Stall";
import { catchAsync } from "../utils/catchAsync";
import { AppError } from "../utils/appError";
import { toPublicFilePath } from "../middleware/upload";

const upsertStallSchema = z.object({
  body: z.object({
    stallName: z.string().min(2).max(120),
    description: z.string().max(1000).optional(),
    contact: z.string().max(50).optional(),
    address: z.string().max(200).optional(),
    businessHours: z.string().max(100).optional()
  })
});

export const upsertMyStall = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("Unauthorized", StatusCodes.UNAUTHORIZED);
  }

  upsertStallSchema.parse({ body: req.body });

  const payload = {
    stallName: req.body.stallName,
    description: req.body.description,
    contact: req.body.contact,
    address: req.body.address,
    businessHours: req.body.businessHours
  };

  if (req.file) {
    Object.assign(payload, { logo: toPublicFilePath(req.file.filename) });
  }

  const stall = await Stall.findOneAndUpdate(
    { ownerId: req.user.id },
    { $set: payload, $setOnInsert: { ownerId: req.user.id } },
    { new: true, upsert: true, runValidators: true }
  );

  res.status(StatusCodes.OK).json({
    message: "Stall profile saved",
    stall
  });
});

export const getMyStall = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("Unauthorized", StatusCodes.UNAUTHORIZED);
  }

  const stall = await Stall.findOne({ ownerId: req.user.id });

  if (!stall) {
    throw new AppError("Stall profile not found", StatusCodes.NOT_FOUND);
  }

  res.status(StatusCodes.OK).json({ stall });
});