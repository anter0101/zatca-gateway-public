import type { Metadata, Viewport } from "next";

import AuthTokenProvider from "@/components/providers/auth-token";
import Provider from "@/components/providers/main";
import { getLocaleMessages } from "@/i18n/i18n-helpers";
import type { IPageComponentProps } from "@/types/types";
import { baseMetadata } from "@/utils/base-metadata";

import { auth } from "@/lib/authentication/auth";
import Header from "@/components/layout/header/header";

export async function generateMetadata({
  params,
}: IPageComponentProps): Promise<Metadata> {
  const { locale } = await params;
  const commonMessages = await getLocaleMessages(locale, "common");

  return baseMetadata(locale, {
    title: commonMessages.name,
    description: commonMessages["zatca-gateway"],
  });
}

export function generateViewport(): Viewport {
  return {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  };
}

type Props = Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>;

export default async function Layout({ children, params }: Props) {
  const session = await auth();
  const resolvedParams = await params;
  const { locale } = resolvedParams;

  return (
    <Provider locale={locale}>
      <AuthTokenProvider token={session?.token || ""}>
        <Header user={session?.user} />
        {children}
      </AuthTokenProvider>
    </Provider>
  );
}
