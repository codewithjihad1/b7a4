import { PAGINATION } from "../config/constants.js";

interface PaginationQuery {
    page?: string | number;
    limit?: string | number;
}

export const parsePagination = (query: {
    page?: number | undefined;
    limit?: number | undefined;
}) => {
    const page = Math.max(1, Number(query.page) || PAGINATION.DEFAULT_PAGE);
    const limit = Math.min(
        PAGINATION.MAX_LIMIT,
        Math.max(1, Number(query.limit) || PAGINATION.DEFAULT_LIMIT),
    );
    const skip = (page - 1) * limit;

    return { page, limit, skip };
};

export const buildPaginationMeta = (
    page: number,
    limit: number,
    total: number,
) => {
    return {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
    };
};
