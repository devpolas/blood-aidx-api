import type { Request, Response } from "express";

import { CertificateService } from "./certificate.service";
import { requireAuth } from "../../middleware/auth.middleware";
import httpStatus from "http-status";

const getMyCertificates = async (req: Request, res: Response) => {
  const { user } = requireAuth(req);

  const certificates = await CertificateService.getMyCertificates(user.id);

  res.status(httpStatus.OK).json({
    success: true,
    data: certificates,
  });
};

const getMyCertificateById = async (req: Request, res: Response) => {
  const { user } = requireAuth(req);

  const certificate = await CertificateService.getMyCertificateById(
    user.id,
    req.params.certificateId as string,
  );

  res.status(httpStatus.OK).json({
    success: true,
    data: certificate,
  });
};

const verifyCertificate = async (req: Request, res: Response) => {
  const result = await CertificateService.verifyCertificate(
    req.params.certificateNumber as string,
  );

  res.status(httpStatus.OK).json({
    success: true,
    data: result,
  });
};

export const CertificateController = {
  getMyCertificates,
  getMyCertificateById,
  verifyCertificate,
};
