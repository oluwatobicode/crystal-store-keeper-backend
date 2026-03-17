import { v2 as cloudinary } from "cloudinary";
import { config } from "../config";
import { CloudinaryUploadResult } from "../interface/cloudinary.interface";

cloudinary.config({
  cloud_name: config.cloudinaryCloudName,
  api_key: config.cloudinaryApiKey,
  api_secret: config.cloudinaryApiSecret,
});

export const uploadProfilePicture = async (
  fileBuffer: Buffer,
  userId: string,
  businessId: string,
): Promise<CloudinaryUploadResult> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `crystal-store-keeper/${businessId}/${userId}`,
        public_id: `user_${userId}`,
        overwrite: true,
        resource_type: "image",
        transformation: [
          {
            width: 200,
            height: 200,
            crop: "fill",
          },
          { quality: "auto" },
        ],
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else if (result) {
          resolve({
            secure_url: result.secure_url,
            public_id: result.public_id,
            format: result.format,
            width: result.width,
            height: result.height,
          });
        } else {
          reject(new Error("Upload failed: no result returned"));
        }
      },
    );
    uploadStream.end(fileBuffer);
  });
};
