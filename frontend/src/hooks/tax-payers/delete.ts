import { useTranslations } from "next-intl";
import type { AxiosError } from "axios";
import { toast } from "react-toastify";

import { useDelete } from "@/hooks/base/delete";
import type { IApiResError } from "@/types/api-res-error";
import { getApiErrorMessage } from "@/utils/api-error";

import { taxPayersQueryKey } from "./get-all";

export function useDeleteTaxPayer(vendorId: number) {
  const t = useTranslations("common");

  const {
    mutateAsync: deleteTaxPayerMutation,
    isPending: isDeleteTaxPayerPending,
  } = useDelete<Record<string, never>, AxiosError<IApiResError>>({
    endPoint: `api/vendors/${vendorId}/tax-payers`,
    queryKey: [...taxPayersQueryKey(vendorId)],
    onSuccess: () => {
      toast.success(t("message.on-success"));
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, t));
    },
  });

  return {
    deleteTaxPayerMutation: async (id: number) =>
      deleteTaxPayerMutation(String(id)),
    isDeleteTaxPayerPending,
  };
}
