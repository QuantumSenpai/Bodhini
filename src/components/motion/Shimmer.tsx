import React, { useEffect } from "react";
import { DimensionValue, StyleSheet, type StyleProp, View, ViewStyle } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useBodhini } from "../../state/AppContext";
import { useTheme } from "../../theme/ThemeProvider";
import { useScreenFocused } from "./useScreenFocused";

export function Shimmer({
  width = "100%",
  height = 76,
  borderRadius = 16,
  style,
}: {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const { reduceMotion } = useBodhini();
  const { colors } = useTheme();
  const isFocused = useScreenFocused();
  const progress = useSharedValue(0);

  useEffect(() => {
    if (!isFocused || reduceMotion) {
      cancelAnimation(progress);
      progress.value = 0.5;
      return;
    }
    progress.value = 0.35;
    progress.value = withRepeat(
      withTiming(0.85, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    return () => {
      cancelAnimation(progress);
    };
  }, [isFocused, progress, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: colors.surfaceAlt,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.separator,
        },
        style,
        animatedStyle,
      ]}
    />
  );
}