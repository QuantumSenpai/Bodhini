import React, { useCallback, useRef } from "react";
import { type GestureResponderEvent, Pressable, type PressableProps, StyleSheet, Text, type StyleProp, type ViewStyle, View } from "react-native";
import { useBodhini } from "../../state/AppContext";

interface ViewWithMeasure {
  measureInWindow?: (callback: (x: number, y: number, width: number, height: number) => void) => void;
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
  const wrapperRef = useRef<React.ElementRef<typeof View>>(null);

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