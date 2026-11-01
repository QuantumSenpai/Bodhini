import React, { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Check, Headphones, Type } from "lucide-react-native";
import { BodhiniScreen, PageHeading, PrimaryButton, TopBar } from "../../components/ui/BodhiniUI";
import { useBodhini, type InteractionMode } from "../../state/AppContext";
import type { AppLanguage } from "../../domain/document/document.types";
import { t } from "../../i18n/translations";
import { useTheme } from "../../theme/ThemeProvider";
import { FadeInUp, Hint, PressableScale } from "../../components/motion";

const choices: {
  code: AppLanguage;
  title: string;
  sampleKey: "englishSample" | "bengaliSample" | "hindiSample";
  letter: string;
}[] = [
  { code: "en", title: "English", sampleKey: "englishSample", letter: "A" },
  { code: "bn", title: "বাংলা", sampleKey: "bengaliSample", letter: "ব" },
  { code: "hi", title: "हिंदी", sampleKey: "hindiSample", letter: "हि" },
];

export default function LanguageScreen() {
  const router = useRouter();
  const {
    language,
    interactionMode,
    setLanguage,
    setInteractionMode,
    completeOnboarding,
    onboardingComplete,
  } = useBodhini();
  const { colors, theme } = useTheme();
  const [selectedLanguage, setSelectedLanguage] = useState<AppLanguage>(language);
  const [mode, setMode] = useState<InteractionMode>(interactionMode);
  const [saving, setSaving] = useState(false);

  const continueNext = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await Promise.all([setLanguage(selectedLanguage), setInteractionMode(mode)]);
      if (!onboardingComplete) {
        await completeOnboarding();
        router.replace("/(tabs)");
      } else {
        router.back();
      }
    } catch {
      Alert.alert(t(selectedLanguage, "saveFailed"), t(selectedLanguage, "pleaseTryAgain"));
    } finally {
      setSaving(false);
    }
  };

  const modeOptions: { value: InteractionMode; labelKey: "speak" | "type"; icon: React.ReactNode }[] = [
    { value: "speak", labelKey: "speak", icon: <Headphones size={22} color={mode === "speak" ? colors.forest : colors.text} /> },
    { value: "type", labelKey: "type", icon: <Type size={22} color={mode === "type" ? colors.forest : colors.text} /> },
  ];

  return (
    <BodhiniScreen contentStyle={styles.page}>
      <TopBar title={t(selectedLanguage, "language")} onBack={() => router.back()} />
      <PageHeading
        title={t(selectedLanguage, "chooseLanguage")}
        subtitle={t(selectedLanguage, "languageIntro")}
      />

      <View style={styles.options}>
        {choices.map((choice, index) => {
          const active = selectedLanguage === choice.code;
          return (
            <FadeInUp key={choice.code} index={index}>
              <Hint hint={t(selectedLanguage, choice.sampleKey)} label={choice.title} role="radio">
                <PressableScale
                  onPress={() => setSelectedLanguage(choice.code)}
                  accessibilityRole="radio"
                  accessibilityLabel={choice.title}
                  accessibilityState={{ selected: active }}
                  style={[
                    styles.languageCard,
                    {
                      backgroundColor: active ? colors.forestLight : colors.surface,
                      borderColor: active ? colors.primary : colors.separator,
                      borderWidth: active ? 1.5 : StyleSheet.hairlineWidth,
                    },
                  ]}
                >
                  <View style={[styles.letter, { backgroundColor: active ? colors.primary : colors.surfaceAlt }]}>
                    <Text
                      style={[
                        styles.letterText,
                        { color: active ? colors.onPrimary : colors.text, fontSize: theme.typeScale.h3.fontSize },
                      ]}
                    >
                      {choice.letter}
                    </Text>
                  </View>
                  <View style={styles.choiceText}>
                    <Text style={[styles.choiceTitle, { color: colors.text, fontSize: theme.typeScale.bodyStrong.fontSize }]}>
                      {choice.title}
                    </Text>
                    <Text style={[styles.choiceSub, { color: colors.secondaryText, fontSize: theme.typeScale.caption.fontSize }]}>
                      {t(selectedLanguage, choice.sampleKey)}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.radio,
                      {
                        borderColor: active ? colors.primary : colors.separator,
                        backgroundColor: active ? colors.primary : colors.surface,
                      },
                    ]}
                  >
                    {active ? <Check size={14} color={colors.onPrimary} strokeWidth={3} /> : null}
                  </View>
                </PressableScale>
              </Hint>
            </FadeInUp>
          );
        })}
      </View>

      <FadeInUp index={3}>
        <Text style={[styles.modeTitle, { color: colors.text, fontSize: theme.typeScale.bodyStrong.fontSize }]}>
          {t(selectedLanguage, "selectAssistMode")}
        </Text>
      </FadeInUp>

      <View style={styles.modeRow}>
        {modeOptions.map((opt, index) => {
          const active = mode === opt.value;
          const label = t(selectedLanguage, opt.labelKey);
          return (
            <FadeInUp key={opt.value} index={4 + index} style={styles.modeCol}>
              <Hint hint={label} label={label} role="radio">
                <PressableScale
                  onPress={() => setMode(opt.value)}
                  accessibilityRole="radio"
                  accessibilityLabel={label}
                  accessibilityState={{ selected: active }}
                  style={[
                    styles.modeCard,
                    {
                      backgroundColor: active ? colors.forestLight : colors.surface,
                      borderColor: active ? colors.primary : colors.separator,
                      borderWidth: active ? 1.5 : StyleSheet.hairlineWidth,
                    },
                  ]}
                >
                  {opt.icon}
                  <Text
                    style={[
                      styles.modeLabel,
                      { color: active ? colors.forest : colors.text, fontSize: theme.typeScale.captionStrong.fontSize },
                    ]}
                  >
                    {label}
                  </Text>
                </PressableScale>
              </Hint>
            </FadeInUp>
          );
        })}
      </View>

      <FadeInUp index={6}>
        <PrimaryButton
          title={onboardingComplete ? t(selectedLanguage, "continue") : t(selectedLanguage, "start")}
          onPress={continueNext}
          loading={saving}
          style={styles.continueBtn}
        />
        <Text style={[styles.changeLater, { color: colors.secondaryText, fontSize: theme.typeScale.caption.fontSize }]}>
          {t(selectedLanguage, "changeLater")}
        </Text>
      </FadeInUp>
    </BodhiniScreen>
  );
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 4,
  },
  options: {
    gap: 12,
    marginTop: 4,
  },
  languageCard: {
    minHeight: 76,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 14,
  },
  letter: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  letterText: {
    fontWeight: "700",
  },
  choiceText: {
    flex: 1,
    gap: 3,
  },
  choiceTitle: {
    fontWeight: "600",
  },
  choiceSub: {},
  radio: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  modeTitle: {
    fontWeight: "600",
    marginTop: 24,
    marginBottom: 12,
  },
  modeRow: {
    flexDirection: "row",
    gap: 12,
  },
  modeCol: {
    flex: 1,
  },
  modeCard: {
    minHeight: 76,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    gap: 8,
  },
  modeLabel: {
    fontWeight: "600",
    textAlign: "center",
  },
  continueBtn: {
    marginTop: 28,
  },
  changeLater: {
    textAlign: "center",
    marginTop: 12,
  },
});
