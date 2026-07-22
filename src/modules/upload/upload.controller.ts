import type { Request, Response } from "express";
import { sendResponse } from "../../utils/sendResponse.js";
import { BadRequestError } from "../../utils/AppError.js";
import * as uploadService from "./upload.service.js";

export const uploadImage = async (req: Request, res: Response) => {
    if (!req.file) {
        throw new BadRequestError("No file uploaded");
    }

    const folder = req.body.folder as string | undefined;
    const result = await uploadService.uploadImage(req.file, folder);

    sendResponse(res, {
        statusCode: 201,
        data: {
            url: result.secure_url,
            publicId: result.public_id,
            width: result.width,
            height: result.height,
            format: result.format,
        },
    });
};

export const deleteImage = async (req: Request, res: Response) => {
    const publicId = req.body.publicId as string;
    await uploadService.deleteImage(publicId);
    sendResponse(res, { message: "Image deleted successfully", data: null });
};
