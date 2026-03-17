"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadProfilePicture = void 0;
const cloudinary_1 = require("cloudinary");
const config_1 = require("../config");
cloudinary_1.v2.config({
    cloud_name: config_1.config.cloudinaryCloudName,
    api_key: config_1.config.cloudinaryApiKey,
    api_secret: config_1.config.cloudinaryApiSecret,
});
const uploadProfilePicture = async (fileBuffer, userId, businessId) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary_1.v2.uploader.upload_stream({
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
        }, (error, result) => {
            if (error) {
                reject(error);
            }
            else if (result) {
                resolve({
                    secure_url: result.secure_url,
                    public_id: result.public_id,
                    format: result.format,
                    width: result.width,
                    height: result.height,
                });
            }
            else {
                reject(new Error("Upload failed: no result returned"));
            }
        });
        uploadStream.end(fileBuffer);
    });
};
exports.uploadProfilePicture = uploadProfilePicture;
