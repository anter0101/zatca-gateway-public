import type { ReactNode } from "react";

export interface IPaginationOptions {
  pageSize?: number;
  sortField?: string;
  sortOrder?: "ASC" | "DESC";
  page?: number;
}

export interface IUseHooksOptions {
  endPoint: string;
  queryKey: readonly string[];
  pagination?: IPaginationOptions;
  enabled?: boolean;
}

export interface IBaseOptions<TResponse, TError> {
  endPoint: string;
  queryKey: string[];
  enabled?: boolean;
  onSuccess?: (data: TResponse) => void;
  onError?: (error: TError) => void;
}

export interface IDataOptions<TData, TResponse, TError>
  extends IBaseOptions<TResponse, TError> {
  data?: TData;
  id?: string | number;
}
export interface IPageComponentProps {
  params: Promise<{ locale: string }>;
}

export interface IPageProps extends IPageComponentProps {
  children: ReactNode;
}
