import type { Request, Response } from "express";

import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { CloudinaryService } from "./upload.service";

export const CloudinaryController = {
  // Upload

  uploadFile: catchAsync(async (req: Request, res: Response) => {
    if (!req.file) {
      sendResponse(res, {
        success: false,
        message: "No file uploaded",
        statusCode: httpStatus.BAD_REQUEST,
      });
      return;
    }

    const result = await CloudinaryService.uploadToCloudinary(
      req.file,
      "blood-aidx",
    );

    sendResponse(res, {
      success: true,
      message: "File uploaded successfully",
      statusCode: httpStatus.OK,
      data: { response: result },
    });
  }),

  // Delete

  deleteFile: catchAsync(async (req: Request, res: Response) => {
    const { publicId, resourceType } = req.body;

    if (!publicId || !resourceType) {
      sendResponse(res, {
        success: false,
        message: "Public ID and resource type are required",
        statusCode: httpStatus.BAD_REQUEST,
      });
      return;
    }

    await CloudinaryService.deleteFromCloudinary(publicId, resourceType);

    sendResponse(res, {
      success: true,
      message: "File deleted successfully",
      statusCode: httpStatus.OK,
    });
  }),
};
