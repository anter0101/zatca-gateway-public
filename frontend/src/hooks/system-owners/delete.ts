import { useTranslations } from "next-intl";
import { toast } from "react-toastify";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { removeSystemOwner } from "@/mockup-data/system-owners";

import { systemOwnersQueryKey } from "./get-all";

export function useDeleteSystemOwner() {
  const t = useTranslations("common.message");
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: number) => removeSystemOwner(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: systemOwnersQueryKey });
      toast.success(t("on-success"));
    },
    onError: () => {
      toast.error(t("on-error"));
    },
  });

  return {
    deleteSystemOwnerMutation: mutation.mutateAsync,
    isDeleteSystemOwnerPending: mutation.isPending,
  };
}
