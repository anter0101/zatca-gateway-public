"use client";

import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";

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
import type { ForgotPasswordInput } from "@/hooks/auth/forget-password";
import {
  createForgotPasswordSchema,
  useForgetPassword,
} from "@/hooks/auth/forget-password";
import { useCountdown } from "@/utils/countdown";
import { zodResolver } from "@hookform/resolvers/zod";

export default function ForgetPasswordForm() {
  const t = useTranslations("auth");
  const { mutate, isPending } = useForgetPassword();

  const { countdown, startCountdown } = useCountdown();

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(createForgotPasswordSchema(t)),
    defaultValues: { email: "" },
  });

  function onSubmit(values: ForgotPasswordInput) {
    if (countdown > 0 || isPending) {
      return;
    }
    mutate(values, {
      onSuccess: () => {
        startCountdown(60);
      },
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="grid gap-2">
                <FormLabel htmlFor="email">{t("email")}</FormLabel>
                <FormControl>
                  <Input
                    id="email"
                    placeholder={t("enter-email")}
                    type="email"
                    autoComplete="email"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            className="w-full"
            disabled={isPending || countdown > 0}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("send-reset-password")}
              </>
            ) : (
              <>
                {t("send-reset-password")}
                {countdown > 0 ? ` (${countdown}s)` : ""}
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
