import { Router, type Router as ExpressRouter } from "express";

import {
  protect,
  requireActiveUser,
  requireVerifiedEmail,
} from "../../middleware/auth.middleware";

import { CertificateController } from "./certificate.controller";

const router: ExpressRouter = Router();

// Public

router.get(
  "/verify/:certificateNumber",
  CertificateController.verifyCertificate,
);

// Current User

router.get(
  "/me",
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  CertificateController.getMyCertificates,
);

router.get(
  "/me/:certificateId",
  protect,
  requireActiveUser,
  requireVerifiedEmail,
  CertificateController.getMyCertificateById,
);

export default router;
