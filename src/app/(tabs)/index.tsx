import React from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Camera, FileText, FolderOpen, Flower2, Settings, Sun, Moon, Volume2, ShieldCheck } from "lucide-react-native";
import { Image } from "expo-image";
import { BodhiniScreen, ActionCard } from "../../components/ui/BodhiniUI";
import { useBodhini } from "../../state/AppContext";
import { t } from "../../i18n/translations";
import { useTheme } from "../../theme/ThemeProvider";
import { services } from "../../composition/services";
import { Cloud, FloatingCard, Star } from "../../components/motion";

export default function HomeScreen() {
  const router = useRouter();
  const { language, documents, interactionMode } = useBodhini();
  const { isDark, setMode, colors } = useTheme();

  const sayWelcome = () => services.voiceService.speak(
    language === "bn" ? "বোধিনীতে স্বাগতম। আজ আপনি কী করতে চান?" : language === "hi" ? "बोधिनी में आपका स्वागत है। आज आप क्या करना चाहेंगे?" : "Welcome to Bodhini. What would you like to do today?",
    language,
  ).catch(() => Alert.alert(t(language, "voiceUnavailable"), t(language, "ttsUnavailable")));

  return (
    <BodhiniScreen contentStyle={styles.page}>
      <View style={styles.topRow}>
        <View style={styles.brandRow}><Flower2 size={29} color={colors.accent} strokeWidth={1.7} /><Text style={[styles.brand, { color: colors.text }]}>Bodhini</Text></View>
        <View style={styles.headerActions}>
          <Pressable onPress={() => router.push("/(tabs)/profile")} style={[styles.settingsButton, { backgroundColor: colors.card, borderColor: colors.border }]} accessibilityRole="button" accessibilityLabel={t(language, "openProfileSettings")}>
            <Settings size={22} color={colors.text} />
          </Pressable>
          <View style={styles.themeToggle}>
            <Pressable onPress={() => setMode("light")} style={[styles.themeIcon, !isDark && styles.themeIconActive, { backgroundColor: !isDark ? colors.primary : colors.surfaceAlt, borderColor: !isDark ? colors.primary : colors.border }]} accessibilityLabel="Light">
              <Sun size={20} color={!isDark ? colors.onPrimary : colors.textMuted} />
            </Pressable>
            <Pressable onPress={() => setMode("dark")} style={[styles.themeIcon, isDark && styles.themeIconActive, { backgroundColor: isDark ? colors.primary : colors.surfaceAlt, borderColor: isDark ? colors.primary : colors.border }]} accessibilityLabel="Dark">
              <Moon size={20} color={isDark ? colors.onPrimary : colors.textMuted} />
            </Pressable>
          </View>
        </View>
      </View>

      <View style={styles.greetingRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.greeting, { color: colors.text }]}>{t(language, "greeting")}</Text>
          <Text style={[styles.greeting, { color: colors.text }]}>{t(language, "homePrompt")}</Text>
        </View>
        <Sun size={42} color={colors.accent} strokeWidth={1.5} />
      </View>

      <ActionCard title={t(language, "scan")} subtitle={t(language, "scanSub")} icon={<Camera size={25} color={colors.onPrimary} />} onPress={() => router.push("/scan/camera")} />
      <ActionCard title={t(language, "fill")} subtitle={t(language, "fillSub")} icon={<FileText size={25} color={colors.onPrimary} />} tint={colors.terracotta} onPress={() => router.push("/(tabs)/forms")} />
      <ActionCard title={t(language, "locker")} subtitle={t(language, "lockerSub")} icon={<FolderOpen size={25} color={colors.onPrimary} />} tint={colors.blue} onPress={() => router.push("/(tabs)/documents")} />

      <View style={[styles.heroCard, { backgroundColor: colors.cardStrong }]}>
        <Image source={require("../../../assets/images/welcome-landscape.png")} style={styles.heroImage} contentFit="cover" transition={200} />
        <View style={styles.sky}>
          {isDark ? (
            <>
              <Star size={3} twinkleDuration={2500} delay={0} style={{ top: 30, left: 20 }} />
              <Star size={4} twinkleDuration={3000} delay={500} style={{ top: 60, left: 320 }} />
              <Star size={2} twinkleDuration={2800} delay={1000} style={{ top: 90, left: 150 }} />
              <Star size={3} twinkleDuration={3200} delay={1500} style={{ top: 40, left: 260 }} />
              <Star size={2} twinkleDuration={2200} delay={200} style={{ top: 120, left: 80 }} />
              <Star size={4} twinkleDuration={3500} delay={800} style={{ top: 15, left: 210 }} />
            </>
          ) : (
            <>
              <Cloud opacity={0.5} speed={25000} y={30} width={90} height={30} />
              <Cloud opacity={0.35} speed={35000} y={70} width={120} height={35} />
              <Cloud opacity={0.25} speed={45000} y={110} width={80} height={28} />
            </>
          )}
        </View>
        <FloatingCard floatDuration={3500} rotateAmplitude={1.5} style={styles.floatingCard}>
          <View style={[styles.mockCard, { backgroundColor: colors.surface }]}>
            <View style={[styles.mockLine, { backgroundColor: colors.border }]} />
            <View style={[styles.mockLine, { backgroundColor: colors.border }]} />
            <View style={styles.mockCheck} />
          </View>
        </FloatingCard>
        <View style={styles.heroOverlay}>
          <Text style={styles.heroTitle}>{t(language, "landscapeMessage")}</Text>
        </View>
      </View>

      <View style={[styles.privacyNote, { backgroundColor: colors.forestLight }]}>
        <ShieldCheck size={18} color={colors.forest} />
        <Text style={[styles.privacyText, { color: colors.forest }]}>{t(language, "privateOffline")}</Text>
      </View>
      {interactionMode === "speak" ? (
        <Pressable onPress={sayWelcome} style={styles.listenPrompt} accessibilityRole="button">
          <Volume2 size={16} color={colors.forest} />
          <Text style={[styles.listenText, { color: colors.forest }]}>{t(language, "listenToday")}</Text>
        </Pressable>
      ) : null}
      <Text style={[styles.savedCount, { color: colors.textMuted }]}>{documents.length} {documents.length === 1 ? t(language, "savedDocumentCount") : t(language, "savedDocumentsCount")}</Text>
    </BodhiniScreen>
  );
}

const styles = StyleSheet.create({
  page: { paddingTop: 10 },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 28 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  brand: { fontFamily: "serif", fontSize: 25, fontWeight: "700" },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 12 },
  settingsButton: { width: 42, height: 42, borderRadius: 15, alignItems: "center", justifyContent: "center", borderWidth: 1, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  themeToggle: { flexDirection: "row", gap: 6 },
  themeIcon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  themeIconActive: {},
  greetingRow: { flexDirection: "row", alignItems: "center", marginBottom: 19, gap: 12 },
  greeting: { fontFamily: "serif", fontSize: 25, lineHeight: 31, fontWeight: "600" },
  heroCard: { borderRadius: 24, overflow: "hidden", marginTop: 9, aspectRatio: 16 / 9, position: "relative" },
  heroImage: { width: "100%", height: "100%" },
  sky: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 1 },
  floatingCard: { position: "absolute", right: 16, bottom: 80, zIndex: 3 },
  mockCard: { width: 110, height: 70, borderRadius: 12, padding: 10, gap: 6, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  mockLine: { height: 10, borderRadius: 5 },
  mockCheck: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  heroOverlay: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 17, backgroundColor: "rgba(18,38,31,0.7)", zIndex: 2 },
  heroTitle: { color: "#FAF8F5", fontFamily: "serif", fontSize: 17, fontWeight: "700", textShadowColor: "rgba(0,0,0,.35)", textShadowRadius: 4 },
  privacyNote: { marginTop: 15, flexDirection: "row", alignItems: "center", gap: 9, paddingHorizontal: 12, paddingVertical: 11, borderRadius: 13 },
  privacyText: { fontSize: 11, flex: 1, lineHeight: 16 },
  listenPrompt: { marginTop: 12, flexDirection: "row", gap: 7, alignItems: "center", alignSelf: "center" },
  listenText: { fontSize: 12, fontWeight: "600" },
  savedCount: { textAlign: "center", fontSize: 11, marginTop: 14 },
});