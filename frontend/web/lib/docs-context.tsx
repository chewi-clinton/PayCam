"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getSandboxApiKey, setSandboxApiKey } from "./sandbox-api";

export type DocsLanguage = "python" | "javascript";

type DocsState = {
  language: DocsLanguage;
  setLanguage: (lang: DocsLanguage) => void;
  apiKey: string;
  setApiKey: (key: string) => void;
  activeSection: string;
  setActiveSection: (id: string) => void;
};

const DocsContext = createContext<DocsState | null>(null);

export function DocsProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<DocsLanguage>("javascript");
  const [apiKey, setApiKeyState] = useState("");
  const [activeSection, setActiveSection] = useState("introduction");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from localStorage on mount
    setApiKeyState(getSandboxApiKey());
  }, []);

  const setApiKey = (key: string) => {
    setApiKeyState(key);
    setSandboxApiKey(key);
  };

  return (
    <DocsContext.Provider
      value={{ language, setLanguage, apiKey, setApiKey, activeSection, setActiveSection }}
    >
      {children}
    </DocsContext.Provider>
  );
}

export function useDocs() {
  const ctx = useContext(DocsContext);
  if (!ctx) throw new Error("useDocs must be used within DocsProvider");
  return ctx;
}
