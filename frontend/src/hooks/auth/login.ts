import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import type { AxiosError } from "axios";
import { toast } from "react-toastify";
import { z } from "zod";

import type { IApiResError } from "@/types/api-res-error";

export const createLoginSchema = (
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
    password: z
      .string()
      .nonempty(
        t("validation.field-required", {
          fieldName: t("field-names.password"),
        }),
      )
      .min(
        6,
        t("validation.field-min-length", {
          fieldName: t("field-names.password"),
          min: 6,
        }),
      ),
  });

export type LoginInput = z.infer<ReturnType<typeof createLoginSchema>>;

export interface LoginResult {
  ok: boolean;
  error?: string | null;
}

export const useLogin = () => {
  const router = useRouter();
  const t = useTranslations("auth");
  const [isPending, setIsPending] = useState(false);

  const mutate = async (loginData: LoginInput): Promise<LoginResult> => {
    setIsPending(true);
    try {
      const result = await signIn("credentials", {
        email: loginData.email,
        password: loginData.password,
        redirect: false,
      });

      if (result?.ok && !result?.error) {
        toast.success(t("actions.login-success"));
        router.push("/");
        return { ok: true };
      } else {
        const errorMessage = t("errors.invalid-credentials");
        toast.error(errorMessage);
        return { ok: false, error: errorMessage };
      }
    } catch (error) {
      const axiosError = error as AxiosError<IApiResError>;
      const errMessage =
        axiosError?.response?.data?.message || t("errors.server-error");
      toast.error(errMessage);
      return { ok: false, error: errMessage };
    } finally {
      setIsPending(false);
    }
  };

  return { mutate, isPending };
};
