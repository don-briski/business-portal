export interface GetRequestInterface {
    pageSize: number;
    pageNumber: number;
    totalPages?: number;
    totalCount?: number;
    hasNextPage?: boolean;
    hasPreviousPage?: boolean;
    jumpArray?: number[]
}
