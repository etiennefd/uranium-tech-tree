"use client";

import { useEffect } from "react";

// Maps the ?font= query param to the matching CSS variable so fonts can be
// compared live (e.g. ?font=plex). Default (no param) is set in globals.css.
const FONT_VARS: Record<string, string> = {
  space: "var(--font-space-mono)",
  plex: "var(--font-plex-mono)",
  geist: "var(--font-geist-mono)",
};

export default function FontSwitcher() {
  useEffect(() => {
    const apply = () => {
      const choice = new URLSearchParams(window.location.search).get("font");
      if (choice && FONT_VARS[choice]) {
        document.documentElement.style.setProperty(
          "--font-app-mono",
          FONT_VARS[choice]
        );
      }
    };
    apply();
    window.addEventListener("popstate", apply);
    return () => window.removeEventListener("popstate", apply);
  }, []);

  return null;
}
