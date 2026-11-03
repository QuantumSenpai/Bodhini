import React, { useEffect } from "react";
import { type StyleProp, View, ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { StyleSheet } from "react-native";
import { useBodhini } from "../../state/AppContext";
import { useTheme } from "../../theme/ThemeProvider";
import { PressableScale } from "./PressableScale";

export function AnimatedSwitch({
  value,
  onValueChange,
  thumbColor,
  trackColorTrue,
  trackColorFalse,
  disabled,
  style,
  label,
  hint,
}: {
  value: boolean;
  onValueChange: (value: boolean) => void;
  thumbColor?: string;
  trackColorTrue?: string;
  trackColorFalse?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  label?: string;
  hint?: string;
}) {
  const { reduceMotion } = useBodhini();
  const { colors } = useTheme();
  const translateX = useSharedValue(value ? 20 : 0);

  useEffect(() => {
    translateX.value = reduceMotion
      ? (value ? 20 : 0)
      : withSpring(value ? 20 : 0, { damping: 18, stiffness: 220 });
  }, [reduceMotion, translateX, value]);

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const activeBg = trackColorTrue ?? colors.success;
  const inactiveBg = trackColorFalse ?? colors.separator;
  const resolvedThumb = thumbColor ?? colors.white;

  return (
    <PressableScale
      onPress={() => !disabled && onValueChange(!value)}
      disabled={disabled}
      hint={hint}
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value, disabled }}
      style={[switchStyles.hitTarget, style]}
    >
      <View style={[switchStyles.track, { backgroundColor: value ? activeBg : inactiveBg }]}>
        <Animated.View style={[switchStyles.thumb, { backgroundColor: resolvedThumb }, thumbStyle]} />
      </View>
    </PressableScale>
  );
}

const switchStyles = StyleSheet.create({
  hitTarget: {
    minWidth: 52,
    minHeight: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  track: {
    width: 48,
    height: 28,
    borderRadius: 14,
    paddingHorizontal: 2,
    justifyContent: "center",
  },
  thumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
});