import { useLocale, useTranslations } from "next-intl";
import { toast } from "react-toastify";

import client from "@/lib/client";
import queryClient from "@/lib/query-client";
import type { IDataOptions } from "@/types/types";
import { useMutation } from "@tanstack/react-query";

export function usePut<TData, TResponse, TError>({
  endPoint,
  queryKey,
  onSuccess,
  onError,
}: IDataOptions<TData, TResponse, TError>) {
  const locale = useLocale();
  const t = useTranslations("common.message");

  const mutation = useMutation<
    TResponse,
    TError,
    { id?: string | number; data: TData }
  >({
    mutationFn: async ({ id, data }) => {
      const res = await client.put(`${endPoint}${id ? `/${id}` : ""}`, data, {
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

  return mutation;
}
