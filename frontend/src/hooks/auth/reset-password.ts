import { useTranslations } from "next-intl";
import type { AxiosError } from "axios";
import { toast } from "react-toastify";
import { z } from "zod";

import { usePut } from "@/hooks/base/put";
import type { IApiResError } from "@/types/api-res-error";
import type { IApiResSuccess } from "@/types/api-res-success";

export const resetPasswordFormSchema = (
  t: (key: string, values?: Record<string, string | number | Date>) => string,
) =>
  z
    .object({
      newPassword: z
        .string()
        .min(
          1,
          t("validation.field-required", {
            fieldName: t("field-names.new-password"),
          }),
        )
        .min(
          8,
          t("validation.field-min-length", {
            fieldName: t("field-names.new-password"),
            min: 8,
          }),
        )
        .regex(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
          t("validation.password-complexity"),
        ),
      confirmPassword: z.string().min(
        1,
        t("validation.field-required", {
          fieldName: t("field-names.confirm-password"),
        }),
      ),
      token: z.string().min(
        1,
        t("validation.field-required", {
          fieldName: t("field-names.token"),
        }),
      ),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: t("validation.passwords-must-match"),
      path: ["confirmPassword"],
    });

export type ResetPasswordInput = z.infer<
  ReturnType<typeof resetPasswordFormSchema>
>;

export const useResetPassword = () => {
  const t = useTranslations("auth");
  const mutation = usePut<
    ResetPasswordInput,
    IApiResSuccess<ResetPasswordInput>,
    AxiosError<IApiResError>
  >({
    endPoint: "/api/auth/reset-password",
    queryKey: ["auth", "reset-password"],
    onSuccess: () => {
      toast.success(t("password-reset-successful"));
    },
    onError: (error) => {
      if (error.response?.status === 401) {
        toast.error(t("invalid-token"));
      } else {
        toast.error(t("password-reset-failed"));
      }
    },
  });

  return {
    mutate: mutation.mutate,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
  };
};
