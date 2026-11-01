import "../../global.css";
import React from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppProvider } from "../state/AppContext";
import { ThemeProvider, useTheme } from "../theme/ThemeProvider";
import { ComingSoonSheet, HintOverlay, TopToast } from "../components/motion";

function RootContent() {
  const { isDark, colors } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} animated />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: "fade",
          animationDuration: 150,
        }}
      />
      <ComingSoonSheet />
      <TopToast />
      <HintOverlay />
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <ThemeProvider>
          <RootContent />
        </ThemeProvider>
      </AppProvider>
    </SafeAreaProvider>
  );
}
