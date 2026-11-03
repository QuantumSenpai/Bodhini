import React, { useEffect } from "react";
import { type StyleProp, View, ViewStyle } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { useBodhini } from "../../state/AppContext";

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