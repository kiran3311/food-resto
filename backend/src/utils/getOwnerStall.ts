import { StatusCodes } from "http-status-codes";
import { Stall, IStall } from "../models/Stall";
import { AppError } from "./appError";

export const getOwnerStall = async (ownerId: string): Promise<IStall> => {
  const stall = await Stall.findOne({ ownerId });
  if (!stall) {
    throw new AppError(
      "Create your stall profile first",
      StatusCodes.BAD_REQUEST
    );
  }
  return stall;
};