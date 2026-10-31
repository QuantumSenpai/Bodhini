import React from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Globe, Mic, Folder, ShieldCheck, Info, ChevronRight, UserRound } from "lucide-react-native";
import { BodhiniScreen, PageHeading } from "../../components/ui/BodhiniUI";
import { useBodhini } from "../../state/AppContext";
import { t } from "../../i18n/translations";
import { colors } from "../../theme/tokens";
import { services } from "../../composition/services";

export default function ProfileScreen() {
  const router = useRouter();
  const { language, interactionMode, setInteractionMode, documents } = useBodhini();
  const languageLabel = language === "bn" ? "বাংলা" : language === "hi" ? "हिंदी" : "English";

  const rows = [
    { icon: <Globe size={19} color={colors.ink} />, label: t(language, "language"), value: languageLabel, onPress: () => router.push("/(onboarding)/language") },
    { icon: <Mic size={19} color={colors.ink} />, label: t(language, "voicePreferences"), value: interactionMode === "speak" ? t(language, "speak") : t(language, "type"), onPress: () => Alert.alert(t(language, "voicePreferences"), "Choose how Bodhini should assist you.", [
      { text: t(language, "speak"), onPress: () => setInteractionMode("speak").catch(() => Alert.alert("Could not save", "Please try again.")) },
      { text: t(language, "type"), onPress: () => setInteractionMode("type").catch(() => Alert.alert("Could not save", "Please try again.")) },
      { text: "Cancel", style: "cancel" },
    ]) },
    { icon: <Folder size={19} color={colors.ink} />, label: t(language, "categories"), value: `${documents.length} saved`, onPress: () => Alert.alert(t(language, "categories"), "Supported categories: Aadhaar, PAN, Birth Certificate, Ration Card, Marksheet, Domicile and Other.") },
    { icon: <ShieldCheck size={19} color={colors.ink} />, label: t(language, "privacy"), value: "", onPress: () => Alert.alert(t(language, "privacy"), "Document processing uses the on-device OCR adapter. Records are stored in local SQLite. SQLCipher and Android Keystore encryption are not configured in this build.") },
    { icon: <Info size={19} color={colors.ink} />, label: t(language, "about"), value: "", onPress: () => Alert.alert("Bodhini", "Scan once. Fill any form.\n\nAn offline-first document and form assistant.") },
  ];

  return <BodhiniScreen contentStyle={styles.page}>
    <PageHeading title={t(language, "profileTitle")} align="center" />
    <View style={styles.avatar}><UserRound size={44} color={colors.forest} /></View>
    <Text style={styles.profileName}>{t(language, "localUser")}</Text>
    <Text style={styles.profileSub}>{t(language, "deviceOnly")}</Text>
    <View style={styles.settingsList}>
      {rows.map((row) => <Pressable key={row.label} onPress={row.onPress} style={styles.settingRow} accessibilityRole="button">
        <View style={styles.rowIcon}>{row.icon}</View><Text style={styles.rowLabel}>{row.label}</Text>
        {row.value ? <Text style={styles.rowValue}>{row.value}</Text> : null}<ChevronRight size={18} color={colors.muted} />
      </Pressable>)}
    </View>
    <Pressable style={styles.listen} onPress={() => services.voiceService.speak(t(language, "speakPrompt"), language).catch(() => Alert.alert(t(language, "voiceUnavailable"), t(language, "ttsUnavailable")))}>
      <Mic color={colors.forest} size={17} /><Text style={styles.listenText}>{t(language, "listenWelcome")}</Text>
    </Pressable>
  </BodhiniScreen>;
}

const styles = StyleSheet.create({
  page: { paddingTop: 10 }, avatar: { width: 96, height: 96, borderRadius: 48, backgroundColor: colors.cardStrong, alignSelf: "center", alignItems: "center", justifyContent: "center", marginTop: 2 },
  profileName: { color: colors.ink, fontFamily: "serif", fontSize: 22, fontWeight: "700", textAlign: "center", marginTop: 12 },
  profileSub: { color: colors.muted, fontSize: 12, textAlign: "center", marginTop: 4, marginBottom: 25 },
  settingsList: { backgroundColor: colors.card, borderRadius: 18, borderWidth: 1, borderColor: colors.line, overflow: "hidden" },
  settingRow: { minHeight: 65, flexDirection: "row", alignItems: "center", paddingHorizontal: 14, gap: 12, borderBottomWidth: 1, borderBottomColor: colors.line },
  rowIcon: { width: 31, alignItems: "center" }, rowLabel: { color: colors.ink, fontFamily: "serif", fontSize: 15, flex: 1 }, rowValue: { color: colors.muted, fontSize: 11, maxWidth: 98 },
  listen: { alignSelf: "center", marginTop: 24, flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 22, backgroundColor: colors.forestLight },
  listenText: { color: colors.forest, fontSize: 12, fontWeight: "600" },
});
