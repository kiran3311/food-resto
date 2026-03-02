import fs from "fs";
import path from "path";
import { app } from "./app";
import { connectDb } from "./config/db";
import { env } from "./config/env";

const bootstrap = async (): Promise<void> => {
  const uploadDir = path.resolve(env.uploadDir);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  await connectDb();

  app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`Server running on port ${env.port}`);
  });
};

bootstrap().catch((error: unknown) => {
  // eslint-disable-next-line no-console
  console.error("Failed to start server", error);
  process.exit(1);
});