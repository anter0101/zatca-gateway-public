"use client";

import { useTranslations } from "next-intl";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import VendorForm from "@/components/vendors/vendor-form";
import type { Vendor } from "@/types/vendor";

type Props = {
  openForm: boolean;
  setOpenForm: (open: boolean) => void;
  vendor: Vendor;
};

export default function EditVendorForm({
  openForm,
  setOpenForm,
  vendor,
}: Props) {
  const t = useTranslations("vendors.form");

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
        className="max-w-[calc(100%-2rem)] border-none bg-transparent p-0 shadow-none sm:max-w-md"
      >
        <DialogTitle className="sr-only">{t("edit-title")}</DialogTitle>
        <VendorForm
          mode="edit"
          vendor={vendor}
          onClose={() => setOpenForm(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
