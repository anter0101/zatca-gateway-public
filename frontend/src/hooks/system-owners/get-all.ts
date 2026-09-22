import { useQuery } from "@tanstack/react-query";

import { listSystemOwners } from "@/mockup-data/system-owners";

export const systemOwnersQueryKey = ["system-owners"] as const;

export function useGetSystemOwners() {
  const { data, isPending } = useQuery({
    queryKey: systemOwnersQueryKey,
    queryFn: listSystemOwners,
  });

  return {
    data: data ?? [],
    isPending,
  };
}
