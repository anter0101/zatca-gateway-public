import { useTranslations } from "next-intl";
import type { AxiosError } from "axios";
import { toast } from "react-toastify";

import { usePut } from "@/hooks/base/put";
import type { IApiResError } from "@/types/api-res-error";
import type { TaxPayer } from "@/types/tax-payer";
import { getApiErrorMessage } from "@/utils/api-error";

import type { CreateTaxPayerFormData } from "./create";
import { taxPayersQueryKey } from "./get-all";

export type EditTaxPayerFormData = CreateTaxPayerFormData;

export function useEditTaxPayer(vendorId: number) {
  const t = useTranslations("common");

  const {
    mutateAsync: editTaxPayerMutation,
    isPending: isEditTaxPayerPending,
  } = usePut<EditTaxPayerFormData, TaxPayer, AxiosError<IApiResError>>({
    endPoint: `/api/vendors/${vendorId}/tax-payers`,
    queryKey: [...taxPayersQueryKey(vendorId)],
    onSuccess: () => {
      toast.success(t("message.on-success"));
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, t));
    },
  });

  return { editTaxPayerMutation, isEditTaxPayerPending };
}
