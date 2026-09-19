"use client";

import { useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";

import { Button } from "@/components/ui/button";
import { usePathname, useRouter } from "@/i18n/navigation";
import { cn } from "@/utils/css-classes-merge";

type Props = {
  className?: string;
};

export default function LanguageSwitcher({ className }: Readonly<Props>) {
  const [, startTransition] = useTransition();
  const router = useRouter();
  const locale = useLocale();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function changeLanguage(
    newLocale: string,
    searchParams: URLSearchParams | null,
  ) {
    startTransition(() => {
      const params = searchParams?.toString();
      const url = params ? `${pathname}?${params}` : pathname;

      router.replace(url, { locale: newLocale });
    });
  }
  return (
    <div>
      <Button
        variant="outline"
        size="icon"
        onClick={() =>
          changeLanguage(locale === "ar" ? "en" : "ar", searchParams)
        }
        className={cn(
          "hover:bg-primary border-primary rounded-full border-1 font-medium transition-all duration-200",
          className,
        )}
      >
        {locale === "ar" ? "En" : "Ar"}
      </Button>
    </div>
  );
}
