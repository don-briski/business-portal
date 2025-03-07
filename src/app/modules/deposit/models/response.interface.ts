export interface ResponseInterface<T> {
    status: boolean,
    message: string,
    data: ResponseDataInterface<T>
}

export interface ResponseDataInterface<T> {
    pageNumber: number,
    totalPages: number,
    pageSize: number,
    totalCount: number,
    hasPreviousPage: boolean,
    hasNextPage: boolean,
    items: T[]
}