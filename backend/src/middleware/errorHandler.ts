import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { StatusCodes } from "http-status-codes";
import { ZodError } from "zod";
import { AppError } from "../utils/appError";

export const errorHandler = (
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      message: error.message
    });
    return;
  }

  if (error instanceof ZodError) {
    res.status(StatusCodes.BAD_REQUEST).json({
      message: "Validation failed",
      issues: error.issues
    });
    return;
  }

  if (error instanceof mongoose.Error.ValidationError) {
    res.status(StatusCodes.BAD_REQUEST).json({
      message: error.message
    });
    return;
  }

  if (error instanceof mongoose.Error.CastError) {
    res.status(StatusCodes.BAD_REQUEST).json({
      message: "Invalid resource identifier"
    });
    return;
  }

  res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    message: "Internal server error"
  });
};