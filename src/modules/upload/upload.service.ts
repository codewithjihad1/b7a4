import cloudinary from "../../lib/cloudinary.js";
import { AppError } from "../../utils/AppError.js";
import type { UploadApiResponse } from "cloudinary";

const UPLOAD_FOLDER = "gearup";

export const uploadImage = async (
    file: Express.Multer.File,
    folder?: string,
): Promise<UploadApiResponse> => {
    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: folder ? `${UPLOAD_FOLDER}/${folder}` : UPLOAD_FOLDER,
                resource_type: "image",
                transformation: [{ width: 800, height: 600, crop: "limit" }, { quality: "auto" }],
            },
            (error, result) => {
                if (error) return reject(error);
                if (!result) return reject(new AppError("Upload failed"));
                resolve(result);
            },
        );

        stream.end(file.buffer);
    });

    return result;
};

export const deleteImage = async (publicId: string): Promise<void> => {
    await cloudinary.uploader.destroy(publicId);
};

export const extractPublicId = (url: string): string => {
    const parts = url.split("/");
    const folderAndFile = parts.slice(parts.indexOf(UPLOAD_FOLDER)).join("/");
    return folderAndFile.replace(/\.[^.]+$/, "");
};
