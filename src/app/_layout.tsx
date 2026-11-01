import "../../global.css";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppProvider } from "../state/AppContext";
import { ThemeProvider, useTheme } from "../theme/ThemeProvider";
import { useColorScheme } from "react-native";

function RootContent() {
  const { isDark } = useTheme();
  const systemScheme = useColorScheme();

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} animated />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: isDark ? "#161817" : "#FAF8F5" },
          animation: "fade",
        }}
      />
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