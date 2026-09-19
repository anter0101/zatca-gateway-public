import type { Metadata } from "next";

import ForgetPasswordForm from "@/components/auth/forgot-password";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getLocaleMessages } from "@/i18n/i18n-helpers";
import type { IPageComponentProps } from "@/types/types";
import { baseMetadata } from "@/utils/base-metadata";

export async function generateMetadata({
  params,
}: IPageComponentProps): Promise<Metadata> {
  const { locale } = await params;
  const authMessages = await getLocaleMessages(locale, "auth");
  const commonMessages = await getLocaleMessages(locale, "common");

  return baseMetadata(locale, {
    title: `${authMessages["forgot-password"]} - ${commonMessages.name}`,
    description: authMessages["forgot-password-description"],
    keywords: ["forgot password", "reset password", "authentication", "DMS"],
  });
}

export default async function ForgetPassword({ params }: IPageComponentProps) {
  const { locale } = await params;
  const authMessages = await getLocaleMessages(locale, "auth");

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-primary text-center text-2xl font-bold">
          {authMessages["forgot-password"]}
        </CardTitle>
        <CardDescription className="text-center">
          {authMessages["forgot-password-description"]}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ForgetPasswordForm />
      </CardContent>
    </Card>
  );
}
