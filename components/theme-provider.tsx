"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ReactNode } from "react";

/** Thème clair / sombre / système (classe `.dark` sur <html>) */
export const ThemeProvider = ({ children }: { children: ReactNode }) => (
  <NextThemesProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange
    // Nouvelle clé : l'ancien réglage "theme" (factice) ne doit pas bloquer le mode système
    storageKey="duck-theme"
  >
    {children}
  </NextThemesProvider>
);
