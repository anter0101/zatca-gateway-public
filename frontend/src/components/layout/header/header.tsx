"use client";
import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { LogOut, UserRound } from "lucide-react";

import LanguageSwitcher from "@/components/common/language-switcher";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import type { UserType } from "@/types/auth/user";
import { ThemeButton } from "@/components/common/theme-btn";

type Props = {
  user?: UserType;
};

export default function Header({ user }: Readonly<Props>) {
  const t = useTranslations("common");
  const [, startTransition] = useTransition();
  const router = useRouter();

  const handleLogout = async () => {
    const response = await fetch("/api/auth/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (response.ok) {
      startTransition(() => router.replace("/login"));
    } else {
      console.error("Logout failed");
    }
  };

  return (
    <header className="bg-background flex h-14 items-center justify-between rounded-t-md px-2 shadow-sm sm:px-2">
      {/* Desktop */}
      <section className="flex gap-4">
        <LanguageSwitcher />
        <ThemeButton />
      </section>

      <section className="flex gap-4">
        {user && (
          <Button
            variant="outline"
            size="sm"
            className="group hover:bg-primary/90 border-primary cursor-pointer rounded-full border-1 px-2 transition-all duration-900 hover:text-white"
          >
            <UserRound strokeWidth={2} className="h-[10px] w-[10px]" />
            <span className="hidden transition-all duration-900 group-hover:inline">
              {user?.email}
            </span>
          </Button>
        )}
        {user && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="group hover:bg-primary/90 border-primary cursor-pointer rounded-full border-1 transition-all duration-900 hover:text-white"
          >
            <LogOut className="h-4 w-4 rotate-180" />
            <span className="hidden transition-all duration-900 group-hover:inline">
              {t("logout")}
            </span>
          </Button>
        )}
      </section>
    </header>
  );
}
