import { useLocale, useTranslations } from "next-intl";
import { toast } from "react-toastify";

import client from "@/lib/client";
import queryClient from "@/lib/query-client";
import type { IDataOptions } from "@/types/types";
import type { UseMutationResult } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";

export function useCreate<TData, TResponse, TError>({
  endPoint,
  queryKey,
  onSuccess,
  onError,
}: IDataOptions<TData, TResponse, TError>): UseMutationResult<
  TResponse,
  TError,
  TData
> {
  const locale = useLocale();
  const t = useTranslations("common.message");

  return useMutation<TResponse, TError, TData>({
    mutationFn: async (data) => {
      const res = await client.post<TResponse>(endPoint, data, {
        headers: {
          "Accept-Language": locale,
        },
      });

      return res.data;
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey });
      if (onSuccess) {
        onSuccess(res);
      } else {
        toast.success(t("on-success"));
      }
    },
    onError: (error) => {
      if (onError) {
        onError(error);
      } else {
        toast.error(t("on-error"));
      }
    },
  });
}
