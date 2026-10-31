import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Home, FolderOpen, FileText, UserRound, Mic } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { AppLanguage } from "../../domain/document/document.types";
import { useBodhini } from "../../state/AppContext";
import { t } from "../../i18n/translations";
import { services } from "../../composition/services";
import { colors } from "../../theme/tokens";

const iconFor = (name: string, color: string, size: number) => {
  if (name === "index") return <Home color={color} size={size} />;
  if (name === "documents") return <FolderOpen color={color} size={size} />;
  if (name === "forms") return <FileText color={color} size={size} />;
  return <UserRound color={color} size={size} />;
};
const labelFor = (name: string, language: AppLanguage) => {
  if (name === "index") return t(language, "home");
  if (name === "documents") return t(language, "documents");
  if (name === "forms") return t(language, "forms");
  return t(language, "profile");
};

export function BodhiniTabBar({ state, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { language, interactionMode } = useBodhini();
  const left = state.routes.filter((route: any) => ["index", "documents"].includes(route.name));
  const right = state.routes.filter((route: any) => ["forms", "profile"].includes(route.name));

  const renderTab = (route: any) => {
    const focused = state.routes[state.index]?.key === route.key;
    const tint = focused ? colors.forest : colors.muted;
    return <Pressable key={route.key} onPress={() => navigation.navigate(route.name)} accessibilityRole="tab" accessibilityState={{ selected: focused }} style={styles.tab}>
      {iconFor(route.name, tint, 21)}
      <Text style={[styles.label, focused && styles.labelActive]}>{labelFor(route.name, language)}</Text>
    </Pressable>;
  };

  return <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
    <View style={styles.group}>{left.map(renderTab)}</View>
    <Pressable style={styles.voice} onPress={() => {
      if (interactionMode === "speak") services.voiceService.speak(t(language, "speakPrompt"), language).catch(() => undefined);
    }} accessibilityRole="button" accessibilityLabel="Hear Bodhini introduction">
      <Mic color={colors.white} size={21} />
    </Pressable>
    <View style={styles.group}>{right.map(renderTab)}</View>
  </View>;
}

const styles = StyleSheet.create({
  bar: { flexDirection: "row", alignItems: "center", justifyContent: "space-around", backgroundColor: colors.paper, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 9, paddingHorizontal: 10, minHeight: 72 },
  group: { flex: 1, flexDirection: "row", justifyContent: "space-around", alignItems: "center" },
  tab: { minWidth: 48, alignItems: "center", justifyContent: "center", gap: 4, paddingVertical: 2 },
  label: { fontSize: 10, color: colors.muted }, labelActive: { color: colors.forest, fontWeight: "700" },
  voice: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.forest, alignItems: "center", justifyContent: "center", marginHorizontal: 5, marginTop: -24, borderWidth: 4, borderColor: colors.paper, elevation: 4 },
});
