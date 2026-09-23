import { useTranslations } from "next-intl";
import type { AxiosError } from "axios";
import { toast } from "react-toastify";

import { usePut } from "@/hooks/base/put";
import type { IApiResError } from "@/types/api-res-error";
import type { Vendor } from "@/types/vendor";
import { getApiErrorMessage } from "@/utils/api-error";

import type { CreateVendorFormData } from "./create";
import { vendorsQueryKey } from "./get-all";

export type EditVendorFormData = CreateVendorFormData;

export function useEditVendor() {
  const t = useTranslations("common");

  const { mutateAsync: editVendorMutation, isPending: isEditVendorPending } =
    usePut<EditVendorFormData, Vendor, AxiosError<IApiResError>>({
      endPoint: "/api/vendors",
      queryKey: [...vendorsQueryKey],
      onSuccess: () => {
        toast.success(t("message.on-success"));
      },
      onError: (error) => {
        toast.error(getApiErrorMessage(error, t));
      },
    });

  return { editVendorMutation, isEditVendorPending };
}
