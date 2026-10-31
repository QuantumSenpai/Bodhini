import React from "react";
import { Alert, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Camera, FileText, FolderOpen, Flower2, Settings, Sun, Volume2, ShieldCheck } from "lucide-react-native";
import { BodhiniScreen, ActionCard } from "../../components/ui/BodhiniUI";
import { useBodhini } from "../../state/AppContext";
import { t } from "../../i18n/translations";
import { colors } from "../../theme/tokens";
import { services } from "../../composition/services";

export default function HomeScreen() {
  const router = useRouter();
  const { language, documents, interactionMode } = useBodhini();
  const sayWelcome = () => services.voiceService.speak(
    language === "bn" ? "বোধিনীতে স্বাগতম। আজ আপনি কী করতে চান?" : language === "hi" ? "बोधिनी में आपका स्वागत है। आज आप क्या करना चाहेंगे?" : "Welcome to Bodhini. What would you like to do today?",
    language,
  ).catch(() => Alert.alert(t(language, "voiceUnavailable"), t(language, "ttsUnavailable")));

  return <BodhiniScreen contentStyle={styles.page}>
    <View style={styles.topRow}>
      <View style={styles.brandRow}><Flower2 size={29} color={colors.gold} strokeWidth={1.7} /><Text style={styles.brand}>Bodhini</Text></View>
      <Pressable style={styles.settingsButton} onPress={() => router.push("/(tabs)/profile")} accessibilityRole="button" accessibilityLabel="Open profile settings"><Settings size={22} color={colors.ink} /></Pressable>
    </View>
    <View style={styles.greetingRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.greeting}>{t(language, "greeting")}</Text>
        <Text style={styles.greeting}>{t(language, "homePrompt")}</Text>
      </View>
      <Sun size={42} color={colors.gold} strokeWidth={1.5} />
    </View>
    <ActionCard title={t(language, "scan")} subtitle={t(language, "scanSub")} icon={<Camera size={25} color={colors.white} />} onPress={() => router.push("/scan/camera")} />
    <ActionCard title={t(language, "fill")} subtitle={t(language, "fillSub")} icon={<FileText size={25} color={colors.white} />} tint={colors.terracotta} onPress={() => router.push("/(tabs)/forms")} />
    <ActionCard title={t(language, "locker")} subtitle={t(language, "lockerSub")} icon={<FolderOpen size={25} color={colors.white} />} tint={colors.blue} onPress={() => router.push("/(tabs)/documents")} />

    <View style={styles.landscapeCard}>
      <Image source={require("../../../assets/images/welcome-landscape.png")} style={styles.landscape} resizeMode="cover" />
      <View style={styles.landscapeOverlay}>
        <Text style={styles.landscapeTitle}>{t(language, "landscapeMessage")}</Text>
      </View>
    </View>

    <View style={styles.privacyNote}>
      <ShieldCheck size={18} color={colors.forest} />
      <Text style={styles.privacyText}>{t(language, "privateOffline")}</Text>
    </View>
    {interactionMode === "speak" ? <Pressable onPress={sayWelcome} style={styles.listenPrompt}><Volume2 size={16} color={colors.forest} /><Text style={styles.listenText}>{t(language, "listenToday")}</Text></Pressable> : null}
    <Text style={styles.savedCount}>{documents.length} {documents.length === 1 ? t(language, "savedDocumentCount") : t(language, "savedDocumentsCount")}</Text>
  </BodhiniScreen>;
}

const styles = StyleSheet.create({
  page: { paddingTop: 10 }, topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 28 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 8 }, brand: { color: colors.ink, fontFamily: "serif", fontSize: 25, fontWeight: "700" },
  settingsButton: { width: 42, height: 42, backgroundColor: colors.card, borderRadius: 15, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.line },
  greetingRow: { flexDirection: "row", alignItems: "center", marginBottom: 19, gap: 12 },
  greeting: { color: colors.ink, fontFamily: "serif", fontSize: 25, lineHeight: 31, fontWeight: "600" },
  landscapeCard: { height: 146, borderRadius: 20, overflow: "hidden", marginTop: 9, backgroundColor: colors.cardStrong },
  landscape: { width: "100%", height: "100%", position: "absolute" }, landscapeOverlay: { flex: 1, justifyContent: "flex-end", padding: 17, backgroundColor: "rgba(18,38,31,0.12)" },
  landscapeTitle: { color: colors.white, fontFamily: "serif", fontSize: 17, fontWeight: "700", textShadowColor: "rgba(0,0,0,.35)", textShadowRadius: 4 },
  privacyNote: { marginTop: 15, flexDirection: "row", alignItems: "center", gap: 9, paddingHorizontal: 12, paddingVertical: 11, backgroundColor: colors.forestLight, borderRadius: 13 },
  privacyText: { color: colors.forest, fontSize: 11, flex: 1, lineHeight: 16 }, listenPrompt: { marginTop: 12, flexDirection: "row", gap: 7, alignItems: "center", alignSelf: "center" }, listenText: { color: colors.forest, fontSize: 12, fontWeight: "600" },
  savedCount: { textAlign: "center", color: colors.muted, fontSize: 11, marginTop: 14 },
});
