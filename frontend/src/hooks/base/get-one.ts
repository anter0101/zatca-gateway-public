// useGetOne.ts
import client from "@/lib/client";
import type { IBaseOptions } from "@/types/types";
import { useQuery } from "@tanstack/react-query";

export function useGetOne<TResponse, TError>({
  endPoint,
  queryKey,
  enabled = true,
}: IBaseOptions<TResponse, TError>) {
  return useQuery<TResponse, TError>({
    queryKey,
    queryFn: async () => {
      const res = await client.get<TResponse>(endPoint);
      return res.data;
    },
    enabled,
  });
}
