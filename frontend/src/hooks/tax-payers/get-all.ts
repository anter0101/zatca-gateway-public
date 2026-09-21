import { useQuery } from "@tanstack/react-query";

import { listTaxPayers } from "@/mockup-data/tax-payers";

export const taxPayersQueryKey = (vendorId?: number) =>
  ["tax-payers", vendorId] as const;

export function useGetTaxPayers(vendorId?: number) {
  const { data, isPending } = useQuery({
    queryKey: taxPayersQueryKey(vendorId),
    queryFn: () => listTaxPayers(vendorId!),
    enabled: typeof vendorId === "number",
  });

  return {
    data: data ?? [],
    isPending: typeof vendorId === "number" ? isPending : false,
  };
}
