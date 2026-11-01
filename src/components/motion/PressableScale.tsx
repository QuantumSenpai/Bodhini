import React, { useEffect, useMemo } from "react";
import { Pressable, StyleSheet, View, type ViewStyle, type PressableProps, type StyleProp } from "react-native";
import { useSharedValue, useAnimatedStyle, withSpring, withTiming, Easing } from "react-native-reanimated";

export function PressableScale({ children, style, onPress, disabled, ...props }: PressableProps & { style?: StyleProp<ViewStyle> }) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    if (disabled) return;
    scale.value = withSpring(0.97, { damping: 18, stiffness: 180 });
    opacity.value = withTiming(0.9, { duration: 80 });
  };

  const handlePressOut = () => {
    if (disabled) return;
    scale.value = withSpring(1, { damping: 18, stiffness: 180 });
    opacity.value = withTiming(1, { duration: 120 });
  };

  const memoizedStyle = useMemo(() => [styles.base, style, animatedStyle] as any, [style, animatedStyle]);

  return <Pressable {...props} onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={onPress} disabled={disabled} style={memoizedStyle}>{children}</Pressable>;
}

const styles = StyleSheet.create({
  base: {},
});

export function FadeInUp({ children, delay = 0, duration = 220, style, index = 0, maxAnimated = 8, ...props }: {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  style?: ViewStyle;
  index?: number;
  maxAnimated?: number;
}) {
  const shouldAnimate = index < maxAnimated;
  const translateY = useSharedValue(shouldAnimate ? 16 : 0);
  const opacity = useSharedValue(shouldAnimate ? 0 : 1);

  useEffect(() => {
    if (!shouldAnimate) return;
    translateY.value = withTiming(0, { duration, easing: Easing.out(Easing.cubic) });
    opacity.value = withTiming(1, { duration, easing: Easing.out(Easing.cubic) });
  }, [shouldAnimate, translateY, opacity, duration]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return <View {...props} style={[style, animatedStyle] as any}>{children}</View>;
}

export function Shimmer({ width = "100%", height = 16, borderRadius = 8, style }: {
  width?: string | number;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}) {
  const translateX = useSharedValue(-1);

  useEffect(() => {
    translateX.value = withTiming(1, { duration: 1200, easing: Easing.linear }, () => {
      translateX.value = -1;
    });
  }, [translateX]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value * (typeof width === "number" ? width : 200) }],
  }));

  return (
    <View style={[shimmerStyles.shimmerContainer, { width, height, borderRadius }, style] as any}>
      <View style={shimmerStyles.shimmerBase} />
      <View style={[shimmerStyles.shimmerHighlight, animatedStyle] as any} />
    </View>
  );
}

const shimmerStyles = StyleSheet.create({
  shimmerContainer: { backgroundColor: "#E8E2DB" },
  shimmerBase: { ...StyleSheet.absoluteFill },
  shimmerHighlight: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(255,255,255,0.6)",
  },
});

export function PulseDot({ color = "#1B3A2F", size = 8, style, duration = 1800 }: {
  color?: string;
  size?: number;
  style?: ViewStyle;
  duration?: number;
}) {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withTiming(1, { duration, easing: Easing.inOut(Easing.ease) }, () => {
      opacity.value = withTiming(0.4, { duration, easing: Easing.inOut(Easing.ease) });
    });
  }, [opacity, duration]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return <View style={[dotStyles.dot, { width: size, height: size, backgroundColor: color }, style, animatedStyle] as any} />;
}

const dotStyles = StyleSheet.create({
  dot: { borderRadius: 999 },
});

export function ThemeFade({ isVisible, children, duration = 280, style }: {
  isVisible: boolean;
  children: React.ReactNode;
  duration?: number;
  style?: ViewStyle;
}) {
  const opacity = useSharedValue(isVisible ? 1 : 0);

  useEffect(() => {
    opacity.value = withTiming(isVisible ? 1 : 0, { duration, easing: Easing.out(Easing.cubic) });
  }, [isVisible, opacity, duration]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return isVisible || opacity.value > 0 ? (
    <View style={[StyleSheet.absoluteFill, style, animatedStyle] as any} pointerEvents="none">{children}</View>
  ) : null;
}

export function AnimatedSwitch({ value, onValueChange, thumbColor, trackColorTrue, trackColorFalse, disabled, style }: {
  value: boolean;
  onValueChange: (value: boolean) => void;
  thumbColor?: string;
  trackColorTrue?: string;
  trackColorFalse?: string;
  disabled?: boolean;
  style?: ViewStyle;
}) {
  const translateX = useSharedValue(value ? 24 : 0);
  const trackBg = useSharedValue(value ? trackColorTrue : trackColorFalse);

  useEffect(() => {
    translateX.value = withSpring(value ? 24 : 0, { damping: 18, stiffness: 180 });
    trackBg.value = value ? trackColorTrue : trackColorFalse;
  }, [value, translateX, trackBg, trackColorTrue, trackColorFalse]);

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: trackBg.value,
  }));

  return (
    <Pressable onPress={() => !disabled && onValueChange(!value)} disabled={disabled} style={[switchStyles.switchTrack, style, trackStyle] as any} hitSlop={8} accessibilityRole="switch" accessibilityState={{ checked: value }}>
      <View style={[switchStyles.switchThumb, thumbStyle, { backgroundColor: thumbColor }] as any} />
    </Pressable>
  );
}

const switchStyles = StyleSheet.create({
  switchTrack: { width: 52, height: 28, borderRadius: 14, alignItems: "flex-start", justifyContent: "center", paddingHorizontal: 2 },
  switchThumb: { width: 24, height: 24, borderRadius: 12, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
});

export function SegmentedControl<T extends string>({ options, value, onChange, style, disabled }: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  style?: ViewStyle;
  disabled?: boolean;
}) {
  const indicatorX = useSharedValue(0);
  const indicatorWidth = useSharedValue(0);

  const optionWidth = 100;

  useEffect(() => {
    const index = options.findIndex((o) => o.value === value);
    if (index >= 0) {
      indicatorX.value = withSpring(index * optionWidth, { damping: 18, stiffness: 180 });
      indicatorWidth.value = withSpring(optionWidth, { damping: 18, stiffness: 180 });
    }
  }, [value, indicatorX, indicatorWidth, options]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
    width: indicatorWidth.value,
  }));

  return (
    <View style={[segmentedStyles.segmentedContainer, style] as any}>
      <View style={[segmentedStyles.segmentedTrack, indicatorStyle] as any} />
      {options.map((opt, i) => (
        <Pressable
          key={opt.value}
          onPress={() => !disabled && onChange(opt.value)}
          disabled={disabled}
          style={segmentedStyles.segmentOption}
          accessibilityRole="button"
          accessibilityState={{ selected: value === opt.value }}
        >
          <View style={segmentedStyles.segmentTextContainer}>
            <Text style={segmentedStyles.segmentText}>{opt.label}</Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

const segmentedStyles = StyleSheet.create({
  segmentedContainer: { flexDirection: "row", position: "relative", borderRadius: 999, backgroundColor: "#E8E2DB", padding: 3 },
  segmentedTrack: { position: "absolute", top: 3, bottom: 3, borderRadius: 996, backgroundColor: "#1B3A2F" },
  segmentOption: { flex: 1, paddingVertical: 8, alignItems: "center", zIndex: 1 },
  segmentTextContainer: {},
  segmentText: { fontSize: 13, fontWeight: "600", color: "#7A736A" },
});

import { Text } from "react-native";