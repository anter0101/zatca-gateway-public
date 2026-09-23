"use client";

import { useTranslations } from "next-intl";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import VendorForm from "@/components/vendors/vendor-form";

type Props = {
  openForm: boolean;
  setOpenForm: (open: boolean) => void;
};

export default function CreateVendorForm({ openForm, setOpenForm }: Props) {
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
        <DialogTitle className="sr-only">{t("create-title")}</DialogTitle>
        <VendorForm mode="create" onClose={() => setOpenForm(false)} />
      </DialogContent>
    </Dialog>
  );
}
