import { Router } from "express";
import { protect, requireActiveUser } from "../../middleware/auth.middleware";
import upload from "../../middleware/upload.middleware";
import { CloudinaryController } from "./upload.controller";

const router = Router();

router.post(
  "/",
  protect,
  requireActiveUser,
  upload.single("file"),
  CloudinaryController.uploadFile,
);

router.delete("/", protect, requireActiveUser, CloudinaryController.deleteFile);

export default router;
