import { Router, type Router as ExpressRouter } from "express";

import { CertificateController } from "./certificate.controller";

import {
  protect,
  requireActiveUser,
  requireVerifiedEmail,
} from "../../middleware/auth.middleware";

const router: ExpressRouter = Router();

// Public

router.get(
  "/verify/:certificateNumber",
  CertificateController.verifyCertificate,
);

// Protected

router.use(protect, requireActiveUser, requireVerifiedEmail);
router.get("/me", CertificateController.getMyCertificates);
router.get("/me/:certificateId", CertificateController.getMyCertificateById);

export default router;
