import { useTranslations } from "next-intl";
import { toast } from "react-toastify";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { updateSystemOwner } from "@/mockup-data/system-owners";
import type { SystemOwnerStatus } from "@/types/system-owner";

import type { CreateSystemOwnerFormData } from "./create";
import { systemOwnersQueryKey } from "./get-all";

export type EditSystemOwnerFormData = CreateSystemOwnerFormData;

export function useEditSystemOwner() {
  const t = useTranslations("common.message");
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: {
        name: string;
        slug?: string;
        status: SystemOwnerStatus;
      };
    }) => updateSystemOwner(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: systemOwnersQueryKey });
      toast.success(t("on-success"));
    },
    onError: () => {
      toast.error(t("on-error"));
    },
  });

  return {
    editSystemOwnerMutation: mutation.mutateAsync,
    isEditSystemOwnerPending: mutation.isPending,
  };
}
