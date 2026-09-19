"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ThemeButton() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Avoid hydration mismatch: next-themes resolves theme from localStorage on the client,
  // so server (defaultTheme) can differ from client. Use defaultTheme icon until mounted.
  const resolvedTheme = mounted ? theme : "dark";

  return (
    <Button
      variant="outline"
      size="icon"
      className="bg-background/5 border-primary hover:bg-primary rounded-full p-4"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label={
        resolvedTheme === "dark"
          ? "Switch to light mode"
          : "Switch to dark mode"
      }
    >
      {resolvedTheme === "dark" ? <Sun /> : <Moon />}
    </Button>
  );
}
