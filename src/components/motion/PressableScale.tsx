import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Dimensions,
   type GestureResponderEvent,
   type LayoutChangeEvent,
  Modal,
  Pressable,
   type PressableProps,
   type StyleProp,
  StyleSheet,
  Text,
  View,
   type ViewStyle,
} from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Sparkles, X } from "lucide-react-native";
import { useBodhini } from "../../state/AppContext";
import { useTheme } from "../../theme/ThemeProvider";
import { t } from "../../i18n/translations";

export function useScreenFocused(): boolean {
  const [focused, setFocused] = useState(true);
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );
  return focused;
}

export interface PressableScaleProps extends PressableProps {
  style?: StyleProp<ViewStyle> | ((state: { pressed: boolean }) => StyleProp<ViewStyle>);
  hint?: string;
}

export function PressableScale({
  children,
  style,
  onPress,
  onPressIn,
  onPressOut,
  onLongPress,
  disabled,
  hint,
  accessibilityHint,
  ...props
}: PressableScaleProps) {
  const { reduceMotion, showHint } = useBodhini();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const viewRef = useRef<any>(null);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = useCallback((e: GestureResponderEvent) => {
    if (!disabled) {
      if (!reduceMotion) {
        scale.value = withSpring(0.97, { damping: 18, stiffness: 220 });
      }
      opacity.value = withTiming(0.88, { duration: 80 });
    }
    onPressIn?.(e);
  }, [disabled, onPressIn, opacity, reduceMotion, scale]);

  const handlePressOut = useCallback((e: GestureResponderEvent) => {
    if (!disabled) {
      if (!reduceMotion) {
        scale.value = withSpring(1, { damping: 18, stiffness: 220 });
      }
      opacity.value = withTiming(1, { duration: 120 });
    }
    onPressOut?.(e);
  }, [disabled, onPressOut, opacity, reduceMotion, scale]);

  const handleLongPress = useCallback((e: GestureResponderEvent) => {
    if (hint) {
      const pageX = e.nativeEvent?.pageX ?? 180;
      const pageY = e.nativeEvent?.pageY ?? 300;
      if (viewRef.current && typeof viewRef.current.measureInWindow === "function") {
        viewRef.current.measureInWindow((x: number, y: number, width: number, height: number) => {
          if (width > 0 || height > 0) {
            showHint({ text: hint, x, y, width, height });
          } else {
            showHint({ text: hint, x: pageX - 24, y: pageY - 24, width: 48, height: 48 });
          }
        });
      } else {
        showHint({ text: hint, x: pageX - 24, y: pageY - 24, width: 48, height: 48 });
      }
    }
    onLongPress?.(e);
  }, [hint, onLongPress, showHint]);

  return (
    <Animated.View ref={viewRef} style={animatedStyle}>
      <Pressable
        {...props}
        disabled={disabled}
        delayLongPress={500}
        accessibilityHint={accessibilityHint ?? hint}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onLongPress={hint || onLongPress ? handleLongPress : undefined}
        onPress={onPress}
        style={style}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

export function Hint({
  hint,
  label,
  role = "button",
  children,
  style,
}: {
  hint: string;
  label?: string;
  role?: PressableProps["accessibilityRole"];
  children: React.ReactElement<any>;
  style?: StyleProp<ViewStyle>;
}) {
  const { showHint } = useBodhini();
  const wrapperRef = useRef<any>(null);

  const triggerHint = useCallback((e?: GestureResponderEvent) => {
    if (!hint) return;
    const fallbackX = e?.nativeEvent?.pageX ?? 180;
    const fallbackY = e?.nativeEvent?.pageY ?? 300;
    if (wrapperRef.current && typeof wrapperRef.current.measureInWindow === "function") {
      wrapperRef.current.measureInWindow((x: number, y: number, width: number, height: number) => {
        if (width > 0 || height > 0) {
          showHint({ text: hint, x, y, width, height });
        } else {
          showHint({ text: hint, x: fallbackX - 24, y: fallbackY - 24, width: 48, height: 48 });
        }
      });
    } else {
      showHint({ text: hint, x: fallbackX - 24, y: fallbackY - 24, width: 48, height: 48 });
    }
  }, [hint, showHint]);

  const childProps = children.props ?? {};
  const existingLongPress = childProps.onLongPress;

  const cloned = React.cloneElement(children, {
    delayLongPress: 500,
    accessibilityRole: childProps.accessibilityRole ?? role,
    accessibilityLabel: label ?? childProps.accessibilityLabel,
    accessibilityHint: hint ?? childProps.accessibilityHint,
    onLongPress: (e: GestureResponderEvent) => {
      triggerHint(e);
      if (typeof existingLongPress === "function") existingLongPress(e);
    },
  });

  return (
    <View ref={wrapperRef} collapsable={false} style={style}>
      {cloned}
    </View>
  );
}

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

export function ComingSoonSheet({
  visible,
  feature,
  onClose,
}: {
  visible?: boolean;
  feature?: string | null;
  onClose?: () => void;
}) {
  const { comingSoonFeature, closeComingSoon, language, reduceMotion } = useBodhini();
  const { colors, theme } = useTheme();
  const insets = useSafeAreaInsets();

  const isVisible = visible !== undefined ? visible : comingSoonFeature !== null;
  const activeFeature = feature !== undefined ? feature : comingSoonFeature;
  const handleClose = onClose ?? closeComingSoon;

  const translateY = useSharedValue(260);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (isVisible) {
      backdropOpacity.value = withTiming(1, { duration: 200 });
      translateY.value = reduceMotion ? 0 : withSpring(0, { damping: 20, stiffness: 210 });
    } else {
      backdropOpacity.value = withTiming(0, { duration: 160 });
      translateY.value = reduceMotion ? 0 : withTiming(260, { duration: 160 });
    }
  }, [backdropOpacity, isVisible, reduceMotion, translateY]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  if (!isVisible) return null;

  const titleText = activeFeature && activeFeature.trim().length > 0 ? activeFeature : t(language, "comingSoonTitle");

  return (
    <Modal transparent visible={isVisible} animationType="none" onRequestClose={handleClose}>
      <View style={overlayStyles.modalRoot}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: colors.backdrop }, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} accessibilityLabel={t(language, "closeScreen")} />
        </Animated.View>
        <Animated.View
          style={[
            overlayStyles.sheet,
            {
              backgroundColor: colors.surface,
              borderColor: colors.separator,
              paddingBottom: Math.max(insets.bottom + 16, 24),
            },
            sheetStyle,
          ]}
        >
          <View style={[overlayStyles.sheetHandle, { backgroundColor: colors.separator }]} />
          <View style={overlayStyles.sheetHeader}>
            <View style={[overlayStyles.sheetIcon, { backgroundColor: colors.forestLight }]}>
              <Sparkles size={22} color={colors.forest} />
            </View>
            <PressableScale
              onPress={handleClose}
              style={overlayStyles.sheetClose}
              accessibilityRole="button"
              accessibilityLabel={t(language, "closeScreen")}
            >
              <X size={20} color={colors.secondaryText} />
            </PressableScale>
          </View>
          <Text style={[overlayStyles.sheetTitle, { color: colors.text, fontSize: theme.typeScale.h2.fontSize }]}>
            {titleText}
          </Text>
          <Text style={[overlayStyles.sheetBody, { color: colors.secondaryText, fontSize: theme.typeScale.body.fontSize }]}>
            {t(language, "comingSoonMessage")}
          </Text>
          <PressableScale
            onPress={handleClose}
            accessibilityRole="button"
            accessibilityLabel={t(language, "gotIt")}
            style={[overlayStyles.sheetButton, { backgroundColor: colors.primary }]}
          >
            <Text style={[overlayStyles.sheetButtonText, { color: colors.onPrimary, fontSize: theme.typeScale.button.fontSize }]}>
              {t(language, "gotIt")}
            </Text>
          </PressableScale>
        </Animated.View>
      </View>
    </Modal>
  );
}

export function FadeInUp({
  children,
  delay = 0,
  duration = 220,
  style,
  index = 0,
  maxAnimated = 8,
}: {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
  index?: number;
  maxAnimated?: number;
}) {
  const { reduceMotion } = useBodhini();
  const shouldAnimate = index < maxAnimated;
  const itemDelay = delay > 0 ? delay : index * 40;
  const translateY = useSharedValue(shouldAnimate && !reduceMotion ? 12 : 0);
  const opacity = useSharedValue(shouldAnimate ? 0 : 1);

  useEffect(() => {
    if (!shouldAnimate) {
      translateY.value = 0;
      opacity.value = 1;
      return;
    }
    if (reduceMotion) {
      translateY.value = 0;
      opacity.value = withDelay(itemDelay, withTiming(1, { duration: 140 }));
      return;
    }
    translateY.value = withDelay(itemDelay, withTiming(0, { duration, easing: Easing.out(Easing.cubic) }));
    opacity.value = withDelay(itemDelay, withTiming(1, { duration, easing: Easing.out(Easing.cubic) }));
  }, [duration, itemDelay, opacity, reduceMotion, shouldAnimate, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}

export function Shimmer({
  width = "100%",
  height = 76,
  borderRadius = 16,
  style,
}: {
  width?: string | number;
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
          width: width as any,
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

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  style,
  disabled,
  darkSurface = false,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  darkSurface?: boolean;
}) {
  const { reduceMotion } = useBodhini();
  const { colors } = useTheme();
  const [containerWidth, setContainerWidth] = useState(0);
  const translateX = useSharedValue(0);

  const count = Math.max(options.length, 1);
  const innerWidth = Math.max(0, containerWidth - 6);
  const segmentWidth = innerWidth / count;
  const activeIndex = Math.max(0, options.findIndex((o) => o.value === value));

  useEffect(() => {
    if (segmentWidth <= 0) return;
    const target = activeIndex * segmentWidth;
    translateX.value = reduceMotion
      ? target
      : withSpring(target, { damping: 20, stiffness: 220 });
  }, [activeIndex, reduceMotion, segmentWidth, translateX]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  }, []);

  const trackBg = darkSurface ? colors.cameraControl : colors.surfaceAlt;
  const pillBg = darkSurface ? colors.white : colors.primary;
  const activeText = darkSurface ? colors.ink : colors.onPrimary;
  const inactiveText = darkSurface ? colors.cameraText : colors.secondaryText;

  return (
    <View
      onLayout={onLayout}
      style={[
        segmentedStyles.container,
        { backgroundColor: trackBg, borderColor: darkSurface ? colors.cameraControl : colors.separator },
        style,
      ]}
    >
      {segmentWidth > 0 ? (
        <Animated.View
          style={[
            segmentedStyles.pill,
            { width: segmentWidth, backgroundColor: pillBg },
            indicatorStyle,
          ]}
        />
      ) : null}
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => !disabled && onChange(opt.value)}
            disabled={disabled}
            style={segmentedStyles.option}
            accessibilityRole="button"
            accessibilityLabel={opt.label}
            accessibilityState={{ selected }}
          >
            <Text
              numberOfLines={1}
              style={[
                segmentedStyles.label,
                { color: selected ? activeText : inactiveText },
              ]}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
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
  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sheetIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetClose: {
    minWidth: 48,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetTitle: {
    fontWeight: "700",
    marginBottom: 8,
  },
  sheetBody: {
    lineHeight: 24,
    marginBottom: 24,
  },
  sheetButton: {
    minHeight: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetButtonText: {
    fontWeight: "600",
  },
});

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

const segmentedStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    padding: 3,
    minHeight: 48,
    borderWidth: StyleSheet.hairlineWidth,
    position: "relative",
  },
  pill: {
    position: "absolute",
    top: 3,
    bottom: 3,
    left: 3,
    borderRadius: 999,
  },
  option: {
    flex: 1,
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    zIndex: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
  },
});
