import { useTranslations } from "next-intl";
import type { AxiosError } from "axios";
import { toast } from "react-toastify";
import { z } from "zod";

import { useCreate } from "@/hooks/base/create";
import type { IApiResError } from "@/types/api-res-error";
import type { Vendor } from "@/types/vendor";
import { getApiErrorMessage } from "@/utils/api-error";

import { vendorsQueryKey } from "./get-all";

export function createVendorSchema(t: (key: string) => string) {
  return z.object({
    name: z.string().min(1, t("validation.name-required")),
    slug: z.string().optional(),
    status: z.enum(["active", "suspended"], {
      message: t("validation.status-required"),
    }),
  });
}

export type CreateVendorFormData = z.infer<
  ReturnType<typeof createVendorSchema>
>;

export function useCreateVendor() {
  const t = useTranslations("common");

  const {
    mutateAsync: createVendorMutation,
    isPending: isCreateVendorPending,
  } = useCreate<CreateVendorFormData, Vendor, AxiosError<IApiResError>>({
    endPoint: "/api/vendors",
    queryKey: [...vendorsQueryKey],
    onSuccess: () => {
      toast.success(t("message.on-success"));
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, t));
    },
  });

  return { createVendorMutation, isCreateVendorPending };
}
