"use client";

import { useTranslations } from "next-intl";

import TaxPayerForm from "@/components/tax-payers/tax-payer-form";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { TaxPayer } from "@/types/tax-payer";

type Props = {
  openForm: boolean;
  setOpenForm: (open: boolean) => void;
  payer: TaxPayer;
};

export default function EditTaxPayerForm({
  openForm,
  setOpenForm,
  payer,
}: Props) {
  const t = useTranslations("tax-payers.form");

  return (
    <Dialog
      open={openForm}
      onOpenChange={(open) => {
        if (!open) {
          setOpenForm(false);
        }
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="max-w-[calc(100%-2rem)] border-none bg-transparent p-0 shadow-none sm:max-w-lg"
      >
        <DialogTitle className="sr-only">{t("edit-title")}</DialogTitle>
        <TaxPayerForm
          mode="edit"
          vendorId={payer.vendorId}
          payer={payer}
          onClose={() => setOpenForm(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
