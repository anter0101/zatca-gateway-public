import { useTranslations } from "next-intl";
import type { AxiosError } from "axios";
import { toast } from "react-toastify";

import { useDelete } from "@/hooks/base/delete";
import type { IApiResError } from "@/types/api-res-error";
import { getApiErrorMessage } from "@/utils/api-error";

import { vendorsQueryKey } from "./get-all";

export function useDeleteVendor() {
  const t = useTranslations("common");

  const {
    mutateAsync: deleteVendorMutation,
    isPending: isDeleteVendorPending,
  } = useDelete<Record<string, never>, AxiosError<IApiResError>>({
    endPoint: "api/vendors",
    queryKey: [...vendorsQueryKey],
    onSuccess: () => {
      toast.success(t("message.on-success"));
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, t));
    },
  });

  return {
    deleteVendorMutation: async (id: number) =>
      deleteVendorMutation(String(id)),
    isDeleteVendorPending,
  };
}
