import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { CreditCard, Ellipsis, FileText, Home, Plus } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated";
import type { AppLanguage } from "../../domain/document/document.types";
import { useBodhini } from "../../state/AppContext";
import { t, type TranslationKey } from "../../i18n/translations";
import { useTheme } from "../../theme/ThemeProvider";
import { Hint, PressableScale } from "../motion";

const tabs = ["index", "documents", "forms", "profile"] as const;
type TabRoute = (typeof tabs)[number];

function iconFor(name: TabRoute, color: string, size: number) {
  if (name === "index") return <Home color={color} size={size} strokeWidth={2.1} />;
  if (name === "documents") return <CreditCard color={color} size={size} strokeWidth={2.1} />;
  if (name === "forms") return <FileText color={color} size={size} strokeWidth={2.1} />;
  return <Ellipsis color={color} size={size} strokeWidth={2.2} />;
}

function labelFor(name: TabRoute, language: AppLanguage) {
  if (name === "index") return t(language, "home");
  if (name === "documents") return t(language, "documents");
  if (name === "forms") return t(language, "forms");
  return t(language, "profile");
}

function hintKeyFor(name: TabRoute): TranslationKey {
  if (name === "index") return "hintTabHome";
  if (name === "documents") return "hintTabWallet";
  if (name === "forms") return "hintTabForms";
  return "hintTabMore";
}

const TabBarItem = React.memo(function TabBarItem({
  name,
  focused,
  language,
  reduceMotion,
  onPress,
}: {
  name: TabRoute;
  focused: boolean;
  language: AppLanguage;
  reduceMotion: boolean;
  onPress: (route: TabRoute) => void;
}) {
  const { colors } = useTheme();
  const scale = useSharedValue(focused ? 1.1 : 1);
  const labelOpacity = useSharedValue(focused ? 1 : 0.78);
  const pillScale = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    if (reduceMotion) {
      scale.value = 1;
      labelOpacity.value = focused ? 1 : 0.78;
      pillScale.value = focused ? 1 : 0;
      return;
    }
    scale.value = withSpring(focused ? 1.1 : 1, { damping: 16, stiffness: 220 });
    labelOpacity.value = withTiming(focused ? 1 : 0.78, { duration: 150 });
    pillScale.value = withSpring(focused ? 1 : 0, { damping: 18, stiffness: 220 });
  }, [focused, labelOpacity, pillScale, reduceMotion, scale]);

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const labelAnimatedStyle = useAnimatedStyle(() => ({
    opacity: labelOpacity.value,
  }));

  const pillAnimatedStyle = useAnimatedStyle(() => ({
    opacity: pillScale.value,
    transform: [{ scaleX: pillScale.value }],
  }));

  const activeColor = colors.forest;
  const inactiveColor = colors.secondaryText;
  const label = labelFor(name, language);
  const hint = t(language, hintKeyFor(name));

  return (
    <Hint hint={hint} label={label} role="tab" style={styles.tabWrap}>
      <PressableScale
        onPress={() => onPress(name)}
        accessibilityRole="tab"
        accessibilityLabel={label}
        accessibilityState={{ selected: focused }}
        style={styles.tab}
      >
        <View style={styles.iconBox}>
          <Animated.View style={[styles.activePill, { backgroundColor: colors.forestLight }, pillAnimatedStyle]} />
          <Animated.View style={iconAnimatedStyle}>
            {iconFor(name, focused ? activeColor : inactiveColor, 22)}
          </Animated.View>
        </View>
        <Animated.Text
          numberOfLines={1}
          style={[
            styles.label,
            { color: focused ? activeColor : inactiveColor, fontWeight: focused ? "600" : "500" },
            labelAnimatedStyle,
          ]}
        >
          {label}
        </Animated.Text>
      </PressableScale>
    </Hint>
  );
});

export function BodhiniTabBar({ state }: any) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { language, reduceMotion } = useBodhini();
  const { colors } = useTheme();

  const activeRouteName = state?.routes?.[state.index]?.name ?? "index";
  const focusedIndex = tabs.findIndex((item) => item === activeRouteName);

  const handleTabPress = React.useCallback((routeName: TabRoute) => {
    router.navigate((routeName === "index" ? "/(tabs)" : "/(tabs)/" + routeName) as any);
  }, [router]);

  const handleScanPress = React.useCallback(() => {
    router.push("/scan/camera");
  }, [router]);

  const leftTabs = tabs.slice(0, 2);
  const rightTabs = tabs.slice(2);
  const scanLabel = t(language, "scan");
  const scanHint = t(language, "hintTabScan");

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: colors.surface,
          borderTopColor: colors.separator,
          paddingBottom: Math.max(insets.bottom, 8),
        },
      ]}
    >
      <View style={styles.group}>
        {leftTabs.map((name, i) => (
          <TabBarItem
            key={name}
            name={name}
            focused={focusedIndex === i}
            language={language}
            reduceMotion={reduceMotion}
            onPress={handleTabPress}
          />
        ))}
      </View>

      <Hint hint={scanHint} label={scanLabel} role="button">
        <PressableScale
          onPress={handleScanPress}
          accessibilityRole="button"
          accessibilityLabel={scanLabel}
          style={[styles.centerPlus, { backgroundColor: colors.primary }]}
        >
          <Plus color={colors.onPrimary} size={26} strokeWidth={2.6} />
        </PressableScale>
      </Hint>

      <View style={styles.group}>
        {rightTabs.map((name, i) => (
          <TabBarItem
            key={name}
            name={name}
            focused={focusedIndex === i + 2}
            language={language}
            reduceMotion={reduceMotion}
            onPress={handleTabPress}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
    paddingHorizontal: 8,
    minHeight: 68,
  },
  group: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  tabWrap: {
    flex: 1,
    alignItems: "center",
  },
  tab: {
    minWidth: 56,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  iconBox: {
    width: 44,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  activePill: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 2,
    right: 2,
    borderRadius: 14,
  },
  label: {
    fontSize: 11,
    lineHeight: 14,
  },
  centerPlus: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 8,
  },
});
