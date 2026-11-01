import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, View, useColorScheme } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useBodhini, type ThemeMode } from "../state/AppContext";
import { darkColors, lightColors, makeTheme, type Theme, type ThemeColors } from "./tokens";

type Mode = ThemeMode;

interface ThemeContextValue {
  theme: Theme;
  colors: ThemeColors;
  mode: Mode;
  isDark: boolean;
  fontScale: number;
  setMode: (mode: Mode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: React.PropsWithChildren) {
  const systemScheme = useColorScheme();
  const { themeMode, setThemeMode, textSize, reduceMotion } = useBodhini();
  const effectiveScheme: "light" | "dark" = themeMode === "system" ? (systemScheme === "dark" ? "dark" : "light") : themeMode;
  const isDark = effectiveScheme === "dark";
  const colors = isDark ? darkColors : lightColors;
  const theme = useMemo(() => makeTheme(colors, textSize), [colors, textSize]);

  const prevSchemeRef = useRef<"light" | "dark">(effectiveScheme);
  const [fadeBg, setFadeBg] = useState<string>(colors.background);
  const fadeOpacity = useSharedValue(0);

  useEffect(() => {
    if (prevSchemeRef.current !== effectiveScheme) {
      const prevBg = prevSchemeRef.current === "dark" ? darkColors.background : lightColors.background;
      prevSchemeRef.current = effectiveScheme;
      if (!reduceMotion) {
        setFadeBg(prevBg);
        fadeOpacity.value = 0.55;
        fadeOpacity.value = withTiming(0, { duration: 250, easing: Easing.out(Easing.quad) });
      }
    }
  }, [effectiveScheme, fadeOpacity, reduceMotion]);

  const setMode = useCallback((newMode: Mode) => {
    setThemeMode(newMode).catch(() => undefined);
  }, [setThemeMode]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: fadeOpacity.value,
  }));

  const value = useMemo<ThemeContextValue>(() => ({
    theme,
    colors,
    mode: themeMode,
    isDark,
    fontScale: textSize,
    setMode,
  }), [theme, colors, themeMode, isDark, textSize, setMode]);

  return (
    <ThemeContext.Provider value={value}>
      <View style={styles.root}>
        {children}
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: fadeBg }, overlayStyle]} />
      </View>
    </ThemeContext.Provider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}
