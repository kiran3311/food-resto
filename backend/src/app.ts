import path from "path";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { env } from "./config/env";
import { authRouter } from "./routes/authRoutes";
import { stallRouter } from "./routes/stallRoutes";
import { menuRouter } from "./routes/menuRoutes";
import { comboRouter } from "./routes/comboRoutes";
import { orderRouter } from "./routes/orderRoutes";
import { dashboardRouter } from "./routes/dashboardRoutes";
import { notFoundHandler } from "./middleware/notFound";
import { errorHandler } from "./middleware/errorHandler";

export const app = express();

app.use(
  cors({
    origin: env.clientUrl,
    credentials: true
  })
);
app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin"
    }
  })
);
app.use(morgan("dev"));
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/uploads", express.static(path.resolve(env.uploadDir)));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/stall", stallRouter);
app.use("/api/v1/menu", menuRouter);
app.use("/api/v1/combos", comboRouter);
app.use("/api/v1/orders", orderRouter);
app.use("/api/v1/dashboard", dashboardRouter);

app.use(notFoundHandler);
app.use(errorHandler);
