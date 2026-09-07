import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { CloudinaryService } from "./upload.service";

const uploadFile = catchAsync(async (req: Request, res: Response) => {
  if (!req.file) {
    return sendResponse(res, {
      success: false,
      message: "No file uploaded",
      statusCode: httpStatus.BAD_REQUEST,
    });
  }

  const result = await CloudinaryService.uploadToCloudinary(
    req.file,
    "blood-aidx",
  );

  return sendResponse(res, {
    success: true,
    message: "File uploaded successfully",
    statusCode: httpStatus.OK,
    data: result,
  });
});

const deleteFile = catchAsync(async (req: Request, res: Response) => {
  const { publicId, resourceType } = req.body;

  if (!publicId || !resourceType) {
    return sendResponse(res, {
      success: false,
      message: "Public ID and resource type are required",
      statusCode: httpStatus.BAD_REQUEST,
    });
  }

  await CloudinaryService.deleteFromCloudinary(publicId, resourceType);

  return sendResponse(res, {
    success: true,
    message: "File deleted successfully",
    statusCode: httpStatus.OK,
  });
});

export const CloudinaryController = {
  uploadFile,
  deleteFile,
};
