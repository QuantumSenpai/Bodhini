import React, { useEffect } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Sparkles, X } from "lucide-react-native";
import { useBodhini } from "../../state/AppContext";
import { useTheme } from "../../theme/ThemeProvider";
import { t } from "../../i18n/translations";
import { PressableScale } from "./PressableScale";

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

const overlayStyles = StyleSheet.create({
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