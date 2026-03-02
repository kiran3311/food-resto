import bcrypt from "bcryptjs";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import { IUserRole, User } from "../models/User";
import { catchAsync } from "../utils/catchAsync";
import { AppError } from "../utils/appError";
import {
  createAccessToken,
  createRefreshToken,
  verifyRefreshToken
} from "../utils/token";
import { env } from "../config/env";

const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(80),
    email: z.string().email(),
    password: z.string().min(6).max(64),
    role: z.nativeEnum(IUserRole).default(IUserRole.OWNER)
  })
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6).max(64)
  })
});

const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().optional()
  })
});

const buildAuthResponse = (user: {
  _id: string;
  name: string;
  email: string;
  role: IUserRole;
}) => {
  const payload = {
    userId: user._id,
    role: user.role
  };

  const accessToken = createAccessToken(payload);
  const refreshToken = createRefreshToken(payload);

  return {
    accessToken,
    refreshToken,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  };
};

const setRefreshCookie = (res: Response, refreshToken: string): void => {
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: env.nodeEnv === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
};

export const register = catchAsync(async (req: Request, res: Response) => {
  registerSchema.parse({ body: req.body });

  const existing = await User.findOne({ email: req.body.email.toLowerCase() });
  if (existing) {
    throw new AppError("Email already registered", StatusCodes.CONFLICT);
  }

  const user = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    role: req.body.role ?? IUserRole.OWNER
  });

  const auth = buildAuthResponse({
    _id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  });

  user.refreshTokenHash = await bcrypt.hash(auth.refreshToken, 12);
  await user.save();

  setRefreshCookie(res, auth.refreshToken);

  res.status(StatusCodes.CREATED).json({
    message: "Registration successful",
    ...auth
  });
});

export const login = catchAsync(async (req: Request, res: Response) => {
  loginSchema.parse({ body: req.body });

  const user = await User.findOne({ email: req.body.email.toLowerCase() }).select(
    "+password +refreshTokenHash"
  );

  if (!user || !(await user.comparePassword(req.body.password))) {
    throw new AppError("Invalid email or password", StatusCodes.UNAUTHORIZED);
  }

  const auth = buildAuthResponse({
    _id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  });

  user.refreshTokenHash = await bcrypt.hash(auth.refreshToken, 12);
  await user.save();

  setRefreshCookie(res, auth.refreshToken);

  res.status(StatusCodes.OK).json({
    message: "Login successful",
    ...auth
  });
});

export const refresh = catchAsync(async (req: Request, res: Response) => {
  refreshSchema.parse({ body: req.body });

  const token = req.cookies.refreshToken ?? req.body.refreshToken;
  if (!token) {
    throw new AppError("Refresh token is required", StatusCodes.UNAUTHORIZED);
  }

  const payload = verifyRefreshToken(token);

  const user = await User.findById(payload.userId).select("+refreshTokenHash");
  if (!user || !user.refreshTokenHash) {
    throw new AppError("Invalid refresh token", StatusCodes.UNAUTHORIZED);
  }

  const isValid = await bcrypt.compare(token, user.refreshTokenHash);
  if (!isValid) {
    throw new AppError("Invalid refresh token", StatusCodes.UNAUTHORIZED);
  }

  const auth = buildAuthResponse({
    _id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  });

  user.refreshTokenHash = await bcrypt.hash(auth.refreshToken, 12);
  await user.save();

  setRefreshCookie(res, auth.refreshToken);

  res.status(StatusCodes.OK).json({
    message: "Token refreshed",
    ...auth
  });
});

export const logout = catchAsync(async (req: Request, res: Response) => {
  const token = req.cookies.refreshToken ?? req.body.refreshToken;

  if (token) {
    try {
      const payload = verifyRefreshToken(token);
      const user = await User.findById(payload.userId).select("+refreshTokenHash");
      if (user) {
        user.refreshTokenHash = undefined;
        await user.save();
      }
    } catch (_error: unknown) {
      // Ignore invalid tokens at logout.
    }
  }

  res.clearCookie("refreshToken");

  res.status(StatusCodes.OK).json({
    message: "Logged out"
  });
});

export const me = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("Unauthorized", StatusCodes.UNAUTHORIZED);
  }

  const user = await User.findById(req.user.id);
  if (!user) {
    throw new AppError("User not found", StatusCodes.NOT_FOUND);
  }

  res.status(StatusCodes.OK).json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    }
  });
});