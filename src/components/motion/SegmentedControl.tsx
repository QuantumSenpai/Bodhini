import React, { useCallback, useEffect, useState } from "react";
import { type LayoutChangeEvent, Pressable, type StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useBodhini } from "../../state/AppContext";
import { useTheme } from "../../theme/ThemeProvider";

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