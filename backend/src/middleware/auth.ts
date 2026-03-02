import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { IUserRole } from "../models/User";
import { verifyAccessToken } from "../utils/token";
import { AppError } from "../utils/appError";

export const protect = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    next(new AppError("Unauthorized", StatusCodes.UNAUTHORIZED));
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.userId,
      role: payload.role as IUserRole
    };
    next();
  } catch (_error: unknown) {
    next(new AppError("Invalid or expired token", StatusCodes.UNAUTHORIZED));
  }
};

export const authorize =
  (...roles: IUserRole[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      next(new AppError("Forbidden", StatusCodes.FORBIDDEN));
      return;
    }
    next();
  };