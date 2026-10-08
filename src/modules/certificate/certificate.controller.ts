import type { Request, Response } from "express";

import httpStatus from "http-status";
import { requireAuth } from "../../middleware/auth.middleware";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { CertificateService } from "./certificate.service";

export const CertificateController = {
  // Current User

  getMyCertificates: catchAsync(async (req: Request, res: Response) => {
    const { user } = requireAuth(req);

    const certificates = await CertificateService.getMyCertificates(user.id);

    sendResponse(res, {
      success: true,
      message: "Certificates retrieved successfully",
      statusCode: httpStatus.OK,
      data: {
        certificates,
      },
    });
  }),

  getMyCertificateById: catchAsync(async (req: Request, res: Response) => {
    const { user } = requireAuth(req);

    const certificate = await CertificateService.getMyCertificateById(
      user.id,
      req.params.certificateId as string,
    );

    sendResponse(res, {
      success: true,
      message: "Certificate retrieved successfully",
      statusCode: httpStatus.OK,
      data: {
        certificate,
      },
    });
  }),

  // Public

  verifyCertificate: catchAsync(async (req: Request, res: Response) => {
    const certificate = await CertificateService.verifyCertificate(
      req.params.certificateNumber as string,
    );

    sendResponse(res, {
      success: true,
      message: "Certificate verified successfully",
      statusCode: httpStatus.OK,
      data: {
        certificate,
      },
    });
  }),
};
