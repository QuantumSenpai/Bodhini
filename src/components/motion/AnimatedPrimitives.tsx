import React, { useEffect } from "react";
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Check, Copy } from "lucide-react-native";
import { useBodhini } from "../../state/AppContext";
import { useTheme } from "../../theme/ThemeProvider";
import { FadeInUp } from "./FadeInUp";
import { PressableScale } from "./PressableScale";
import { useScreenFocused } from "./useScreenFocused";

export function ScanLine({
  color,
  height = 2,
  duration = 1600,
  travel = 150,
  style,
}: {
  color?: string;
  height?: number;
  duration?: number;
  travel?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const { reduceMotion } = useBodhini();
  const { colors } = useTheme();
  const isFocused = useScreenFocused();
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);
  const lineColor = color ?? colors.primary;

  useEffect(() => {
    if (!isFocused || reduceMotion) {
      cancelAnimation(translateY);
      translateY.value = travel * 0.45;
      opacity.value = 0.7;
      return;
    }
    translateY.value = 0;
    opacity.value = 1;
    translateY.value = withRepeat(
      withTiming(travel, { duration, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    return () => {
      cancelAnimation(translateY);
    };
  }, [duration, isFocused, opacity, reduceMotion, translateY, travel]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.scanLine,
        { backgroundColor: lineColor, height },
        style,
        animatedStyle,
      ]}
    />
  );
}

export function StaggeredReveal({
  children,
  staggerDelay = 40,
  duration = 220,
  style,
}: {
  children: React.ReactNode;
  staggerDelay?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const childArray = React.Children.toArray(children);
  return (
    <View style={style}>
      {childArray.map((child, index) => (
        <FadeInUp key={index} index={index} delay={index * staggerDelay} duration={duration}>
          {child}
        </FadeInUp>
      ))}
    </View>
  );
}

export function AnimatedCheck({
  size = 64,
  strokeColor,
  fillColor,
  style,
  onComplete,
}: {
  size?: number;
  strokeColor?: string;
  strokeWidth?: number;
  fillColor?: string;
  style?: StyleProp<ViewStyle>;
  onComplete?: () => void;
}) {
  const { reduceMotion } = useBodhini();
  const { colors } = useTheme();
  const circleScale = useSharedValue(reduceMotion ? 1 : 0.2);
  const circleOpacity = useSharedValue(reduceMotion ? 1 : 0);
  const checkScale = useSharedValue(reduceMotion ? 1 : 0.2);
  const checkOpacity = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    if (reduceMotion) {
      circleScale.value = 1;
      circleOpacity.value = 1;
      checkScale.value = 1;
      checkOpacity.value = 1;
      onComplete?.();
      return;
    }
    circleOpacity.value = withTiming(1, { duration: 180 });
    circleScale.value = withSpring(1, { damping: 15, stiffness: 200 });
    const timer = setTimeout(() => {
      checkOpacity.value = withTiming(1, { duration: 160 });
      checkScale.value = withSpring(1, { damping: 14, stiffness: 220 });
      onComplete?.();
    }, 140);
    return () => clearTimeout(timer);
  }, [checkOpacity, checkScale, circleOpacity, circleScale, onComplete, reduceMotion]);

  const circleStyle = useAnimatedStyle(() => ({
    opacity: circleOpacity.value,
    transform: [{ scale: circleScale.value }],
  }));

  const checkStyle = useAnimatedStyle(() => ({
    opacity: checkOpacity.value,
    transform: [{ scale: checkScale.value }],
  }));

  const resolvedFill = fillColor ?? colors.success;
  const resolvedStroke = strokeColor ?? colors.onPrimary;

  return (
    <View style={[styles.checkContainer, { width: size, height: size }, style]}>
      <Animated.View
        style={[
          styles.checkCircle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: resolvedFill,
          },
          circleStyle,
        ]}
      />
      <Animated.View style={[styles.checkIconWrap, checkStyle]}>
        <Check size={Math.round(size * 0.48)} color={resolvedStroke} strokeWidth={3} />
      </Animated.View>
    </View>
  );
}

export function ConfettiFreeGlow({
  color,
  size = 112,
  style,
}: {
  color?: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const { reduceMotion } = useBodhini();
  const { colors } = useTheme();
  const scale = useSharedValue(0.6);
  const opacity = useSharedValue(reduceMotion ? 0 : 0.45);
  const resolvedColor = color ?? colors.success;

  useEffect(() => {
    if (reduceMotion) {
      opacity.value = 0;
      return;
    }
    scale.value = withSpring(1.25, { damping: 16, stiffness: 120 });
    opacity.value = withTiming(0, { duration: 550, easing: Easing.out(Easing.cubic) });
  }, [opacity, reduceMotion, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.glow,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: resolvedColor },
        style,
        animatedStyle,
      ]}
    />
  );
}

export function CopyMorphButton({
  label,
  copiedLabel,
  isCopied,
  onPress,
  style,
  disabled,
  hint,
}: {
  label: string;
  copiedLabel: string;
  isCopied: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  hint?: string;
}) {
  const { colors, theme } = useTheme();

  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      hint={hint}
      accessibilityRole="button"
      accessibilityLabel={isCopied ? copiedLabel : label}
      style={[
        styles.copyButton,
        {
          backgroundColor: isCopied ? colors.success : colors.primary,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      <View style={styles.copyContent}>
        {isCopied ? (
          <Check size={18} color={colors.onPrimary} strokeWidth={2.5} />
        ) : (
          <Copy size={18} color={colors.onPrimary} />
        )}
        <Text style={[styles.copyText, { color: colors.onPrimary, fontSize: theme.typeScale.button.fontSize }]}>
          {isCopied ? copiedLabel : label}
        </Text>
      </View>
    </PressableScale>
  );
}

export function EmptyStateIllustration({ style }: { style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.emptyIllustration, style]}>
      <View style={[styles.emptyBackCard, { backgroundColor: colors.surfaceAlt, borderColor: colors.separator }]} />
      <View style={[styles.emptyFrontCard, { backgroundColor: colors.surface, borderColor: colors.primary }]}>
        <View style={[styles.emptyLineShort, { backgroundColor: colors.primary }]} />
        <View style={[styles.emptyLineLong, { backgroundColor: colors.separator }]} />
        <View style={[styles.emptyLineMid, { backgroundColor: colors.separator }]} />
      </View>
    </View>
  );
}

export function MarkEntrance({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { reduceMotion } = useBodhini();
  const opacity = useSharedValue(reduceMotion ? 1 : 0);
  const scale = useSharedValue(reduceMotion ? 1 : 0.92);

  useEffect(() => {
    if (reduceMotion) {
      opacity.value = 1;
      scale.value = 1;
      return;
    }
    opacity.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) });
    scale.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) });
  }, [opacity, reduceMotion, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}

export function HeroFloatCard({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { reduceMotion } = useBodhini();
  const isFocused = useScreenFocused();
  const translateY = useSharedValue(0);

  useEffect(() => {
    if (!isFocused || reduceMotion) {
      cancelAnimation(translateY);
      translateY.value = 0;
      return;
    }
    translateY.value = 0;
    translateY.value = withRepeat(
      withTiming(-6, { duration: 3500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    return () => {
      cancelAnimation(translateY);
    };
  }, [isFocused, reduceMotion, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  scanLine: {
    position: "absolute",
    left: 12,
    right: 12,
    top: 8,
    borderRadius: 2,
  },
  checkContainer: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  checkCircle: {
    position: "absolute",
  },
  checkIconWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  glow: {
    position: "absolute",
  },
  copyButton: {
    minHeight: 54,
    borderRadius: 16,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  copyContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  copyText: {
    fontWeight: "600",
  },
  emptyIllustration: {
    width: 72,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyBackCard: {
    position: "absolute",
    width: 44,
    height: 54,
    borderRadius: 10,
    borderWidth: 1.5,
    transform: [{ rotate: "-8deg" }, { translateX: -6 }],
  },
  emptyFrontCard: {
    width: 44,
    height: 54,
    borderRadius: 10,
    borderWidth: 2,
    padding: 8,
    gap: 6,
    justifyContent: "center",
    transform: [{ rotate: "4deg" }, { translateX: 4 }],
  },
  emptyLineShort: {
    width: 16,
    height: 4,
    borderRadius: 2,
  },
  emptyLineLong: {
    width: 26,
    height: 3,
    borderRadius: 2,
  },
  emptyLineMid: {
    width: 20,
    height: 3,
    borderRadius: 2,
  },
});
