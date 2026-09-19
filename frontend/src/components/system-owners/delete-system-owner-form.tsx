"use client";

import { useTranslations } from "next-intl";

import ActionConfirmationDialog from "@/components/common/action-confirmation-dialog";
import { useDeleteSystemOwner } from "@/hooks/system-owners/delete";
import type { SystemOwner } from "@/types/system-owner";

type Props = {
  openDelete: boolean;
  setOpenDelete: (open: boolean) => void;
  owner: SystemOwner;
};

export default function DeleteSystemOwnerForm({
  openDelete,
  setOpenDelete,
  owner,
}: Props) {
  const t = useTranslations("system-owners");
  const { deleteSystemOwnerMutation, isDeleteSystemOwnerPending } =
    useDeleteSystemOwner();

  return (
    <ActionConfirmationDialog
      open={openDelete}
      isLoading={isDeleteSystemOwnerPending}
      title={t("delete.title")}
      message={t("delete.message", { name: owner.name })}
      onConfirm={() => deleteSystemOwnerMutation(owner.id)}
      onOpenChange={(open) => {
        if (!open) {
          setOpenDelete(false);
        }
      }}
    />
  );
}
