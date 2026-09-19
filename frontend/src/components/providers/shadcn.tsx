"use client";

import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";

type ShadcnProviderProps = {
  children: ReactNode;
};

export function ShadcnProvider({ children }: ShadcnProviderProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  );
}
