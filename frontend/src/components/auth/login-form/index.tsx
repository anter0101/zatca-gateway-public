"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Eye, EyeOff, Loader2 } from "lucide-react";
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
import type { LoginInput } from "@/hooks/auth/login";
import { createLoginSchema, useLogin } from "@/hooks/auth/login";
import { Link } from "@/i18n/navigation";
import { zodResolver } from "@hookform/resolvers/zod";

export default function LoginForm() {
  const { locale } = useParams();
  const [showPassword, setShowPassword] = useState(false);
  const t = useTranslations("auth");
  const { mutate: login, isPending } = useLogin();

  const form = useForm<LoginInput>({
    resolver: zodResolver(createLoginSchema(t)),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginInput) => {
    login(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="email">{t("email")}</FormLabel>
              <FormControl>
                <Input
                  id="email"
                  type="email"
                  placeholder={t("enter-email")}
                  autoComplete="email"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem className="mb-1">
              <FormLabel htmlFor="password">{t("password")}</FormLabel>
              <div className="relative">
                <FormControl>
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={t("enter-password")}
                    autoComplete="current-password"
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

        <Link
          href={`/forgot-password`}
          className={`inline-block text-sm underline-offset-4 hover:underline ${
            locale === "ar" ? "mr-auto" : "ml-auto"
          }`}
        >
          {t("forgot-password")}
        </Link>

        <Button type="submit" className="h-10 w-full" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("signing-in")}
            </>
          ) : (
            t("sign-in")
          )}
        </Button>
      </form>
    </Form>
  );
}
