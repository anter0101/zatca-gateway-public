import { useTranslations } from "next-intl";
import { toast } from "react-toastify";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createSystemOwner } from "@/mockup-data/system-owners";
import type { SystemOwnerStatus } from "@/types/system-owner";

import { systemOwnersQueryKey } from "./get-all";

export function createSystemOwnerSchema(t: (key: string) => string) {
  return z.object({
    name: z.string().min(1, t("validation.name-required")),
    slug: z.string().optional(),
    status: z.enum(["active", "suspended"], {
      message: t("validation.status-required"),
    }),
  });
}

export type CreateSystemOwnerFormData = z.infer<
  ReturnType<typeof createSystemOwnerSchema>
>;

export function useCreateSystemOwner() {
  const t = useTranslations("common.message");
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: {
      name: string;
      slug?: string;
      status: SystemOwnerStatus;
    }) => createSystemOwner(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: systemOwnersQueryKey });
      toast.success(t("on-success"));
    },
    onError: () => {
      toast.error(t("on-error"));
    },
  });

  return {
    createSystemOwnerMutation: mutation.mutateAsync,
    isCreateSystemOwnerPending: mutation.isPending,
  };
}
