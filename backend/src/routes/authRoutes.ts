import { Router } from "express";
import { login, logout, me, refresh, register } from "../controllers/authController";
import { protect } from "../middleware/auth";

export const authRouter = Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/refresh", refresh);
authRouter.post("/logout", logout);
authRouter.get("/me", protect, me);