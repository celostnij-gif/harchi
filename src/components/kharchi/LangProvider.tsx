"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";
import { STRINGS, type Lang, type UIStrings } from "@/lib/i18n";
import { deepMerge } from "@/lib/deep-merge";

/* external language store backed by localStorage ------------------- */
const LANG_EVENT = "kharchi:lang-change";

const langStore = {
  get(): Lang {
    if (typeof window === "undefined") return "uk";
    return window.localStorage.getItem("lang") === "en" ? "en" : "uk";
  },
  set(l: Lang) {
    window.localStorage.setItem("lang", l);
    window.dispatchEvent(new Event(LANG_EVENT));
  },
  subscribe(cb: () => void) {
    window.addEventListener(LANG_EVENT, cb);
    window.addEventListener("storage", cb);
    return () => {
      window.removeEventListener(LANG_EVENT, cb);
      window.removeEventListener("storage", cb);
    };
  },
};

function useLangState(): [Lang, (l: Lang) => void] {
  const lang = useSyncExternalStore(
    langStore.subscribe,
    () => langStore.get(),
    () => "uk" as Lang
  );
  const setLang = useCallback((l: Lang) => langStore.set(l), []);
  return [lang, setLang];
}

/* context ----------------------------------------------------------- */
interface LangContextValue {
  lang: Lang;
  t: UIStrings;
  setLang: (l: Lang) => void;
}

/** Override-и текстів з БД (server → client, plain object): { uk: {...}, en: {...} } */
export type LangOverrides = Record<Lang, Record<string, unknown>>;

const EMPTY_OVERRIDES: LangOverrides = { uk: {}, en: {} };

const LangContext = createContext<LangContextValue>({
  lang: "uk",
  t: STRINGS.uk,
  setLang: () => {},
});

export default function LangProvider({
  children,
  overrides = EMPTY_OVERRIDES,
}: {
  children: React.ReactNode;
  overrides?: LangOverrides;
}) {
  const [lang, setLang] = useLangState();

  // Keep <html lang> in sync (external system update)
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const t = useMemo(
    () => deepMerge(STRINGS[lang], overrides[lang] ?? {}),
    [lang, overrides]
  );

  return (
    <LangContext.Provider value={{ lang, t, setLang }}>
      {children}
    </LangContext.Provider>
  );
}

export const useLang = () => useContext(LangContext);
