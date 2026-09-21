"use client";

import { useTranslations } from "next-intl";

import ActionConfirmationDialog from "@/components/common/action-confirmation-dialog";
import { useDeleteTaxPayer } from "@/hooks/tax-payers/delete";
import type { TaxPayer } from "@/types/tax-payer";

type Props = {
  openDelete: boolean;
  setOpenDelete: (open: boolean) => void;
  payer: TaxPayer;
};

export default function DeleteTaxPayerForm({
  openDelete,
  setOpenDelete,
  payer,
}: Props) {
  const t = useTranslations("tax-payers");
  const { deleteTaxPayerMutation, isDeleteTaxPayerPending } = useDeleteTaxPayer(
    payer.vendorId,
  );

  return (
    <ActionConfirmationDialog
      open={openDelete}
      isLoading={isDeleteTaxPayerPending}
      title={t("delete.title")}
      message={t("delete.message", { name: payer.legalName })}
      onConfirm={() => deleteTaxPayerMutation(payer.id)}
      onOpenChange={(open) => {
        if (!open) {
          setOpenDelete(false);
        }
      }}
    />
  );
}
