"use client";

import { useTranslations } from "next-intl";

import SystemOwnerForm from "@/components/system-owners/system-owner-form";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { SystemOwner } from "@/types/system-owner";

type Props = {
  openForm: boolean;
  setOpenForm: (open: boolean) => void;
  owner: SystemOwner;
};

export default function EditSystemOwnerForm({
  openForm,
  setOpenForm,
  owner,
}: Props) {
  const t = useTranslations("system-owners.form");

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
        <SystemOwnerForm
          mode="edit"
          owner={owner}
          onClose={() => setOpenForm(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
