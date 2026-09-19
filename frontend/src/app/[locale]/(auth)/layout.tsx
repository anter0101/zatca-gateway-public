import type { Metadata, Viewport } from "next";

import Provider from "@/components/providers/main";
import { getLocaleMessages } from "@/i18n/i18n-helpers";
import type { IPageProps } from "@/types/types";
import { baseMetadata } from "@/utils/base-metadata";

import "@/styles/globals.css";
import Header from "@/components/layout/header/header";

export async function generateMetadata({
  params,
}: IPageProps): Promise<Metadata> {
  const { locale } = await params;
  const commonMessages = await getLocaleMessages(locale, "common");

  return baseMetadata(locale, {
    title: commonMessages.name,
    description: commonMessages["document-management-system"],
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

export default async function LocaleLayout({ children, params }: IPageProps) {
  const resolvedParams = await params;
  const { locale } = resolvedParams;

  return (
    <Provider locale={locale}>
      <div className="bg-card flex min-h-screen w-full flex-col transition-colors">
        <Header />
        <div className="flex flex-grow items-center justify-center">
          {children}
        </div>
      </div>
    </Provider>
  );
}
