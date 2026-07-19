import type { Request, Response } from "express";
import { sendResponse } from "../../utils/sendResponse.js";
import * as categoryService from "./category.service.js";

export const create = async (req: Request, res: Response) => {
    const category = await categoryService.create(req.body);
    sendResponse(res, {
        statusCode: 201,
        message: "Category created successfully",
        data: category,
    });
};

export const getAll = async (_req: Request, res: Response) => {
    const categories = await categoryService.getAll();
    sendResponse(res, { data: categories });
};

export const getAllAdmin = async (_req: Request, res: Response) => {
    const categories = await categoryService.getAllAdmin();
    sendResponse(res, { data: categories });
};

export const getById = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const category = await categoryService.getById(id);
    sendResponse(res, { data: category });
};

export const update = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const category = await categoryService.update(id, req.body);
    sendResponse(res, { message: "Category updated successfully", data: category });
};

export const remove = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    await categoryService.remove(id);
    sendResponse(res, { message: "Category deleted successfully", data: null });
};
