import type { Metadata } from "next";

import ResetPasswordPreview from "@/components/auth/reset-password";
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

type Props = IPageComponentProps & {
  searchParams: Promise<{ token?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const authMessages = await getLocaleMessages(locale, "auth");
  const commonMessages = await getLocaleMessages(locale, "common");

  return baseMetadata(locale, {
    title: `${authMessages["reset-password"]} - ${commonMessages.name}`,
    description: authMessages["password-description"],
    keywords: ["reset password", "password reset", "authentication", "DMS"],
  });
}

export default async function ResetPassword({ params, searchParams }: Props) {
  const { locale } = await params;
  const { token } = await searchParams;
  const authMessages = await getLocaleMessages(locale, "auth");

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-center text-2xl font-bold">
          {authMessages["reset-password"]}
        </CardTitle>
        <CardDescription className="text-center">
          {token
            ? authMessages["password-description"]
            : authMessages["use-valid-link-description"]}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResetPasswordPreview token={token} />
      </CardContent>
    </Card>
  );
}
