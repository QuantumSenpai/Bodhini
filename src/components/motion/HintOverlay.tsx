import React, { useEffect } from "react";
import { Dimensions, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useBodhini } from "../../state/AppContext";
import { useTheme } from "../../theme/ThemeProvider";

export function HintOverlay() {
  const { activeHint, hideHint, reduceMotion } = useBodhini();
  const { colors, theme } = useTheme();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(4);

  useEffect(() => {
    if (activeHint) {
      opacity.value = withTiming(1, { duration: 150 });
      translateY.value = reduceMotion ? 0 : withTiming(0, { duration: 150, easing: Easing.out(Easing.quad) });
    } else {
      opacity.value = withTiming(0, { duration: 120 });
      translateY.value = reduceMotion ? 0 : 4;
    }
  }, [activeHint, opacity, reduceMotion, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (!activeHint) return null;

  const screen = Dimensions.get("window");
  const bubbleMaxWidth = Math.min(280, screen.width - 24);
  const centerX = activeHint.x + activeHint.width / 2;
  const left = Math.max(12, Math.min(screen.width - bubbleMaxWidth - 12, centerX - bubbleMaxWidth / 2));
  const showBelow = activeHint.y < 100;
  const top = showBelow ? Math.min(screen.height - 90, activeHint.y + activeHint.height + 8) : Math.max(48, activeHint.y - 52);

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      <Pressable style={StyleSheet.absoluteFill} onPress={hideHint} accessible={false}>
        <Animated.View
          style={[
            overlayStyles.tooltip,
            {
              backgroundColor: colors.tooltipBg,
              borderColor: colors.separator,
              top,
              left,
              width: bubbleMaxWidth,
            },
            animatedStyle,
          ]}
          accessibilityLiveRegion="polite"
        >
          <Text style={[overlayStyles.tooltipText, { color: colors.tooltipText, fontSize: theme.typeScale.caption.fontSize }]}>
            {activeHint.text}
          </Text>
        </Animated.View>
      </Pressable>
    </View>
  );
}

const overlayStyles = StyleSheet.create({
  tooltip: {
    position: "absolute",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    zIndex: 999,
  },
  tooltipText: {
    lineHeight: 18,
    fontWeight: "500",
    textAlign: "center",
  },
});