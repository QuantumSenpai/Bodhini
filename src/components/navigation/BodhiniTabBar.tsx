import React, { useEffect } from "react";
import { Pressable, StyleSheet, Text, View, type ViewStyle } from "react-native";
import { useRouter } from "expo-router";
import { Home, FolderOpen, FileText, UserRound, Mic, Sun, Moon, Monitor } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { AppLanguage } from "../../domain/document/document.types";
import { useBodhini } from "../../state/AppContext";
import { t } from "../../i18n/translations";
import { useTheme } from "../../theme/ThemeProvider";
import { useSharedValue, useAnimatedStyle, withSpring, withTiming, Easing, withRepeat } from "react-native-reanimated";

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

const tabs = ["index", "documents", "forms", "profile"] as const;
const TAB_WIDTH = 72;
const INDICATOR_HEIGHT = 44;
const INDICATOR_RADIUS = 22;

export function BodhiniTabBar({ state }: any) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { language, interactionMode } = useBodhini();
  const { colors, isDark } = useTheme();

  const focusedIndex = tabs.findIndex((t) => state.routes[state.index]?.name === t);
  const indicatorX = useSharedValue(focusedIndex * TAB_WIDTH);
  const indicatorWidth = useSharedValue(TAB_WIDTH);

  const micScale = useSharedValue(1);
  const micGlow = useSharedValue(0.3);

  useEffect(() => {
    micGlow.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [micGlow]);

  const handleTabPress = (routeName: typeof tabs[number]) => {
    const index = tabs.indexOf(routeName);
    if (index >= 0) {
      indicatorX.value = withSpring(index * TAB_WIDTH, { damping: 18, stiffness: 180 });
      router.navigate((routeName === "index" ? "/(tabs)" : "/(tabs)/" + routeName) as any);
    }
  };

  const handleVoicePress = () => {
    micScale.value = withSpring(0.9, { damping: 12, stiffness: 200 }, () => {
      micScale.value = withSpring(1, { damping: 12, stiffness: 200 });
    });
    Alert.alert(t(language, "voiceUnderDevelopmentTitle"), t(language, "voiceUnderDevelopmentMessage"));
  };

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
    width: indicatorWidth.value,
  }));

  const micAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: micScale.value }],
  }));

  const micGlowStyle = useAnimatedStyle(() => ({
    opacity: micGlow.value,
  }));

  const leftTabs = tabs.slice(0, 2);
  const rightTabs = tabs.slice(2);

  return (
    <View style={[styles.bar, { backgroundColor: colors.surface, borderTopColor: colors.border, paddingBottom: insets.bottom }] as any}>
      <View style={styles.group}>
        {leftTabs.map((name, i) => (
          <Pressable
            key={name}
            onPress={() => handleTabPress(name)}
            accessibilityRole="tab"
            accessibilityState={{ selected: focusedIndex === i }}
            hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
            style={styles.tab}
          >
            {iconFor(name, focusedIndex === i ? colors.primary : colors.textMuted, 22)}
            <Text style={[styles.label, focusedIndex === i && { color: colors.primary, fontWeight: "700" }] as any}>{labelFor(name, language)}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable
        style={[{ backgroundColor: colors.primary }, styles.voice, micAnimatedStyle] as any}
        onPress={handleVoicePress}
        accessibilityRole="button"
        accessibilityLabel={t(language, "voiceUnderDevelopmentTitle")}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Mic color={colors.onPrimary} size={22} />
        <View style={[styles.micGlow, { backgroundColor: colors.primary }, micGlowStyle] as any} />
      </Pressable>

      <View style={styles.group}>
        {rightTabs.map((name, i) => (
          <Pressable
            key={name}
            onPress={() => handleTabPress(name)}
            accessibilityRole="tab"
            accessibilityState={{ selected: focusedIndex === i + 2 }}
            hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
            style={styles.tab}
          >
            {iconFor(name, focusedIndex === i + 2 ? colors.primary : colors.textMuted, 22)}
            <Text style={[styles.label, focusedIndex === i + 2 && { color: colors.primary, fontWeight: "700" }] as any}>{labelFor(name, language)}</Text>
          </Pressable>
        ))}
      </View>

      <View style={[styles.indicatorTrack, { backgroundColor: colors.surfaceAlt }] as any}>
        <View style={[styles.indicator, { backgroundColor: colors.primary }, indicatorStyle] as any} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: "row", alignItems: "center", justifyContent: "space-around", borderTopWidth: 1, paddingTop: 10, paddingHorizontal: 12, minHeight: 80, position: "relative" },
  group: { flex: 1, flexDirection: "row", justifyContent: "space-around", alignItems: "center" },
  tab: { width: TAB_WIDTH, alignItems: "center", justifyContent: "center", gap: 4, paddingVertical: 6 },
  label: { fontSize: 10, color: "#7A736A" },
  voice: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", marginHorizontal: 4, borderWidth: 4, borderColor: "#FAF8F5", zIndex: 10 },
  micGlow: { ...StyleSheet.absoluteFill, borderRadius: 28 },
  indicatorTrack: { position: "absolute", bottom: 0, left: 0, right: 0, height: 4, zIndex: 5 },
  indicator: { position: "absolute", bottom: 0, height: 4, borderRadius: 2, left: 0 },
});

import { Alert } from "react-native";