import Head from "next/head";
import { SessionProvider } from "next-auth/react";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import type { ReactNode } from "react";
import { ToastContainer } from "react-toastify";
import { ShadcnProvider } from "@/components/providers/shadcn";
import queryClient from "@/lib/query-client";
import { QueryClientProvider } from "@tanstack/react-query";

import { auth } from "@/lib/authentication/auth";

import "@/styles/globals.css";

type Props = Readonly<{
  children: ReactNode;
  locale: string;
}>;

export default async function Provider({ children, locale }: Readonly<Props>) {
  const messages = await getMessages({
    locale,
  });
  const session = await auth();

  return (
    <html
      lang={locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
      suppressHydrationWarning
    >
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <body className="bg-card">
        <SessionProvider session={session}>
          <NextIntlClientProvider messages={messages} locale={locale}>
            <QueryClientProvider client={queryClient}>
              <ShadcnProvider>
                <div className="p-4">{children}</div>
                <ToastContainer
                  position={locale === "ar" ? "bottom-left" : "bottom-right"}
                />
              </ShadcnProvider>
            </QueryClientProvider>
          </NextIntlClientProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
