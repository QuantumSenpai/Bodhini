import React, { useEffect } from "react";
import { type StyleProp, View, ViewStyle } from "react-native";
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

export function PulseDot({
  color,
  size = 8,
  style,
  duration = 1200,
}: {
  color?: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
  duration?: number;
}) {
  const { reduceMotion } = useBodhini();
  const { colors } = useTheme();
  const isFocused = useScreenFocused();
  const opacity = useSharedValue(0.45);
  const resolvedColor = color ?? colors.primary;

  useEffect(() => {
    if (!isFocused || reduceMotion) {
      cancelAnimation(opacity);
      opacity.value = 1;
      return;
    }
    opacity.value = 0.35;
    opacity.value = withRepeat(
      withTiming(1, { duration, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    return () => {
      cancelAnimation(opacity);
    };
  }, [duration, isFocused, opacity, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        { width: size, height: size, borderRadius: size / 2, backgroundColor: resolvedColor },
        style,
        animatedStyle,
      ]}
    />
  );
}