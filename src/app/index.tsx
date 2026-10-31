import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Flower2, ArrowRight } from "lucide-react-native";
import { Image } from "expo-image";
import { BodhiniScreen, PrimaryButton } from "../components/ui/BodhiniUI";
import { useBodhini } from "../state/AppContext";
import { colors } from "../theme/tokens";
import { t } from "../i18n/translations";

export default function WelcomeScreen() {
  const router = useRouter();
  const { ready, onboardingComplete, language } = useBodhini();

  useEffect(() => {
    if (ready && onboardingComplete) router.replace("/(tabs)");
  }, [ready, onboardingComplete, router]);

  return <BodhiniScreen scroll={false} contentStyle={styles.page}>
    <View style={styles.top}>
      <View style={styles.lotus}><Flower2 size={52} color={colors.gold} strokeWidth={1.5} /></View>
      <Text style={styles.brand}>Bodhini</Text>
      <Text style={styles.tagline}>{t(language, "tagline")}</Text>
      <Text style={styles.description}>{t(language, "description")}</Text>
    </View>
    <View style={styles.heroWrap}>
      <Image source={require("../../assets/images/welcome-landscape.png")} style={styles.heroImage} contentFit="cover" transition={200} />
    </View>
    <View style={styles.footer}>
      <PrimaryButton title={t(language, "start")} icon={<ArrowRight size={18} color={colors.white} />} onPress={() => router.push("/(onboarding)/language")} />
      <Text style={styles.languages}>Bengali  ·  Hindi  ·  English</Text>
    </View>
  </BodhiniScreen>;
}

const styles = StyleSheet.create({
  page: { flex: 1, paddingHorizontal: 0, paddingTop: 10, paddingBottom: 10, justifyContent: "space-between", overflow: "hidden" },
  top: { alignItems: "center", paddingTop: 26, zIndex: 2 },
  lotus: { width: 76, height: 65, alignItems: "center", justifyContent: "center", marginBottom: 2 },
  brand: { color: colors.ink, fontFamily: "serif", fontSize: 49, lineHeight: 58, fontWeight: "700", letterSpacing: -1.8 },
  tagline: { textAlign: "center", color: colors.ink, fontFamily: "serif", fontSize: 21, lineHeight: 27, marginTop: 3 },
  description: { textAlign: "center", color: colors.ink, fontFamily: "serif", fontSize: 14, lineHeight: 20, marginTop: 20 },
  heroWrap: { flex: 1, marginTop: -3, marginHorizontal: 0 },
  heroImage: { width: "100%", height: "100%", aspectRatio: 16 / 9 },
  footer: { paddingHorizontal: 25, paddingTop: 10, paddingBottom: 6, backgroundColor: "rgba(244,233,217,0.92)" },
  languages: { color: colors.ink, textAlign: "center", fontFamily: "serif", fontSize: 13, marginTop: 14 },
});
