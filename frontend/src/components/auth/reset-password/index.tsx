"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { CheckCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { ResetPasswordInput } from "@/hooks/auth/reset-password";
import {
  resetPasswordFormSchema,
  useResetPassword,
} from "@/hooks/auth/reset-password";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { useCountdown } from "@/utils/countdown";
import { zodResolver } from "@hookform/resolvers/zod";

interface ResetPasswordPreviewProps {
  token?: string;
}

export default function ResetPasswordPreview({
  token,
}: ResetPasswordPreviewProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { locale } = useParams();
  const t = useTranslations("auth");
  const router = useRouter();
  const { mutate, isPending, isSuccess } = useResetPassword();

  const { countdown, startCountdown } = useCountdown();

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordFormSchema(t)),
    defaultValues: { newPassword: "", confirmPassword: "", token },
  });

  useEffect(() => {
    if (isSuccess) {
      setShowSuccess(true);
      startCountdown(5);
    }
  }, [isSuccess]);

  // Handle redirect when countdown reaches 0
  useEffect(() => {
    if (countdown === 0 && showSuccess) {
      router.push("/login");
    }
  }, [countdown, showSuccess, router]);

  function onSubmit(values: ResetPasswordInput) {
    if (!token) {
      return toast.error(t("invalid-missing-token"));
    }
    mutate({
      data: {
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
        token,
      },
    });
  }

  return (
    <>
      {!token ? (
        <Button
          onClick={() => router.push(`/forgot-password`)}
          className="w-full"
        >
          {t("request-new-reset-link")}
        </Button>
      ) : showSuccess ? (
        <div className="space-y-4 text-center">
          <div className="flex justify-center">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-green-700">
              {t("password-reset-successful")}
            </h3>
            <p className="text-sm text-gray-600">
              {t("redirecting-to-login")} {countdown}s
            </p>
          </div>
          <Button
            onClick={() => router.push("/login")}
            className="w-full"
            variant="outline"
          >
            {t("go-to-login-now")}
          </Button>
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Password Field */}
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="newPassword">{t("password")}</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input
                        id="newPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder={t("enter-new-password")}
                        autoComplete="new-password"
                        className="pr-10"
                        {...field}
                      />
                    </FormControl>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                    >
                      {!showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Confirm Password Field */}
            <FormField
              control={form.control}
              name="confirmPassword"
              rules={{
                validate: (value) => {
                  if (value !== form.getValues("newPassword")) {
                    return t("validation.passwords-must-match");
                  }
                },
              }}
              render={({ field }) => (
                <FormItem className="mb-1">
                  <FormLabel htmlFor="confirmPassword">
                    {t("confirm-new-password")}
                  </FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder={t("confirm-new-password")}
                        autoComplete="new-password"
                        className="pr-10"
                        {...field}
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      tabIndex={-1}
                    >
                      {!showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Link
              href="/forgot-password"
              className={`inline-block text-sm underline-offset-4 hover:underline ${
                locale === "ar" ? "mr-auto" : "ml-auto"
              }`}
            >
              {t("request-new-reset-link")}
            </Link>

            <Button type="submit" className="h-10 w-full" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("resetting-password")}
                </>
              ) : (
                t("reset-password")
              )}
            </Button>
          </form>
        </Form>
      )}
    </>
  );
}
