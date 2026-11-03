import React, { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBodhini } from "../../state/AppContext";
import { useTheme } from "../../theme/ThemeProvider";

export function TopToast() {
  const { toastMessage, hideToast, reduceMotion } = useBodhini();
  const { colors, theme } = useTheme();
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(-80);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (toastMessage) {
      opacity.value = withTiming(1, { duration: 180 });
      translateY.value = reduceMotion ? 0 : withSpring(0, { damping: 18, stiffness: 200 });
    } else {
      opacity.value = withTiming(0, { duration: 150 });
      translateY.value = reduceMotion ? 0 : withTiming(-80, { duration: 150 });
    }
  }, [opacity, reduceMotion, toastMessage, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (!toastMessage) return null;

  return (
    <Animated.View
      style={[
        overlayStyles.toastWrap,
        { top: Math.max(insets.top + 8, 16) },
        animatedStyle,
      ]}
      pointerEvents="box-none"
    >
      <Pressable
        onPress={hideToast}
        style={[overlayStyles.toastCard, { backgroundColor: colors.tooltipBg, borderColor: colors.separator }]}
        accessibilityRole="alert"
      >
        <Text style={[overlayStyles.toastText, { color: colors.tooltipText, fontSize: theme.typeScale.captionStrong.fontSize }]}>
          {toastMessage}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const overlayStyles = StyleSheet.create({
  toastWrap: {
    position: "absolute",
    left: 16,
    right: 16,
    alignItems: "center",
    zIndex: 1000,
  },
  toastCard: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  toastText: {
    fontWeight: "600",
    textAlign: "center",
  },
});