import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { useColorScheme } from "react-native";
import { lightColors, darkColors, makeTheme, type Theme, type ThemeColors } from "./tokens";

type Mode = "system" | "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  colors: ThemeColors;
  mode: Mode;
  isDark: boolean;
  setMode: (mode: Mode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: React.PropsWithChildren) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<Mode>("system");

  useEffect(() => {
  }, []);

  const effectiveScheme: "light" | "dark" = mode === "system" ? (systemScheme ?? "light") : mode;
  const isDark = effectiveScheme === "dark";
  const colors = (isDark ? darkColors : lightColors) as unknown as ThemeColors;
  const theme = isDark ? makeTheme(darkColors as unknown as ThemeColors) : makeTheme(lightColors);

  const setMode = useCallback((newMode: Mode) => {
    setModeState(newMode);
  }, []);

  const value = useMemo<ThemeContextValue>(() => ({
    theme,
    colors,
    mode,
    isDark,
    setMode,
  }), [theme, colors, mode, isDark, setMode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}