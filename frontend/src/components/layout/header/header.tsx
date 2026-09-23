"use client";
import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { LogOut, UserRound } from "lucide-react";

import LanguageSwitcher from "@/components/common/language-switcher";
import { ThemeButton } from "@/components/common/theme-btn";
import { Button } from "@/components/ui/button";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import type { UserType } from "@/types/auth/user";
import { cn } from "@/utils/css-classes-merge";

type Props = {
  user?: UserType;
};

const navItems = [
  { href: "/vendors" as const, labelKey: "nav.vendors" as const },
  { href: "/tax-payers" as const, labelKey: "nav.tax-payers" as const },
];

export default function Header({ user }: Readonly<Props>) {
  const t = useTranslations("common");
  const [, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();

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
      <section className="flex items-center gap-2 sm:gap-4">
        <LanguageSwitcher />
        <ThemeButton />
        {user && (
          <nav className="ml-1 flex items-center gap-1 sm:ml-2 sm:gap-2">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-md px-2 py-1.5 text-xs font-medium transition-colors sm:px-3 sm:text-sm",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {t(item.labelKey)}
                </Link>
              );
            })}
          </nav>
        )}
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
