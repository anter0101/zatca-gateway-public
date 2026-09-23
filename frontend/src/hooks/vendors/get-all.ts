import { useGetPaginated } from "@/hooks/base/get-paginated";
import type { Vendor } from "@/types/vendor";

export const vendorsQueryKey = ["vendors"];

type UseGetVendorsOptions = {
  page: number;
  pageSize: number;
  enabled?: boolean;
};

export function useGetVendors({
  page,
  pageSize,
  enabled = true,
}: UseGetVendorsOptions) {
  const query = useGetPaginated<Vendor>({
    endPoint: "/api/vendors",
    queryKey: vendorsQueryKey,
    params: { page, pageSize },
    enabled,
  });

  return {
    data: query.data?.data ?? [],
    totalCount: query.data?.totalCount ?? 0,
    isPending: query.isPending,
    isFetching: query.isFetching,
    refetch: query.refetch,
  };
}
