export interface IQueryParams {
  page?: number;
  pageSize?: number;
}

export interface IPaginatedResponse<T> {
  data: T[];
  totalCount: number;
}
