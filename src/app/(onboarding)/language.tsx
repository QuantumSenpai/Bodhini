import React, { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Check, Headphones, Sun, Moon, Monitor } from "lucide-react-native";
import { BodhiniScreen, PrimaryButton, TopBar, PageHeading } from "../../components/ui/BodhiniUI";
import { useBodhini, type InteractionMode } from "../../state/AppContext";
import type { AppLanguage } from "../../domain/document/document.types";
import { t } from "../../i18n/translations";
import { useTheme } from "../../theme/ThemeProvider";
import { FadeInUp, Cloud } from "../../components/motion";

const choices: { code: AppLanguage; title: string; sampleKey: "englishSample" | "bengaliSample" | "hindiSample"; letter: string }[] = [
  { code: "en", title: "English", sampleKey: "englishSample", letter: "A" },
  { code: "bn", title: "বাংলা", sampleKey: "bengaliSample", letter: "ব" },
  { code: "hi", title: "हिंदी", sampleKey: "hindiSample", letter: "हि" },
];

export default function LanguageScreen() {
  const router = useRouter();
  const { language, interactionMode, setLanguage, setInteractionMode, completeOnboarding, onboardingComplete } = useBodhini();
  const { isDark, setMode: setThemeMode, colors } = useTheme();
  const [selectedLanguage, setSelectedLanguage] = useState<AppLanguage>(language);
  const [mode, setMode] = useState<InteractionMode>(interactionMode);
  const [saving, setSaving] = useState(false);

  const continueNext = async () => {
    setSaving(true);
    try {
      await Promise.all([setLanguage(selectedLanguage), setInteractionMode(mode)]);
      if (!onboardingComplete) await completeOnboarding();
      router.replace(onboardingComplete ? "/(tabs)/profile" : "/(tabs)");
    } catch {
      Alert.alert(t(selectedLanguage, "permissionRequired"), t(selectedLanguage, "pleaseTryAgain"));
    } finally { setSaving(false); }
  };

  const styles = StyleSheet.create({
    page: { paddingTop: 4 },
    progress: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 28, gap: 5 },
    progressActive: { width: 22, height: 3, borderRadius: 3, backgroundColor: colors.accent },
    progressDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.primary },
    progressDotMuted: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.border },
    progressLine: { width: 18, height: 2, backgroundColor: colors.border },
    options: { gap: 12, marginTop: 4 },
    languageCard: { minHeight: 78, borderRadius: 18, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, flexDirection: "row", alignItems: "center", paddingHorizontal: 14, gap: 13 },
    languageActive: { borderColor: colors.primary, backgroundColor: colors.primary + "15" },
    letter: { width: 48, height: 48, backgroundColor: colors.surfaceAlt, borderRadius: 12, alignItems: "center", justifyContent: "center" },
    letterText: { fontSize: 22, fontFamily: "serif", color: colors.text, fontWeight: "700" },
    choiceText: { flex: 1, gap: 4 },
    choiceTitle: { color: colors.text, fontFamily: "serif", fontSize: 17, fontWeight: "600" },
    choiceSub: { color: colors.textMuted, fontSize: 11 },
    radio: { width: 19, height: 19, borderWidth: 2, borderColor: colors.border, borderRadius: 10, alignItems: "center", justifyContent: "center" },
    radioActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    modeTitle: { color: colors.text, fontSize: 14, fontWeight: "700", marginTop: 24, marginBottom: 10 },
    modeRow: { flexDirection: "row", gap: 10 },
    modeCard: { flex: 1, minHeight: 74, borderRadius: 16, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", gap: 5 },
    modeActive: { borderColor: colors.primary, backgroundColor: colors.forestLight },
    modeLabel: { fontSize: 12, fontWeight: "600" },
    typeGlyph: { color: colors.primary, fontWeight: "800", fontSize: 20 },
    continue: { marginTop: 26 },
    changeLater: { textAlign: "center", color: colors.textMuted, fontSize: 12, marginTop: 12 },
  });

  const modeOptions: { value: InteractionMode; labelKey: "speak" | "type"; icon: React.ReactNode }[] = [
    { value: "speak", labelKey: "speak", icon: <Headphones size={22} /> },
    { value: "type", labelKey: "type", icon: <Text style={styles.typeGlyph}>Aa</Text> },
  ];

  return (
    <BodhiniScreen contentStyle={styles.page}>
      <TopBar onBack={() => router.back()} />
      <View style={styles.progress}>
        <View style={styles.progressActive} />
        <View style={styles.progressDot} />
        <View style={styles.progressLine} />
        <View style={styles.progressDotMuted} />
        <View style={styles.progressLine} />
      </View>
      <PageHeading title={t(selectedLanguage, "chooseLanguage")} subtitle={t(selectedLanguage, "languageIntro")} />
      <View style={styles.options}>
        {choices.map((choice, index) => {
          const active = selectedLanguage === choice.code;
          return (
            <FadeInUp key={choice.code} index={index} delay={index * 40}>
              <Pressable
                onPress={() => setSelectedLanguage(choice.code)}
                style={[styles.languageCard, active && styles.languageActive]}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
              >
                <View style={styles.letter}><Text style={styles.letterText}>{choice.letter}</Text></View>
                <View style={styles.choiceText}>
                  <Text style={styles.choiceTitle}>{choice.title}</Text>
                  <Text style={styles.choiceSub}>{t(selectedLanguage, choice.sampleKey)}</Text>
                </View>
                <View style={[styles.radio, active && styles.radioActive]}>{active ? <Check size={13} color={colors.onPrimary} /> : null}</View>
              </Pressable>
            </FadeInUp>
          );
        })}
      </View>
      <FadeInUp index={3} delay={100}>
        <Text style={styles.modeTitle}>{t(selectedLanguage, "selectAssistMode")}</Text>
      </FadeInUp>
      <View style={styles.modeRow}>
        {modeOptions.map((opt, index) => (
          <FadeInUp key={opt.value} index={4 + index} delay={140 + index * 40}>
            <Pressable
              onPress={() => setMode(opt.value)}
              style={[styles.modeCard, mode === opt.value && styles.modeActive]}
            >
              {opt.icon}
              <Text style={[styles.modeLabel, { color: mode === opt.value ? colors.primary : colors.text }]}>{t(selectedLanguage, opt.labelKey)}</Text>
            </Pressable>
          </FadeInUp>
        ))}
      </View>
      <FadeInUp index={6} delay={180}>
        <PrimaryButton title={t(selectedLanguage, "continue")} onPress={continueNext} loading={saving} style={styles.continue} />
        <Text style={styles.changeLater}>{t(selectedLanguage, "changeLater")}</Text>
      </FadeInUp>
    </BodhiniScreen>
  );
}