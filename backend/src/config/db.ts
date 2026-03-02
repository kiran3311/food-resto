import mongoose from "mongoose";
import { env } from "./env";

export const connectDb = async (): Promise<void> => {
  await mongoose.connect(env.mongoUri);
  // eslint-disable-next-line no-console
  console.log("MongoDB connected");
};