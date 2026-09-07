import type { Request, Response } from "express";
import { CertificateService } from "./certificate.service";
import { requireAuth } from "../../middleware/auth.middleware";
import httpStatus from "http-status";
import { sendResponse } from "../../utils/sendResponse";
import { catchAsync } from "../../utils/catchAsync";

const getMyCertificates = catchAsync(async (req: Request, res: Response) => {
  const { user } = requireAuth(req);

  const certificates = await CertificateService.getMyCertificates(user.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "successfully retrieved certificates",
    success: true,
    data: certificates,
  });
});

const getMyCertificateById = catchAsync(async (req: Request, res: Response) => {
  const { user } = requireAuth(req);

  const certificate = await CertificateService.getMyCertificateById(
    user.id,
    req.params.certificateId as string,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "successfully retrieved certificate",
    data: certificate,
  });
});

const verifyCertificate = catchAsync(async (req: Request, res: Response) => {
  const result = await CertificateService.verifyCertificate(
    req.params.certificateNumber as string,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "successfully verified certificate",
    data: result,
  });
});

export const CertificateController = {
  getMyCertificates,
  getMyCertificateById,
  verifyCertificate,
};
