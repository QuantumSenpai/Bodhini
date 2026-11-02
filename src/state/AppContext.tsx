import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AccessibilityInfo } from "react-native";
import { openDatabaseAsync, type SQLiteDatabase } from "expo-sqlite";
import * as FileSystem from "expo-file-system/legacy";
import type { AppLanguage, DocumentAnalysis, DocumentRecord } from "../domain/document/document.types";
import type { FilledField, FormInput } from "../domain/form/form.types";
import { services } from "../composition/services";

export type InteractionMode = "speak" | "type";
export type ThemeMode = "system" | "light" | "dark";
export type TextSize = 1 | 1.15 | 1.3;
export type DebugOcr = boolean;

export interface HintBubbleInfo {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

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
  profileName: string;
  textSize: TextSize;
  reduceMotion: boolean;
  userReduceMotion: boolean;
  debugOcr: boolean;
  pendingDocument: PendingDocumentReview | null;
  documents: DocumentRecord[];
  documentsLoading: boolean;
  pendingFormInput: FormInput | null;
  filledFields: FilledField[];
  comingSoonFeature: string | null;
  toastMessage: string | null;
  activeHint: HintBubbleInfo | null;
  setLanguage: (language: AppLanguage) => Promise<void>;
  setInteractionMode: (mode: InteractionMode) => Promise<void>;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  setProfileName: (name: string) => Promise<void>;
  setTextSize: (size: TextSize) => Promise<void>;
  setReduceMotion: (enabled: boolean) => Promise<void>;
  setDebugOcr: (enabled: boolean) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  clearAllData: () => Promise<void>;
  setPendingDocument: React.Dispatch<React.SetStateAction<PendingDocumentReview | null>>;
  refreshDocuments: () => Promise<void>;
  setPendingFormInput: React.Dispatch<React.SetStateAction<FormInput | null>>;
  setFilledFields: React.Dispatch<React.SetStateAction<FilledField[]>>;
  openComingSoon: (feature?: string) => void;
  closeComingSoon: () => void;
  showToast: (message: string) => void;
  hideToast: () => void;
  showHint: (info: HintBubbleInfo) => void;
  hideHint: () => void;
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
  const [profileName, setProfileNameState] = useState("");
  const [textSize, setTextSizeState] = useState<TextSize>(1);
  const [userReduceMotion, setUserReduceMotionState] = useState(false);
  const [systemReduceMotion, setSystemReduceMotion] = useState(false);
  const [debugOcr, setDebugOcrState] = useState(false);
  const [pendingDocument, setPendingDocument] = useState<PendingDocumentReview | null>(null);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [pendingFormInput, setPendingFormInput] = useState<FormInput | null>(null);
  const [filledFields, setFilledFields] = useState<FilledField[]>([]);
  const [comingSoonFeature, setComingSoonFeature] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeHint, setActiveHint] = useState<HintBubbleInfo | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (mounted) setSystemReduceMotion(Boolean(enabled));
      })
      .catch(() => undefined);
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", (enabled) => {
      if (mounted) setSystemReduceMotion(Boolean(enabled));
    });
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [savedLanguage, savedMode, savedTheme, completed, savedName, savedSize, savedMotion, savedDebugOcr] = await Promise.all([
          readPreference("language"),
          readPreference("interactionMode"),
          readPreference("themeMode"),
          readPreference("onboardingComplete"),
          readPreference("profileName"),
          readPreference("textSize"),
          readPreference("reduceMotion"),
          readPreference("debugOcr"),
        ]);
        if (!active) return;
        if (savedLanguage === "en" || savedLanguage === "bn" || savedLanguage === "hi") setLanguageState(savedLanguage);
        if (savedMode === "speak" || savedMode === "type") setInteractionModeState(savedMode);
        if (savedTheme === "system" || savedTheme === "light" || savedTheme === "dark") setThemeModeState(savedTheme);
        if (typeof savedName === "string") setProfileNameState(savedName);
        if (savedSize === "1" || savedSize === "1.15" || savedSize === "1.3") setTextSizeState(Number(savedSize) as TextSize);
        if (savedMotion === "true" || savedMotion === "false") setUserReduceMotionState(savedMotion === "true");
        if (savedDebugOcr === "true" || savedDebugOcr === "false") setDebugOcrState(savedDebugOcr === "true");
        setOnboardingComplete(completed === "true");
      } catch {
      } finally {
        if (active) setReady(true);
      }
    })();
    return () => {
      active = false;
    };
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

  const setProfileName = useCallback(async (value: string) => {
    const trimmed = value.trim();
    setProfileNameState(trimmed);
    await writePreference("profileName", trimmed);
  }, []);

  const setTextSize = useCallback(async (value: TextSize) => {
    setTextSizeState(value);
    await writePreference("textSize", String(value));
  }, []);

  const setReduceMotion = useCallback(async (value: boolean) => {
    setUserReduceMotionState(value);
    await writePreference("reduceMotion", value ? "true" : "false");
  }, []);

  const setDebugOcr = useCallback(async (value: boolean) => {
    setDebugOcrState(value);
    await writePreference("debugOcr", value ? "true" : "false");
  }, []);

  const completeOnboarding = useCallback(async () => {
    setOnboardingComplete(true);
    await writePreference("onboardingComplete", "true");
  }, []);

  const clearAllData = useCallback(async () => {
    const existing = await services.documentRepository.getAll();
    for (const doc of existing) {
      await services.documentRepository.delete(doc.id);
      if (doc.imageUri) {
        await FileSystem.deleteAsync(doc.imageUri, { idempotent: true }).catch(() => undefined);
      }
    }
    setDocuments([]);
    setPendingDocument(null);
    setPendingFormInput(null);
    setFilledFields([]);
  }, []);

  const openComingSoon = useCallback((feature?: string) => {
    setComingSoonFeature(feature ?? "");
  }, []);

  const closeComingSoon = useCallback(() => {
    setComingSoonFeature(null);
  }, []);

  const hideToast = useCallback(() => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    setToastMessage(null);
  }, []);

  const showToast = useCallback((message: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage(message);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
      toastTimerRef.current = null;
    }, 2200);
  }, []);

  const hideHint = useCallback(() => {
    if (hintTimerRef.current) {
      clearTimeout(hintTimerRef.current);
      hintTimerRef.current = null;
    }
    setActiveHint(null);
  }, []);

  const showHint = useCallback((info: HintBubbleInfo) => {
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    setActiveHint(info);
    hintTimerRef.current = setTimeout(() => {
      setActiveHint(null);
      hintTimerRef.current = null;
    }, 2500);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    };
  }, []);

  const reduceMotion = userReduceMotion || systemReduceMotion;

  const value = useMemo<AppContextValue>(() => ({
    ready,
    onboardingComplete,
    language,
    interactionMode,
    themeMode,
    profileName,
    textSize,
    reduceMotion,
    userReduceMotion,
    debugOcr,
    pendingDocument,
    documents,
    documentsLoading,
    pendingFormInput,
    filledFields,
    comingSoonFeature,
    toastMessage,
    activeHint,
    setLanguage,
    setInteractionMode,
    setThemeMode,
    setProfileName,
    setTextSize,
    setReduceMotion,
    setDebugOcr,
    completeOnboarding,
    clearAllData,
    setPendingDocument,
    refreshDocuments,
    setPendingFormInput,
    setFilledFields,
    openComingSoon,
    closeComingSoon,
    showToast,
    hideToast,
    showHint,
    hideHint,
  }), [
    ready,
    onboardingComplete,
    language,
    interactionMode,
    themeMode,
    profileName,
    textSize,
    reduceMotion,
    userReduceMotion,
    debugOcr,
    pendingDocument,
    documents,
    documentsLoading,
    pendingFormInput,
    filledFields,
    comingSoonFeature,
    toastMessage,
    activeHint,
    setLanguage,
    setInteractionMode,
    setThemeMode,
    setProfileName,
    setTextSize,
    setReduceMotion,
    setDebugOcr,
    completeOnboarding,
    clearAllData,
    refreshDocuments,
    openComingSoon,
    closeComingSoon,
    showToast,
    hideToast,
    showHint,
    hideHint,
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useBodhini(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) throw new Error("useBodhini must be used inside AppProvider");
  return context;
}
