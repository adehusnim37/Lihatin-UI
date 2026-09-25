"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type DocsLocale = "id" | "en";

const STORAGE_KEY = "lihatin-docs-locale";

const LocaleContext = createContext<{
  locale: DocsLocale;
  setLocale: (locale: DocsLocale) => void;
}>({
  locale: "id",
  setLocale: () => {},
});

export function DocsLocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<DocsLocale>("id");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "id" || stored === "en") {
      // One-time hydration of the persisted preference; not a cascading state update.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocaleState(stored);
    }
  }, []);

  function setLocale(next: DocsLocale) {
    setLocaleState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }

  return <LocaleContext.Provider value={{ locale, setLocale }}>{children}</LocaleContext.Provider>;
}

export function useDocsLocale() {
  return useContext(LocaleContext);
}

/** Returns a translator function `t(key)` bound to the current docs locale. */
export function useGuideT() {
  const { locale } = useDocsLocale();
  return {
    locale,
    t: (entry: { id: string; en: string }) => entry[locale],
  };
}

/** Renders text with `code` segments (backtick-delimited) as <code> elements. */
export function renderInline(text: string) {
  const parts = text.split(/(`[^`]+`)/g);
  return parts.map((part, index) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={index}>{part.slice(1, -1)}</code>;
    }
    return <span key={index}>{part}</span>;
  });
}
