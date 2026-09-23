"use client";

import { useTranslations } from "next-intl";

import ActionConfirmationDialog from "@/components/common/action-confirmation-dialog";
import { useDeleteVendor } from "@/hooks/vendors/delete";
import type { Vendor } from "@/types/vendor";

type Props = {
  openDelete: boolean;
  setOpenDelete: (open: boolean) => void;
  vendor: Vendor;
};

export default function DeleteVendorForm({
  openDelete,
  setOpenDelete,
  vendor,
}: Props) {
  const t = useTranslations("vendors");
  const { deleteVendorMutation, isDeleteVendorPending } = useDeleteVendor();

  return (
    <ActionConfirmationDialog
      open={openDelete}
      isLoading={isDeleteVendorPending}
      title={t("delete.title")}
      message={t("delete.message", { name: vendor.name })}
      onConfirm={() => deleteVendorMutation(vendor.id)}
      onOpenChange={(open) => {
        if (!open) {
          setOpenDelete(false);
        }
      }}
    />
  );
}
