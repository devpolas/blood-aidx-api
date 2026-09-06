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
