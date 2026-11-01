import React, { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Globe, Mic, Folder, ShieldCheck, Info, ChevronRight, UserRound, Sun, Moon, Monitor, Type, SlidersHorizontal } from "lucide-react-native";
import { BodhiniScreen, PageHeading, PrimaryButton } from "../../components/ui/BodhiniUI";
import { useBodhini } from "../../state/AppContext";
import { t } from "../../i18n/translations";
import { useTheme } from "../../theme/ThemeProvider";
import { SegmentedControl, AnimatedSwitch } from "../../components/motion";

type ThemeMode = "system" | "light" | "dark";
type TextSize = 1 | 1.15 | 1.3;

const themeOptions = [
  { value: "system" as ThemeMode, label: "System" },
  { value: "light" as ThemeMode, label: "Light" },
  { value: "dark" as ThemeMode, label: "Dark" },
];

const textSizeOptions: { value: TextSize; label: string }[] = [
  { value: 1, label: "Default" },
  { value: 1.15, label: "Large" },
  { value: 1.3, label: "Larger" },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { language, interactionMode, setInteractionMode, documents, themeMode, setThemeMode } = useBodhini();
  const { isDark, setMode: setThemeModeDirect, colors } = useTheme();
  const languageLabel = language === "bn" ? "বাংলা" : language === "hi" ? "हिंदी" : "English";
  const [textSize, setTextSize] = useState<TextSize>(1);
  const [reduceMotion, setReduceMotion] = useState(false);

  const rows = [
    {
      icon: <Globe size={19} color={colors.text} />,
      label: t(language, "language"),
      value: languageLabel,
      onPress: () => router.push("/(onboarding)/language"),
    },
    {
      icon: <Mic size={19} color={colors.text} />,
      label: t(language, "voicePreferences"),
      value: interactionMode === "speak" ? t(language, "speak") : t(language, "type"),
      onPress: () => Alert.alert(t(language, "voicePreferences"), "Choose how Bodhini should assist you.", [
        { text: t(language, "speak"), onPress: () => setInteractionMode("speak").catch(() => Alert.alert("Could not save", "Please try again.")) },
        { text: t(language, "type"), onPress: () => setInteractionMode("type").catch(() => Alert.alert("Could not save", "Please try again.")) },
        { text: "Cancel", style: "cancel" },
      ]),
    },
    {
      icon: <Folder size={19} color={colors.text} />,
      label: t(language, "categories"),
      value: `${documents.length} saved`,
      onPress: () => Alert.alert(t(language, "categories"), "Supported categories: Aadhaar, PAN, Birth Certificate, Ration Card, Marksheet, Domicile and Other."),
    },
    {
      icon: <ShieldCheck size={19} color={colors.text} />,
      label: t(language, "privacy"),
      value: "",
      onPress: () => Alert.alert(t(language, "privacy"), "Document processing uses the on-device OCR adapter. Records are stored in local SQLite. SQLCipher and Android Keystore encryption are not configured in this build."),
    },
    {
      icon: <Info size={19} color={colors.text} />,
      label: t(language, "about"),
      value: "",
      onPress: () => Alert.alert("Bodhini", "Scan once. Fill any form.\n\nAn offline-first document and form assistant."),
    },
  ];

  return (
    <BodhiniScreen contentStyle={styles.page}>
      <PageHeading title={t(language, "profileTitle")} align="center" />
      <View style={[styles.avatar, { backgroundColor: colors.cardStrong }]}><UserRound size={44} color={colors.primary} /></View>
      <Text style={[styles.profileName, { color: colors.text }]}>{t(language, "localUser")}</Text>
      <Text style={[styles.profileSub, { color: colors.textMuted }]}>{t(language, "deviceOnly")}</Text>

      <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Appearance</Text>
      <View style={[styles.settingsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
          <View style={styles.rowIcon}><Sun size={20} color={colors.primary} /></View>
          <Text style={[styles.rowLabel, { color: colors.text }]}>Theme</Text>
          <SegmentedControl options={themeOptions} value={themeMode} onChange={(v: ThemeMode) => { setThemeMode(v); setThemeModeDirect(v); }} style={styles.segmented} />
        </View>
        <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
          <View style={styles.rowIcon}><Type size={20} color={colors.primary} /></View>
          <Text style={[styles.rowLabel, { color: colors.text }]}>Text Size</Text>
          <SegmentedControl options={textSizeOptions.map(o => ({ value: String(o.value), label: o.label }))} value={String(textSize)} onChange={(v) => setTextSize(parseFloat(v) as TextSize)} style={styles.segmented} />
        </View>
        <View style={styles.settingRow}>
          <View style={styles.rowIcon}><SlidersHorizontal size={20} color={colors.primary} /></View>
          <Text style={[styles.rowLabel, { color: colors.text }]}>Reduce Motion</Text>
          <AnimatedSwitch value={reduceMotion} onValueChange={setReduceMotion} thumbColor={colors.onPrimary} trackColorTrue={colors.primary} trackColorFalse={colors.border} />
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Account</Text>
      <View style={[styles.settingsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {rows.map((row) => (
          <Pressable key={row.label} onPress={row.onPress} style={[styles.settingRow, { borderBottomColor: colors.border }]} accessibilityRole="button">
            <View style={styles.rowIcon}>{row.icon}</View>
            <Text style={[styles.rowLabel, { color: colors.text }]}>{row.label}</Text>
            {row.value ? <Text style={[styles.rowValue, { color: colors.textMuted }]}>{row.value}</Text> : null}
            <ChevronRight size={18} color={colors.textMuted} />
          </Pressable>
        ))}
      </View>
    </BodhiniScreen>
  );
}

const styles = StyleSheet.create({
  page: { paddingTop: 10 },
  avatar: { width: 96, height: 96, borderRadius: 48, alignSelf: "center", alignItems: "center", justifyContent: "center", marginTop: 2 },
  profileName: { fontFamily: "serif", fontSize: 22, fontWeight: "700", textAlign: "center", marginTop: 12 },
  profileSub: { fontSize: 12, textAlign: "center", marginTop: 4, marginBottom: 25 },
  sectionTitle: { fontSize: 11, fontWeight: "600", letterSpacing: 0.8, textTransform: "uppercase", marginTop: 8, marginBottom: 8, paddingHorizontal: 4 },
  settingsCard: { borderRadius: 20, borderWidth: 1, overflow: "hidden", marginBottom: 16 },
  settingRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 14, gap: 12, borderBottomWidth: 1 },
  rowIcon: { width: 31, alignItems: "center" },
  rowLabel: { fontFamily: "serif", fontSize: 15, flex: 1 },
  rowValue: { fontSize: 11, maxWidth: 98 },
  segmented: { flex: 1, maxWidth: 200 },
});