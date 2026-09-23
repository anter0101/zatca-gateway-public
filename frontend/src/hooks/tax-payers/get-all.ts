import { useGetPaginated } from "@/hooks/base/get-paginated";
import type { TaxPayer } from "@/types/tax-payer";

export const taxPayersQueryKey = (vendorId: number) => [
  "vendors",
  String(vendorId),
  "tax-payers",
];

type UseGetTaxPayersOptions = {
  vendorId: number;
  page: number;
  pageSize: number;
  enabled?: boolean;
};

export function useGetTaxPayers({
  vendorId,
  page,
  pageSize,
  enabled = true,
}: UseGetTaxPayersOptions) {
  const query = useGetPaginated<TaxPayer>({
    endPoint: `/api/vendors/${vendorId}/tax-payers`,
    queryKey: taxPayersQueryKey(vendorId),
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
