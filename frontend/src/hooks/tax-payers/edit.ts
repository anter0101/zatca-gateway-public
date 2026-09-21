import { useTranslations } from "next-intl";
import { toast } from "react-toastify";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { updateTaxPayer } from "@/mockup-data/tax-payers";
import type { InvoiceType, TaxPayerStatus } from "@/types/tax-payer";

import type { CreateTaxPayerFormData } from "./create";
import { taxPayersQueryKey } from "./get-all";

export type EditTaxPayerFormData = CreateTaxPayerFormData;

export function useEditTaxPayer(vendorId: number) {
  const t = useTranslations("common.message");
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: {
        vatNumber: string;
        legalName: string;
        organizationUnitName: string;
        locationAddress: string;
        industryBusinessCategory: string;
        invoiceType: InvoiceType;
        status?: TaxPayerStatus;
      };
    }) => updateTaxPayer(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taxPayersQueryKey(vendorId) });
      toast.success(t("on-success"));
    },
    onError: () => {
      toast.error(t("on-error"));
    },
  });

  return {
    editTaxPayerMutation: mutation.mutateAsync,
    isEditTaxPayerPending: mutation.isPending,
  };
}
