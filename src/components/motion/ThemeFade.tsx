import React, { useEffect } from "react";
import { StyleSheet, type StyleProp, View, ViewStyle } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

export function ThemeFade({
  isVisible,
  children,
  duration = 250,
  style,
}: {
  isVisible: boolean;
  children?: React.ReactNode;
  duration?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const opacity = useSharedValue(isVisible ? 1 : 0);

  useEffect(() => {
    opacity.value = withTiming(isVisible ? 1 : 0, { duration, easing: Easing.out(Easing.cubic) });
  }, [duration, isVisible, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return isVisible ? (
    <Animated.View style={[StyleSheet.absoluteFill, style, animatedStyle]} pointerEvents="none">
      {children}
    </Animated.View>
  ) : null;
}