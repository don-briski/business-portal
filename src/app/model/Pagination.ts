export interface Pagination {
  pageNumber: number;
  pageSize: number;
  totalPages?: number;
  searchTerm?: null | string;
  keyword?: null | string;
  totalRecords?: number;
  totalCount?: number;
  count?: number;
  jumpArray?: any[];
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
}
