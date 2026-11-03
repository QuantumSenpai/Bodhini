import React, { useCallback, useRef } from "react";
import {
  type GestureResponderEvent,
  Pressable,
  type PressableProps,
  type StyleProp,
  StyleSheet,
  type ViewStyle,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useBodhini } from "../../state/AppContext";
import { useTheme } from "../../theme/ThemeProvider";

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
  const viewRef = useRef<React.ElementRef<typeof View>>(null);

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