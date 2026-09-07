import cloudinary from "../../config/cloudinary";

interface UploadFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
}

interface CloudinaryUploadResult {
  url: string;
  publicId: string;
  resourceType: string;
}

const uploadToCloudinary = (
  file: UploadFile,
  folder: string,
): Promise<CloudinaryUploadResult> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "auto",
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }

        if (!result) {
          return reject(new Error("Cloudinary upload failed"));
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          resourceType: result.resource_type,
        });
      },
    );

    uploadStream.end(file.buffer);
  });
};

const deleteFromCloudinary = async (
  publicId: string,
  resourceType: string,
): Promise<void> => {
  await cloudinary.uploader.destroy(publicId, {
    resource_type: resourceType,
  });
};

export const CloudinaryService = {
  uploadToCloudinary,
  deleteFromCloudinary,
};
