"use client";

import { useTranslations } from "next-intl";

import TaxPayerForm from "@/components/tax-payers/tax-payer-form";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

type Props = {
  openForm: boolean;
  setOpenForm: (open: boolean) => void;
  vendorId: number;
};

export default function CreateTaxPayerForm({
  openForm,
  setOpenForm,
  vendorId,
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
        <DialogTitle className="sr-only">{t("create-title")}</DialogTitle>
        <TaxPayerForm
          mode="create"
          vendorId={vendorId}
          onClose={() => setOpenForm(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
