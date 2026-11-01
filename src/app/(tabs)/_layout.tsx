import React from "react";
import { Tabs } from "expo-router";
import { BodhiniTabBar } from "../../components/navigation/BodhiniTabBar";
import { useTheme } from "../../theme/ThemeProvider";

export default function TabLayout() {
  const { colors } = useTheme();
  return (
    <Tabs
      tabBar={(props) => <BodhiniTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        lazy: true,
        animation: "fade",
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="documents" />
      <Tabs.Screen name="forms" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
