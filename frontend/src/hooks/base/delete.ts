import { useTranslations } from "next-intl";
import type { AxiosError } from "axios";
import { toast } from "react-toastify";

import client from "@/lib/client";
import type { IApiResError } from "@/types/api-res-error";
import type { IBaseOptions } from "@/types/types";
import { getApiErrorMessage } from "@/utils/api-error";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useDelete<TResponse, TError>({
  endPoint,
  queryKey,
  onSuccess,
  onError,
}: IBaseOptions<TResponse, TError>) {
  const t = useTranslations("common");
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
        toast.success(t("message.on-success"));
      }
    },
    onError: (error) => {
      if (onError) {
        onError(error);
      } else {
        toast.error(
          getApiErrorMessage(error as AxiosError<IApiResError>, t),
        );
      }
    },
  });
}
