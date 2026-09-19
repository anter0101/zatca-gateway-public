import client from "@/lib/client";
import type { IQueryParams } from "@/types/query-params";
import { useQuery } from "@tanstack/react-query";

export interface IUsePaginatedOptions<
  TParams extends IQueryParams = IQueryParams,
> {
  endPoint: string;
  queryKey: readonly string[];
  params?: TParams;
  enabled?: boolean;
  defaultPageSize?: number;
}

export function useGetPaginated<
  T,
  TParams extends IQueryParams = IQueryParams,
>({
  endPoint,
  queryKey,
  params = {} as TParams,
  enabled = true,
  defaultPageSize = 20,
}: IUsePaginatedOptions<TParams>) {
  const { page = 1, pageSize = defaultPageSize, ...restParams } = params;

  // Filter out undefined values from params
  const filteredParams = Object.fromEntries(
    Object.entries(restParams).filter(([, value]) => value !== undefined),
  );

  return useQuery({
    queryKey: [...queryKey, { page, pageSize, ...filteredParams }],
    queryFn: async () => {
      const res = await client.get(endPoint, {
        params: {
          page,
          pageSize,
          ...filteredParams,
        },
      });

      const totalCount = Number(res.headers["x-total-count"]) || 0;

      return {
        data: res.data as T[],
        totalCount,
      };
    },
    enabled,
  });
}
