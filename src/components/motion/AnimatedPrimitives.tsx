import React, { useEffect } from "react";
import { View, StyleSheet, type ViewStyle, Text, Pressable } from "react-native";
import { useSharedValue, useAnimatedStyle, withTiming, withSpring, Easing, withRepeat } from "react-native-reanimated";

export function Cloud({ color = "#FFFFFF", opacity = 0.6, speed = 20000, width = 80, height = 28, y = 0, style }: {
  color?: string;
  opacity?: number;
  speed?: number;
  width?: number;
  height?: number;
  y?: number;
  style?: ViewStyle;
}) {
  const translateX = useSharedValue(-width - 50);

  useEffect(() => {
    translateX.value = withTiming(350, { duration: speed, easing: Easing.linear }, () => {
      translateX.value = -width - 50;
    });
  }, [translateX, speed, width]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={[styles.cloud, { width, height, backgroundColor: color, opacity, top: y }, style, animatedStyle] as any} />
  );
}

export function FloatingCard({ children, floatDuration = 3500, rotateAmplitude = 1.5, style }: {
  children: React.ReactNode;
  floatDuration?: number;
  rotateAmplitude?: number;
  style?: ViewStyle;
}) {
  const translateY = useSharedValue(0);
  const rotate = useSharedValue(0);

  useEffect(() => {
    translateY.value = withRepeat(
      withTiming(6, { duration: floatDuration / 2, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    rotate.value = withRepeat(
      withTiming(rotateAmplitude, { duration: floatDuration / 2, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [translateY, rotate, floatDuration, rotateAmplitude]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { rotate: `${rotate.value}deg` }],
  }));

  return <View style={[styles.floatingCard, style, animatedStyle] as any}>{children}</View>;
}

export function ScanLine({ color = "#7FD8A8", height = 2, duration = 1800, style }: {
  color?: string;
  height?: number;
  duration?: number;
  style?: ViewStyle;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration, easing: Easing.linear }),
      -1
    );
  }, [progress, duration]);

  const animatedStyle = useAnimatedStyle(() => ({
    top: `${progress.value * 100}%`,
  }));

  return <View style={[styles.scanLine, { backgroundColor: color, height }, style, animatedStyle] as any} />;
}

export function Star({ size = 4, color = "#FFFFFF", twinkleDuration = 3000, delay = 0, style }: {
  size?: number;
  color?: string;
  twinkleDuration?: number;
  delay?: number;
  style?: ViewStyle;
}) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    const animate = () => {
      opacity.value = withTiming(1, { duration: twinkleDuration, easing: Easing.inOut(Easing.ease) }, () => {
        opacity.value = withTiming(0.3, { duration: twinkleDuration, easing: Easing.inOut(Easing.ease) }, () => {
          animate();
        });
      });
    };
    setTimeout(animate, delay);
  }, [opacity, twinkleDuration, delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return <View style={[styles.star, { width: size, height: size, backgroundColor: color, borderRadius: size / 2 }, style, animatedStyle] as any} />;
}

export function StaggeredReveal({ children, staggerDelay = 60, duration = 220, style }: {
  children: React.ReactNode;
  staggerDelay?: number;
  duration?: number;
  style?: ViewStyle;
}) {
  const { Children } = React;
  const childArray = Children.toArray(children);
  const animatedChildren = childArray.map((child, index) => {
    if (!React.isValidElement(child)) return child;
    const translateY = useSharedValue(12);
    const opacity = useSharedValue(0);

    useEffect(() => {
      translateY.value = withTiming(0, { duration, easing: Easing.out(Easing.cubic) });
      opacity.value = withTiming(1, { duration, easing: Easing.out(Easing.cubic) });
    }, [translateY, opacity, duration]);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ translateY: translateY.value }],
      opacity: opacity.value,
    }));

    const childStyle = (child.props as any).style;
    return React.cloneElement(child as React.ReactElement<any>, { style: [childStyle, animatedStyle] as any });
  });

  return <View style={style}>{animatedChildren}</View>;
}

export function AnimatedCheck({ size = 64, strokeColor = "#7FD8A8", strokeWidth = 3, style, onComplete }: {
  size?: number;
  strokeColor?: string;
  strokeWidth?: number;
  style?: ViewStyle;
  onComplete?: () => void;
}) {
  const circleProgress = useSharedValue(0);
  const checkProgress = useSharedValue(0);

  useEffect(() => {
    circleProgress.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) }, () => {
      checkProgress.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.back(1.5)) }, () => {
        onComplete?.();
      });
    });
  }, [circleProgress, checkProgress]);

  const circleStyle = useAnimatedStyle(() => ({
    width: circleProgress.value * size,
    height: circleProgress.value * size,
    borderRadius: (circleProgress.value * size) / 2,
    borderWidth: strokeWidth,
    borderColor: strokeColor,
  }));

  const checkStyle = useAnimatedStyle(() => ({
    opacity: checkProgress.value,
    transform: [{ scale: checkProgress.value }],
  }));

  return (
    <View style={[styles.checkContainer, { width: size, height: size }, style] as any}>
      <View style={styles.svgWrapper}>
        <View style={[styles.checkCircle, circleStyle] as any} />
      </View>
      <View style={[styles.checkMark, checkStyle] as any}>
        <View style={[styles.checkStroke, { backgroundColor: strokeColor, width: strokeWidth, height: size * 0.2 }] as any} />
        <View style={[styles.checkStroke, { backgroundColor: strokeColor, width: strokeWidth, height: size * 0.45 }, styles.checkStrokeLong] as any} />
      </View>
    </View>
  );
}

export function ConfettiFreeGlow({ color = "#7FD8A8", size = 120, style }: {
  color?: string;
  size?: number;
  style?: ViewStyle;
}) {
  const scale = useSharedValue(0.5);
  const opacity = useSharedValue(1);

  useEffect(() => {
    scale.value = withSpring(1.2, { damping: 12, stiffness: 100 });
    opacity.value = withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) });
  }, [scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return <View style={[styles.glow, { width: size, height: size, backgroundColor: color, borderRadius: size / 2 }, style, animatedStyle] as any} />;
}

export function CopyMorphButton({ label, copiedLabel, isCopied, onPress, style, disabled }: {
  label: string;
  copiedLabel: string;
  isCopied: boolean;
  onPress: () => void;
  style?: ViewStyle;
  disabled?: boolean;
}) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const showCheck = useSharedValue(0);

  useEffect(() => {
    if (isCopied) {
      opacity.value = withTiming(0, { duration: 100 }, () => {
        showCheck.value = withSpring(1, { damping: 18, stiffness: 180 });
        opacity.value = withTiming(1, { duration: 100 });
      });
      const timer = setTimeout(() => {
        showCheck.value = withSpring(0, { damping: 18, stiffness: 180 });
        opacity.value = withTiming(0, { duration: 100 }, () => {
          opacity.value = withTiming(1, { duration: 100 });
        });
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isCopied, opacity, showCheck]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Pressable onPress={onPress} disabled={disabled} style={[styles.copyButton, style, animatedStyle] as any} hitSlop={8}>
      <View style={styles.copyContent}>
        <Text style={styles.copyText}>{isCopied ? copiedLabel : label}</Text>
        <View style={[styles.checkIcon, { opacity: showCheck.value, transform: [{ scale: showCheck.value }] }] as any}>
          <View style={styles.checkShort} />
          <View style={styles.checkLong} />
        </View>
      </View>
    </Pressable>
  );
}

export function EmptyStateIllustration({ style }: { style?: ViewStyle }) {
  return (
    <View style={[styles.emptyIllustration, style] as any}>
      <View style={styles.emptyFolder} />
      <View style={styles.emptyDocument} />
    </View>
  );
}

const styles = StyleSheet.create({
  cloud: { position: "absolute", borderRadius: 14 },
  floatingCard: {},
  scanLine: { position: "absolute", left: 0, right: 0, top: 0 },
  star: { position: "absolute" },
  checkContainer: { alignItems: "center", justifyContent: "center", position: "relative" },
  svgWrapper: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center" },
  checkCircle: { borderWidth: 3, borderColor: "#7FD8A8", borderRadius: 999 },
  checkMark: { position: "absolute", flexDirection: "row", alignItems: "flex-end", gap: 3 },
  checkStroke: { borderRadius: 2 },
  checkStrokeLong: { transform: [{ rotate: "45deg" }] },
  glow: { position: "absolute", borderRadius: 999 },
  copyButton: { alignItems: "center", justifyContent: "center" },
  copyContent: { flexDirection: "row", alignItems: "center", gap: 6 },
  copyText: { fontSize: 14, fontWeight: "600" },
  checkIcon: { width: 18, height: 18, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 2 },
  checkShort: { width: 5, height: 2, backgroundColor: "#FFFFFF", borderRadius: 1, transform: [{ rotate: "-45deg" }] },
  checkLong: { width: 10, height: 2, backgroundColor: "#FFFFFF", borderRadius: 1, transform: [{ rotate: "45deg" }] },
  emptyIllustration: { alignItems: "center", gap: 8 },
  emptyFolder: { width: 48, height: 36, borderRadius: 8, borderWidth: 2, borderColor: "#D4A01E", borderTopLeftRadius: 4 },
  emptyDocument: { width: 36, height: 44, borderRadius: 6, borderWidth: 1.5, borderColor: "#D4A01E", marginTop: -12, marginLeft: 8 },
});