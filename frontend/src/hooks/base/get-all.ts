import { usePathname, useSearchParams } from "next/navigation";

import client from "@/lib/client";
import type { IUseHooksOptions } from "@/types/types";
import { useInfiniteQuery } from "@tanstack/react-query";

export function useGetAll({
  endPoint,
  queryKey,
  pagination = {},
  enabled = true,
  params = {},
}: IUseHooksOptions & {
  params?: Record<string, string | number | (string | number)[]>;
}) {
  const { pageSize = 20, sortField = "id", sortOrder = "DESC" } = pagination;
  const pathname = usePathname();

  return useInfiniteQuery({
    queryKey: [...queryKey, params],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await client.get(endPoint, {
        params: {
          page: pageParam,
          pageSize,
          sortField,
          sortOrder,
          ...params,
        },
        headers: {
          ...client.defaults.headers.common,
        },
      });

      const totalCount = Number(res.headers["x-total-count"]);
      const totalPages = Math.ceil(totalCount / pageSize);

      return {
        data: res.data,
        nextPage: pageParam < totalPages ? pageParam + 1 : undefined,
        totalCount,
      };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    enabled,
  });
}
