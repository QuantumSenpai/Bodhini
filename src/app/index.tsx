import React, { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import type { AppLanguage } from "../domain/document/document.types";
import { BodhiniLogoMark, BodhiniScreen, PrimaryButton } from "../components/ui/BodhiniUI";
import { useBodhini } from "../state/AppContext";
import { t } from "../i18n/translations";
import { useTheme } from "../theme/ThemeProvider";
import { FadeInUp, Hint, PressableScale, PulseDot } from "../components/motion";

const languagePills: { code: AppLanguage; label: string }[] = [
  { code: "en", label: "English" },
  { code: "bn", label: "বাংলা" },
  { code: "hi", label: "हिंदी" },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const { ready, onboardingComplete, language, setLanguage, completeOnboarding } = useBodhini();
  const { colors, theme } = useTheme();
  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    if (ready && onboardingComplete) {
      router.replace("/(tabs)");
    }
  }, [onboardingComplete, ready, router]);

  const handleSkip = useCallback(async () => {
    await completeOnboarding().catch(() => undefined);
    router.replace("/(tabs)");
  }, [completeOnboarding, router]);

  const handleGetStarted = useCallback(() => {
    if (slideIndex < 2) {
      setSlideIndex((prev) => prev + 1);
      return;
    }
    router.push("/(onboarding)/language");
  }, [router, slideIndex]);

  if (!ready || onboardingComplete) {
    return (
      <BodhiniScreen scroll={false} contentStyle={styles.splashContainer}>
        <View style={styles.splashCenter}>
          <BodhiniLogoMark size={60} />
          <Text style={[styles.splashBrand, { color: colors.text, fontSize: theme.typeScale.largeTitle.fontSize }]}>
            {t(language, "brandName")}
          </Text>
          <Text style={[styles.splashSub, { color: colors.secondaryText, fontSize: theme.typeScale.caption.fontSize }]}>
            {t(language, "brandCompanion")}
          </Text>
          <PulseDot color={colors.primary} size={8} style={styles.splashPulse} />
        </View>
      </BodhiniScreen>
    );
  }

  const slides = [
    { title: t(language, "tagline"), body: t(language, "description") },
    { title: t(language, "slide2Title"), body: t(language, "slide2Desc") },
    { title: t(language, "slide3Title"), body: t(language, "slide3Desc") },
  ];
  const currentSlide = slides[slideIndex] ?? slides[0];

  return (
    <BodhiniScreen scroll={true} contentStyle={styles.page}>
      <View style={styles.topHeader}>
        <View style={styles.topBrand}>
          <BodhiniLogoMark size={32} />
          <Text style={[styles.topBrandText, { color: colors.text, fontSize: theme.typeScale.bodyStrong.fontSize }]}>
            {t(language, "brandName")}
          </Text>
        </View>
        <Hint hint={t(language, "hintSkipOnboarding")} label={t(language, "skip")}>
          <PressableScale
            onPress={handleSkip}
            accessibilityRole="button"
            accessibilityLabel={t(language, "skip")}
            style={styles.skipButton}
          >
            <Text style={[styles.skipText, { color: colors.secondaryText, fontSize: theme.typeScale.body.fontSize }]}>
              {t(language, "skip")}
            </Text>
          </PressableScale>
        </Hint>
      </View>

      <View style={styles.illustrationArea}>
        <View style={styles.cardFanWrap}>
          <View
            style={[
              styles.fanCardBack,
              { backgroundColor: colors.primary, borderColor: colors.primary },
            ]}
          />
          <View
            style={[
              styles.fanCardMid,
              { backgroundColor: colors.forestLight, borderColor: colors.separator },
            ]}
          />
          <View
            style={[
              styles.fanCardFront,
              { backgroundColor: colors.surface, borderColor: colors.primary },
            ]}
          >
            <View style={[styles.docLineShort, { backgroundColor: colors.primary }]} />
            <View style={[styles.docLineFull, { backgroundColor: colors.primary }]} />
            <View style={[styles.docLineMid, { backgroundColor: colors.primary }]} />
          </View>
        </View>
      </View>

      <FadeInUp key={slideIndex} index={0}>
        <View style={styles.textBlock}>
          <Text
            style={[
              styles.slideTitle,
              {
                color: colors.text,
                fontSize: theme.typeScale.title.fontSize,
                lineHeight: theme.typeScale.title.lineHeight,
              },
            ]}
          >
            {currentSlide.title}
          </Text>
          <Text
            style={[
              styles.slideBody,
              {
                color: colors.secondaryText,
                fontSize: theme.typeScale.body.fontSize,
                lineHeight: theme.typeScale.body.lineHeight,
              },
            ]}
          >
            {currentSlide.body}
          </Text>
        </View>
      </FadeInUp>

      <View style={styles.languageBar}>
        {languagePills.map((item) => {
          const active = language === item.code;
          return (
            <Hint key={item.code} hint={t(language, "chooseLanguage")} label={item.label}>
              <PressableScale
                onPress={() => setLanguage(item.code).catch(() => undefined)}
                accessibilityRole="button"
                accessibilityLabel={item.label}
                accessibilityState={{ selected: active }}
                style={[
                  styles.langPill,
                  {
                    backgroundColor: active ? colors.forestLight : colors.surface,
                    borderColor: active ? colors.primary : colors.separator,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.langPillText,
                    {
                      color: active ? colors.forest : colors.secondaryText,
                      fontSize: theme.typeScale.captionStrong.fontSize,
                    },
                  ]}
                >
                  {item.label}
                </Text>
              </PressableScale>
            </Hint>
          );
        })}
      </View>

      <View style={styles.dotsRow}>
        {[0, 1, 2].map((idx) => {
          const active = idx === slideIndex;
          return (
            <PressableScale
              key={idx}
              onPress={() => setSlideIndex(idx)}
              accessibilityRole="button"
              accessibilityLabel={`${idx + 1}`}
              accessibilityState={{ selected: active }}
              style={styles.dotHit}
            >
              <View
                style={[
                  styles.dot,
                  {
                    width: active ? 22 : 8,
                    backgroundColor: active ? colors.primary : colors.separator,
                  },
                ]}
              />
            </PressableScale>
          );
        })}
      </View>

      <View style={styles.footer}>
        <PrimaryButton
          title={slideIndex < 2 ? t(language, "next") : t(language, "start")}
          onPress={handleGetStarted}
          hint={t(language, "start")}
        />
        {slideIndex < 2 ? (
          <PressableScale
            onPress={() => router.push("/(onboarding)/language")}
            accessibilityRole="button"
            accessibilityLabel={t(language, "start")}
            style={styles.directStartBtn}
          >
            <Text style={[styles.directStartText, { color: colors.forest, fontSize: theme.typeScale.captionStrong.fontSize }]}>
              {t(language, "start")}
            </Text>
          </PressableScale>
        ) : null}
      </View>
    </BodhiniScreen>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  splashCenter: {
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 32,
  },
  splashBrand: {
    fontWeight: "700",
    marginTop: 8,
    letterSpacing: -0.6,
  },
  splashSub: {
    textAlign: "center",
    maxWidth: 220,
    lineHeight: 20,
  },
  splashPulse: {
    marginTop: 16,
  },
  page: {
    justifyContent: "space-between",
    paddingTop: 8,
  },
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  topBrand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  topBrandText: {
    fontWeight: "700",
  },
  skipButton: {
    minWidth: 48,
    minHeight: 48,
    paddingHorizontal: 8,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  skipText: {
    fontWeight: "500",
  },
  illustrationArea: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
  },
  cardFanWrap: {
    width: 180,
    height: 170,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  fanCardBack: {
    position: "absolute",
    width: 104,
    height: 128,
    borderRadius: 18,
    borderWidth: 2,
    transform: [{ rotate: "-16deg" }, { translateX: -22 }, { translateY: 4 }],
  },
  fanCardMid: {
    position: "absolute",
    width: 104,
    height: 128,
    borderRadius: 18,
    borderWidth: 1.5,
    transform: [{ rotate: "-5deg" }, { translateX: -6 }, { translateY: -4 }],
  },
  fanCardFront: {
    width: 108,
    height: 132,
    borderRadius: 18,
    borderWidth: 2.5,
    paddingHorizontal: 18,
    paddingVertical: 24,
    justifyContent: "center",
    gap: 12,
    transform: [{ rotate: "6deg" }, { translateX: 12 }, { translateY: 2 }],
  },
  docLineShort: {
    width: 36,
    height: 6,
    borderRadius: 3,
  },
  docLineFull: {
    width: "100%",
    height: 6,
    borderRadius: 3,
  },
  docLineMid: {
    width: "75%",
    height: 6,
    borderRadius: 3,
  },
  textBlock: {
    gap: 10,
    paddingHorizontal: 4,
  },
  slideTitle: {
    fontWeight: "700",
    letterSpacing: -0.4,
  },
  slideBody: {
    marginTop: 2,
  },
  languageBar: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 16,
  },
  langPill: {
    minHeight: 48,
    minWidth: 88,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  langPillText: {
    fontWeight: "600",
  },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 8,
  },
  dotHit: {
    minWidth: 48,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  footer: {
    gap: 8,
    marginTop: 4,
  },
  directStartBtn: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  directStartText: {
    fontWeight: "600",
  },
});
