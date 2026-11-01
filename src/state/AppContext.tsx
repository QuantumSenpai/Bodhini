import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { openDatabaseAsync, type SQLiteDatabase } from "expo-sqlite";
import type { AppLanguage, DocumentAnalysis, DocumentRecord } from "../domain/document/document.types";
import type { FilledField, FormInput } from "../domain/form/form.types";
import { services } from "../composition/services";

export type InteractionMode = "speak" | "type";
export type ThemeMode = "system" | "light" | "dark";

interface PendingDocumentReview {
  imageUri: string;
  analysis: DocumentAnalysis;
}

interface AppContextValue {
  ready: boolean;
  onboardingComplete: boolean;
  language: AppLanguage;
  interactionMode: InteractionMode;
  themeMode: ThemeMode;
  pendingDocument: PendingDocumentReview | null;
  documents: DocumentRecord[];
  documentsLoading: boolean;
  pendingFormInput: FormInput | null;
  filledFields: FilledField[];
  setLanguage: (language: AppLanguage) => Promise<void>;
  setInteractionMode: (mode: InteractionMode) => Promise<void>;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  setPendingDocument: React.Dispatch<React.SetStateAction<PendingDocumentReview | null>>;
  refreshDocuments: () => Promise<void>;
  setPendingFormInput: React.Dispatch<React.SetStateAction<FormInput | null>>;
  setFilledFields: React.Dispatch<React.SetStateAction<FilledField[]>>;
}

const AppContext = createContext<AppContextValue | null>(null);
let dbPromise: Promise<SQLiteDatabase> | null = null;

async function preferencesDb(): Promise<SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await openDatabaseAsync("bodhini-preferences.db");
      await db.execAsync("CREATE TABLE IF NOT EXISTS preferences (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);");
      return db;
    })();
  }
  return dbPromise;
}

async function readPreference(key: string): Promise<string | null> {
  const db = await preferencesDb();
  const row = await db.getFirstAsync<{ value: string }>("SELECT value FROM preferences WHERE key = ?;", key);
  return row?.value ?? null;
}

async function writePreference(key: string, value: string): Promise<void> {
  const db = await preferencesDb();
  await db.runAsync("INSERT OR REPLACE INTO preferences (key, value) VALUES (?, ?);", key, value);
}

export function AppProvider({ children }: React.PropsWithChildren) {
  const [ready, setReady] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [language, setLanguageState] = useState<AppLanguage>("en");
  const [interactionMode, setInteractionModeState] = useState<InteractionMode>("type");
  const [themeMode, setThemeModeState] = useState<ThemeMode>("system");
  const [pendingDocument, setPendingDocument] = useState<PendingDocumentReview | null>(null);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [pendingFormInput, setPendingFormInput] = useState<FormInput | null>(null);
  const [filledFields, setFilledFields] = useState<FilledField[]>([]);

  const refreshDocuments = useCallback(async () => {
    setDocumentsLoading(true);
    try {
      const records = await services.documentRepository.getAll();
      setDocuments(records);
    } finally {
      setDocumentsLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [savedLanguage, savedMode, savedTheme, completed] = await Promise.all([
          readPreference("language"),
          readPreference("interactionMode"),
          readPreference("themeMode"),
          readPreference("onboardingComplete"),
        ]);
        if (!active) return;
        if (savedLanguage === "en" || savedLanguage === "bn" || savedLanguage === "hi") setLanguageState(savedLanguage);
        if (savedMode === "speak" || savedMode === "type") setInteractionModeState(savedMode);
        if (savedTheme === "system" || savedTheme === "light" || savedTheme === "dark") setThemeModeState(savedTheme);
        setOnboardingComplete(completed === "true");
      } catch {
      } finally {
        if (active) setReady(true);
      }
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (ready) refreshDocuments().catch(() => setDocuments([]));
  }, [ready, refreshDocuments]);

  const setLanguage = useCallback(async (value: AppLanguage) => {
    setLanguageState(value);
    await writePreference("language", value);
  }, []);

  const setInteractionMode = useCallback(async (value: InteractionMode) => {
    setInteractionModeState(value);
    await writePreference("interactionMode", value);
  }, []);

  const setThemeMode = useCallback(async (value: ThemeMode) => {
    setThemeModeState(value);
    await writePreference("themeMode", value);
  }, []);

  const completeOnboarding = useCallback(async () => {
    setOnboardingComplete(true);
    await writePreference("onboardingComplete", "true");
  }, []);

  const value = useMemo<AppContextValue>(() => ({
    ready, onboardingComplete, language, interactionMode, themeMode, pendingDocument, documents, documentsLoading,
    pendingFormInput, filledFields, setLanguage, setInteractionMode, setThemeMode, completeOnboarding,
    setPendingDocument, refreshDocuments, setPendingFormInput, setFilledFields,
  }), [ready, onboardingComplete, language, interactionMode, themeMode, pendingDocument, documents, documentsLoading,
    pendingFormInput, filledFields, setLanguage, setInteractionMode, setThemeMode, completeOnboarding, refreshDocuments]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useBodhini(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) throw new Error("useBodhini must be used inside AppProvider");
  return context;
}
