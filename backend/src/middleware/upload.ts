import fs from "fs";
import path from "path";
import multer from "multer";
import { env } from "../config/env";

const uploadPath = path.resolve(env.uploadDir);
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, uploadPath);
  },
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname);
    const name = path.basename(file.originalname, extension).replace(/\s+/g, "-");
    callback(null, `${Date.now()}-${name}${extension}`);
  }
});

const fileFilter: multer.Options["fileFilter"] = (_req, file, callback) => {
  if (file.mimetype.startsWith("image/")) {
    callback(null, true);
  } else {
    callback(new Error("Only image files are allowed"));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

export const toPublicFilePath = (filename: string): string => `/uploads/${filename}`;