import type { Metadata } from "next";

import LoginForm from "@/components/auth/login-form";
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
    title: `${authMessages["sign-in"]} - ${commonMessages.name}`,
    description: authMessages["enter-credentials"],
    keywords: ["login", "sign in", "authentication", "DMS"],
    authors: [{ name: "DMS Team" }],
  });
}

export default async function Login({ params }: IPageComponentProps) {
  const { locale } = await params;
  const authMessages = await getLocaleMessages(locale, "auth");

  return (
    <Card className="mx-4 w-full max-w-md md:mx-0">
      <CardHeader className="space-y-1">
        <CardTitle className="text-center text-2xl font-bold">
          {authMessages["welcome-back"]}
        </CardTitle>
        <CardDescription className="text-center">
          {authMessages["enter-credentials"]}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm />
      </CardContent>
    </Card>
  );
}
