import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Flower2, ArrowRight, Sun, Moon, Monitor } from "lucide-react-native";
import { Image } from "expo-image";
import { BodhiniScreen, PrimaryButton } from "../components/ui/BodhiniUI";
import { useBodhini } from "../state/AppContext";
import { t } from "../i18n/translations";
import { useTheme } from "../theme/ThemeProvider";
import { Cloud, FloatingCard, StaggeredReveal, Star } from "../components/motion";
import { Pressable } from "react-native";

export default function WelcomeScreen() {
  const router = useRouter();
  const { ready, onboardingComplete, language } = useBodhini();
  const { isDark, setMode, colors } = useTheme();

  useEffect(() => {
    if (ready && onboardingComplete) router.replace("/(tabs)");
  }, [ready, onboardingComplete, router]);

  return (
    <BodhiniScreen scroll={false} contentStyle={styles.page}>
      <View style={styles.top}>
        <View style={styles.lotus}><Flower2 size={52} color={colors.accent} strokeWidth={1.5} /></View>
        <StaggeredReveal staggerDelay={80} duration={240}>
          <Text style={[styles.brand, { color: colors.text }]}>Bodhini</Text>
          <Text style={[styles.tagline, { color: colors.text }]}>{t(language, "tagline")}</Text>
          <Text style={[styles.description, { color: colors.text }]}>{t(language, "description")}</Text>
        </StaggeredReveal>
      </View>
      <View style={styles.heroWrap}>
        <View style={styles.sky}>
          {isDark ? (
            <>
              <Star size={3} twinkleDuration={2500} delay={0} style={{ top: 40, left: 30 }} />
              <Star size={4} twinkleDuration={3000} delay={500} style={{ top: 80, left: 300 }} />
              <Star size={2} twinkleDuration={2800} delay={1000} style={{ top: 120, left: 150 }} />
              <Star size={3} twinkleDuration={3200} delay={1500} style={{ top: 60, left: 250 }} />
              <Star size={2} twinkleDuration={2200} delay={200} style={{ top: 160, left: 80 }} />
              <Star size={4} twinkleDuration={3500} delay={800} style={{ top: 20, left: 200 }} />
            </>
          ) : (
            <>
              <Cloud opacity={0.5} speed={25000} y={40} width={90} height={30} />
              <Cloud opacity={0.35} speed={35000} y={90} width={120} height={35} />
              <Cloud opacity={0.25} speed={45000} y={140} width={80} height={28} />
            </>
          )}
        </View>
        <Image source={require("../../assets/images/welcome-landscape.png")} style={styles.heroImage} contentFit="cover" transition={200} />
        <FloatingCard floatDuration={3500} rotateAmplitude={1.5} style={styles.floatingCard}>
          <View style={[styles.mockCard, { backgroundColor: colors.surface }]}>
            <View style={[styles.mockLine, { backgroundColor: colors.border }]} />
            <View style={[styles.mockLine, { backgroundColor: colors.border }]} />
            <View style={styles.mockCheck} />
          </View>
        </FloatingCard>
      </View>
      <View style={[styles.footer, { backgroundColor: `rgba(${isDark ? "22,24,21" : "250,248,245"},0.92)` }]}>
        <PrimaryButton title={t(language, "start")} icon={<ArrowRight size={18} color={colors.onPrimary} />} onPress={() => router.push("/(onboarding)/language")} />
        <Text style={[styles.languages, { color: colors.text }]}>Bengali  ·  Hindi  ·  English</Text>
        <View style={styles.themeRow}>
          <Pressable onPress={() => setMode("light")} style={[styles.themeBtn, !isDark && styles.themeBtnActive, { backgroundColor: !isDark ? colors.primary : colors.surfaceAlt, borderColor: !isDark ? colors.primary : colors.border }]} accessibilityRole="button" accessibilityLabel="Light">
            <Sun size={18} color={!isDark ? colors.onPrimary : colors.textMuted} />
          </Pressable>
          <Pressable onPress={() => setMode("dark")} style={[styles.themeBtn, isDark && styles.themeBtnActive, { backgroundColor: isDark ? colors.primary : colors.surfaceAlt, borderColor: isDark ? colors.primary : colors.border }]} accessibilityRole="button" accessibilityLabel="Dark">
            <Moon size={18} color={isDark ? colors.onPrimary : colors.textMuted} />
          </Pressable>
        </View>
      </View>
    </BodhiniScreen>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, paddingHorizontal: 0, paddingTop: 10, paddingBottom: 10, justifyContent: "space-between", overflow: "hidden" },
  top: { alignItems: "center", paddingTop: 26, zIndex: 2 },
  lotus: { width: 76, height: 65, alignItems: "center", justifyContent: "center", marginBottom: 2 },
  brand: { fontFamily: "serif", fontSize: 49, lineHeight: 58, fontWeight: "700", letterSpacing: -1.8 },
  tagline: { textAlign: "center", fontFamily: "serif", fontSize: 21, lineHeight: 27, marginTop: 3 },
  description: { textAlign: "center", fontFamily: "serif", fontSize: 14, lineHeight: 20, marginTop: 20 },
  heroWrap: { flex: 1, marginTop: -3, marginHorizontal: 0, position: "relative" },
  sky: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 1 },
  heroImage: { width: "100%", height: "100%", aspectRatio: 16 / 9 },
  floatingCard: { position: "absolute", right: 20, bottom: 120, zIndex: 3 },
  mockCard: { width: 110, height: 70, borderRadius: 12, padding: 10, gap: 6, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  mockLine: { height: 10, borderRadius: 5 },
  mockCheck: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  footer: { paddingHorizontal: 25, paddingTop: 10, paddingBottom: 6, borderTopWidth: 1 },
  languages: { textAlign: "center", fontFamily: "serif", fontSize: 13, marginTop: 14 },
  themeRow: { flexDirection: "row", justifyContent: "center", gap: 12, marginTop: 10 },
  themeBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  themeBtnActive: {},
});