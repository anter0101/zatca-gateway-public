import { useTranslations } from "next-intl";
import type { AxiosError } from "axios";
import { toast } from "react-toastify";
import z from "zod";

import { useCreate } from "@/hooks/base/create";
import type { IApiResError } from "@/types/api-res-error";
import type { IApiResSuccess } from "@/types/api-res-success";

export const createForgotPasswordSchema = (
  t: (key: string, values?: Record<string, string | number | Date>) => string,
) =>
  z.object({
    email: z
      .string()
      .email(t("validation.email-invalid"))
      .min(
        1,
        t("validation.field-required", {
          fieldName: t("field-names.email"),
        }),
      ),
  });

export type ForgotPasswordInput = z.infer<
  ReturnType<typeof createForgotPasswordSchema>
>;

export const useForgetPassword = () => {
  const t = useTranslations("auth");
  const { mutate, isPending } = useCreate<
    ForgotPasswordInput,
    IApiResSuccess<ForgotPasswordInput>,
    AxiosError<IApiResError>
  >({
    endPoint: "/api/auth/forget-password",
    queryKey: ["/api/auth/forget-password"],
    onSuccess: () => {
      toast.success(t("password-reset-email-sent"));
    },
    onError: (error) => {
      if (error.response?.status === 404) {
        toast.error(t("user-not-found"));
      } else {
        toast.error(t("failed-to-send-reset-email"));
      }
    },
  });

  return { mutate, isPending };
};
