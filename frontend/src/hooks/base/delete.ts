import { useTranslations } from "next-intl";
import { toast } from "react-toastify";

import client from "@/lib/client";
import type { IBaseOptions } from "@/types/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useDelete<TResponse, TError>({
  endPoint,
  queryKey,
  onSuccess,
  onError,
}: IBaseOptions<TResponse, TError>) {
  const t = useTranslations("common.message");
  const queryClient = useQueryClient();

  return useMutation<TResponse, TError, string>({
    mutationFn: async (id) => {
      const res = await client.delete(`/${endPoint}/${id}`);
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
