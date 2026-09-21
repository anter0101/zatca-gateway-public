import { useTranslations } from "next-intl";
import { toast } from "react-toastify";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { removeTaxPayer } from "@/mockup-data/tax-payers";

import { taxPayersQueryKey } from "./get-all";

export function useDeleteTaxPayer(vendorId: number) {
  const t = useTranslations("common.message");
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: number) => removeTaxPayer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taxPayersQueryKey(vendorId) });
      toast.success(t("on-success"));
    },
    onError: () => {
      toast.error(t("on-error"));
    },
  });

  return {
    deleteTaxPayerMutation: mutation.mutateAsync,
    isDeleteTaxPayerPending: mutation.isPending,
  };
}
