import React, { useCallback, useMemo } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { useFocusEffect, useRouter } from "expo-router";
import {
  ChevronRight,
  FileText,
  Layers,
  Moon,
  Scan,
  Sparkles,
  Sun,
  UserRound,
  Volume2,
} from "lucide-react-native";
import {
  BodhiniLogoMark,
  BodhiniScreen,
  BrandBlock,
  IdBadgeIcon,
  WatermarkFooter,
  documentTypeLabel,
  getDocumentCardPalette,
  getDocumentSubtitle,
} from "../../components/ui/BodhiniUI";
import { useBodhini } from "../../state/AppContext";
import { t, type TranslationKey } from "../../i18n/translations";
import { useTheme } from "../../theme/ThemeProvider";
import { services } from "../../composition/services";
import {
  FadeInUp,
  HeroFloatCard,
  Hint,
  PressableScale,
  Shimmer,
} from "../../components/motion";

const heroLandscape = require("../../../assets/images/welcome-landscape.png");

function getGreetingKeys(hasName: boolean): { titleKey: TranslationKey } {
  const hour = new Date().getHours();
  if (hour < 12) {
    return { titleKey: hasName ? "greetingMorningComma" : "greetingMorning" };
  }
  if (hour < 17) {
    return { titleKey: hasName ? "greetingAfternoonComma" : "greetingAfternoon" };
  }
  return { titleKey: hasName ? "greetingEveningComma" : "greetingEvening" };
}

export default function HomeScreen() {
  const router = useRouter();
  const {
    language,
    documents,
    documentsLoading,
    refreshDocuments,
    profileName,
    interactionMode,
    openComingSoon,
    setThemeMode,
    setPendingFormInput,
  } = useBodhini();
  const { colors, theme, isDark } = useTheme();

  useFocusEffect(
    useCallback(() => {
      refreshDocuments().catch(() => undefined);
    }, [refreshDocuments]),
  );

  const trimmedName = profileName.trim();
  const hasName = trimmedName.length > 0;
  const { titleKey } = useMemo(() => getGreetingKeys(hasName), [hasName]);
  const latestThree = useMemo(() => documents.slice(0, 3), [documents]);
  const frontDoc = latestThree[0] ?? null;
  const secondDoc = latestThree[1] ?? null;
  const thirdDoc = latestThree[2] ?? null;

  const handleToggleTheme = useCallback(() => {
    setThemeMode(isDark ? "light" : "dark").catch(() => undefined);
  }, [isDark, setThemeMode]);

  const handleScanDocument = useCallback(() => {
    router.push("/scan/camera");
  }, [router]);

  const handleTrySampleForm = useCallback(() => {
    setPendingFormInput({ kind: "SAMPLE", sampleId: "sample" });
    router.push("/forms/analyzing");
  }, [router, setPendingFormInput]);

  const sayWelcome = useCallback(() => {
    services.voiceService
      .speak(t(language, "speakPrompt"), language)
      .catch(() => Alert.alert(t(language, "voiceUnavailable"), t(language, "ttsUnavailable")));
  }, [language]);

  const openDocument = useCallback((id: string) => {
    router.push({ pathname: "/documents/[id]", params: { id } });
  }, [router]);

  const frontPalette = frontDoc ? getDocumentCardPalette(frontDoc.type, colors) : null;
  const frontTitle = frontDoc ? documentTypeLabel(language, frontDoc.type) : "";
  const frontSubtitle = frontDoc ? getDocumentSubtitle(frontDoc, false, t(language, "savedLocally")) : "";

  return (
    <BodhiniScreen inTabs contentStyle={styles.page}>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <BrandBlock variant="compact" />
        </View>
        <View style={styles.headerActions}>
          <Hint hint={t(language, "hintThemeToggle")} label={t(language, "toggleThemeLabel")}>
            <PressableScale
              onPress={handleToggleTheme}
              accessibilityRole="button"
              accessibilityLabel={t(language, "toggleThemeLabel")}
              style={[styles.headerIconHit, { backgroundColor: colors.surface, borderColor: colors.separator }]}
            >
              {isDark ? (
                <Sun size={20} color={colors.text} />
              ) : (
                <Moon size={20} color={colors.text} />
              )}
            </PressableScale>
          </Hint>
          <Hint hint={t(language, "hintAvatar")} label={t(language, "openProfileSettings")}>
            <PressableScale
              onPress={() => router.push("/(tabs)/profile")}
              accessibilityRole="button"
              accessibilityLabel={t(language, "openProfileSettings")}
              style={[styles.headerIconHit, { backgroundColor: colors.surface, borderColor: colors.separator }]}
            >
              <UserRound size={20} color={colors.text} />
            </PressableScale>
          </Hint>
        </View>
      </View>

      <FadeInUp index={0}>
        <View style={styles.greetingBlock}>
          {hasName ? (
            <>
              <Text style={[styles.greetingLead, { color: colors.secondaryText, fontSize: theme.typeScale.body.fontSize }]}>
                {t(language, titleKey)}
              </Text>
              <Text
                numberOfLines={1}
                style={[
                  styles.greetingName,
                  {
                    color: colors.text,
                    fontSize: theme.typeScale.title.fontSize,
                    lineHeight: theme.typeScale.title.lineHeight,
                  },
                ]}
              >
                {trimmedName}
              </Text>
            </>
          ) : (
            <Text
              style={[
                styles.greetingName,
                {
                  color: colors.text,
                  fontSize: theme.typeScale.title.fontSize,
                  lineHeight: theme.typeScale.title.lineHeight,
                },
              ]}
            >
              {t(language, titleKey)}
            </Text>
          )}
        </View>
      </FadeInUp>

      <FadeInUp index={1}>
        <View style={styles.heroArea}>
          <View
            pointerEvents="none"
            style={[
              styles.heroLandscapeWrap,
              { backgroundColor: colors.heroBackdropTint, borderColor: colors.separator },
            ]}
          >
            <Image
              source={heroLandscape}
              contentFit="cover"
              style={styles.heroLandscapeImage}
              accessible={false}
            />
            <View
              style={[
                styles.heroLandscapeOverlay,
                { backgroundColor: colors.heroOverlay },
              ]}
            />
          </View>

          <View
            style={[
              styles.heroCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.separator,
              },
            ]}
          >
            <View style={styles.heroCardHeader}>
              <View style={styles.heroTextCol}>
                <Text
                  style={[
                    styles.heroHeadline,
                    {
                      color: colors.text,
                      fontSize: theme.typeScale.h2.fontSize,
                      lineHeight: theme.typeScale.h2.lineHeight,
                    },
                  ]}
                >
                  {t(language, "heroHeadline")}
                </Text>
                <Text
                  style={[
                    styles.heroSupporting,
                    {
                      color: colors.secondaryText,
                      fontSize: theme.typeScale.caption.fontSize,
                      lineHeight: theme.typeScale.caption.lineHeight,
                    },
                  ]}
                >
                  {t(language, "heroSupporting")}
                </Text>
              </View>
              <HeroFloatCard style={styles.heroMarkCardWrap}>
                <View
                  style={[
                    styles.heroMarkCard,
                    {
                      backgroundColor: colors.surfaceAlt,
                      borderColor: colors.separator,
                    },
                  ]}
                >
                  <BodhiniLogoMark width={32} height={43} />
                </View>
              </HeroFloatCard>
            </View>

            <View style={styles.heroPillsRow}>
              <Hint hint={t(language, "hintQuickScan")} label={t(language, "heroPrimaryCta")}>
                <PressableScale
                  onPress={handleScanDocument}
                  accessibilityRole="button"
                  accessibilityLabel={t(language, "heroPrimaryCta")}
                  style={[
                    styles.primaryPill,
                    { backgroundColor: colors.primary },
                  ]}
                >
                  <Scan size={18} color={colors.onPrimary} strokeWidth={2.2} />
                  <Text
                    style={[
                      styles.primaryPillText,
                      {
                        color: colors.onPrimary,
                        fontSize: theme.typeScale.captionStrong.fontSize,
                      },
                    ]}
                  >
                    {t(language, "heroPrimaryCta")}
                  </Text>
                </PressableScale>
              </Hint>

              <Hint hint={t(language, "hintQuickFill")} label={t(language, "heroSecondaryCta")}>
                <PressableScale
                  onPress={handleTrySampleForm}
                  accessibilityRole="button"
                  accessibilityLabel={t(language, "heroSecondaryCta")}
                  style={[
                    styles.ghostPill,
                    {
                      backgroundColor: colors.surfaceAlt,
                      borderColor: colors.separator,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.ghostPillText,
                      {
                        color: colors.text,
                        fontSize: theme.typeScale.captionStrong.fontSize,
                      },
                    ]}
                  >
                    {t(language, "heroSecondaryCta")}
                  </Text>
                </PressableScale>
              </Hint>
            </View>
          </View>
        </View>
      </FadeInUp>

      {documentsLoading && documents.length === 0 ? (
        <Shimmer height={160} borderRadius={20} style={styles.stackSpacer} />
      ) : frontDoc && frontPalette ? (
        <FadeInUp index={2}>
          <View style={styles.stackContainer}>
            <PressableScale
              onPress={() => openDocument((thirdDoc ?? frontDoc).id)}
              accessibilityRole="button"
              accessibilityLabel={thirdDoc ? documentTypeLabel(language, thirdDoc.type) : frontTitle}
              style={[
                styles.stackCardBack,
                { backgroundColor: colors.cardStackBack },
              ]}
            />
            <PressableScale
              onPress={() => openDocument((secondDoc ?? frontDoc).id)}
              accessibilityRole="button"
              accessibilityLabel={secondDoc ? documentTypeLabel(language, secondDoc.type) : frontTitle}
              style={[
                styles.stackCardMid,
                { backgroundColor: colors.cardStackMid },
              ]}
            />
            <Hint hint={t(language, "hintWalletCard")} label={`${frontTitle}, ${frontSubtitle}`}>
              <PressableScale
                onPress={() => openDocument(frontDoc.id)}
                accessibilityRole="button"
                accessibilityLabel={`${frontTitle}, ${frontSubtitle}`}
                style={[
                  styles.stackCardFront,
                  {
                    backgroundColor: frontPalette.isColored ? frontPalette.bg : colors.cardAadhaar,
                  },
                ]}
              >
                <View style={styles.cardTopIcon}>
                  <IdBadgeIcon color={colors.white} size={24} />
                </View>
                <View style={styles.cardBottomRow}>
                  <View style={styles.cardTitleGroup}>
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.cardTitle,
                        { color: colors.white, fontSize: theme.typeScale.h3.fontSize },
                      ]}
                    >
                      {frontTitle}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.cardNumber,
                        { color: colors.white, fontSize: theme.typeScale.body.fontSize },
                      ]}
                    >
                      {frontSubtitle}
                    </Text>
                  </View>
                  <ChevronRight size={22} color={colors.white} />
                </View>
              </PressableScale>
            </Hint>
          </View>
        </FadeInUp>
      ) : null}

      <View style={styles.gridWrap}>
        <View style={styles.gridRow}>
          <FadeInUp index={3} style={styles.gridCol}>
            <Hint hint={t(language, "hintQuickScan")} label={t(language, "scan")}>
              <PressableScale
                onPress={handleScanDocument}
                accessibilityRole="button"
                accessibilityLabel={t(language, "scan")}
                style={[
                  styles.quickCard,
                  { backgroundColor: colors.surface, borderColor: colors.separator },
                ]}
              >
                <View style={[styles.quickIconWrap, { backgroundColor: colors.surfaceAlt }]}>
                  <Scan size={22} color={colors.text} strokeWidth={2.1} />
                </View>
                <Text style={[styles.quickLabel, { color: colors.text, fontSize: theme.typeScale.captionStrong.fontSize }]}>
                  {t(language, "scan")}
                </Text>
              </PressableScale>
            </Hint>
          </FadeInUp>

          <FadeInUp index={4} style={styles.gridCol}>
            <Hint hint={t(language, "hintQuickFill")} label={t(language, "fill")}>
              <PressableScale
                onPress={() => router.push("/(tabs)/forms")}
                accessibilityRole="button"
                accessibilityLabel={t(language, "fill")}
                style={[
                  styles.quickCard,
                  { backgroundColor: colors.surface, borderColor: colors.separator },
                ]}
              >
                <View style={[styles.quickIconWrap, { backgroundColor: colors.surfaceAlt }]}>
                  <FileText size={22} color={colors.text} strokeWidth={2.1} />
                </View>
                <Text style={[styles.quickLabel, { color: colors.text, fontSize: theme.typeScale.captionStrong.fontSize }]}>
                  {t(language, "fill")}
                </Text>
              </PressableScale>
            </Hint>
          </FadeInUp>
        </View>

        <View style={styles.gridRow}>
          <FadeInUp index={5} style={styles.gridCol}>
            <Hint hint={t(language, "hintQuickWallet")} label={t(language, "locker")}>
              <PressableScale
                onPress={() => router.push("/(tabs)/documents")}
                accessibilityRole="button"
                accessibilityLabel={t(language, "locker")}
                style={[
                  styles.quickCard,
                  { backgroundColor: colors.surface, borderColor: colors.separator },
                ]}
              >
                <View style={[styles.quickIconWrap, { backgroundColor: colors.surfaceAlt }]}>
                  <Layers size={22} color={colors.text} strokeWidth={2.1} />
                </View>
                <Text style={[styles.quickLabel, { color: colors.text, fontSize: theme.typeScale.captionStrong.fontSize }]}>
                  {t(language, "locker")}
                </Text>
              </PressableScale>
            </Hint>
          </FadeInUp>

          <FadeInUp index={6} style={styles.gridCol}>
            <Hint hint={t(language, "hintQuickAi")} label={t(language, "aiAssistant")}>
              <PressableScale
                onPress={() => openComingSoon(t(language, "aiAssistant"))}
                accessibilityRole="button"
                accessibilityLabel={`${t(language, "aiAssistant")}, ${t(language, "aiAssistantSub")}`}
                style={[
                  styles.quickCard,
                  { backgroundColor: colors.surface, borderColor: colors.separator },
                ]}
              >
                <View style={[styles.quickIconWrap, { backgroundColor: colors.surfaceAlt }]}>
                  <Sparkles size={22} color={colors.text} strokeWidth={2.1} />
                </View>
                <View style={styles.quickTextGroup}>
                  <Text style={[styles.quickLabel, { color: colors.text, fontSize: theme.typeScale.captionStrong.fontSize }]}>
                    {t(language, "aiAssistant")}
                  </Text>
                </View>
              </PressableScale>
            </Hint>
          </FadeInUp>
        </View>
      </View>

      {interactionMode === "speak" ? (
        <FadeInUp index={7}>
          <Hint hint={t(language, "listenToday")} label={t(language, "listenToday")}>
            <PressableScale
              onPress={sayWelcome}
              accessibilityRole="button"
              accessibilityLabel={t(language, "listenToday")}
              style={[styles.listenBanner, { backgroundColor: colors.forestLight }]}
            >
              <Volume2 size={18} color={colors.forest} />
              <Text style={[styles.listenBannerText, { color: colors.forest, fontSize: theme.typeScale.captionStrong.fontSize }]}>
                {t(language, "listenToday")}
              </Text>
            </PressableScale>
          </Hint>
        </FadeInUp>
      ) : null}

      <WatermarkFooter />
    </BodhiniScreen>
  );
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 8,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    gap: 12,
  },
  headerLeft: {
    flex: 1,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerIconHit: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  greetingBlock: {
    marginBottom: 16,
    gap: 4,
  },
  greetingLead: {
    fontWeight: "500",
  },
  greetingName: {
    fontWeight: "700",
    letterSpacing: -0.4,
  },
  heroArea: {
    marginBottom: 24,
    paddingBottom: 24,
    position: "relative",
  },
  heroLandscapeWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    aspectRatio: 16 / 7,
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
  },
  heroLandscapeImage: {
    width: "100%",
    height: "100%",
  },
  heroLandscapeOverlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  heroCard: {
    borderRadius: 28,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 24,
    gap: 16,
  },
  heroCardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  heroTextCol: {
    flex: 1,
    gap: 8,
  },
  heroHeadline: {
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  heroSupporting: {
    fontWeight: "400",
  },
  heroMarkCardWrap: {
    paddingTop: 4,
  },
  heroMarkCard: {
    width: 56,
    height: 68,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  heroPillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 12,
  },
  primaryPill: {
    minHeight: 48,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryPillText: {
    fontWeight: "600",
  },
  ghostPill: {
    minHeight: 48,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  ghostPillText: {
    fontWeight: "600",
  },
  stackSpacer: {
    marginBottom: 24,
  },
  stackContainer: {
    height: 184,
    marginBottom: 24,
    position: "relative",
  },
  stackCardBack: {
    position: "absolute",
    top: 0,
    left: 24,
    right: 0,
    height: 136,
    borderRadius: 20,
  },
  stackCardMid: {
    position: "absolute",
    top: 12,
    left: 12,
    right: 12,
    height: 144,
    borderRadius: 20,
  },
  stackCardFront: {
    marginTop: 24,
    marginRight: 24,
    minHeight: 156,
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 16,
    justifyContent: "space-between",
  },
  cardTopIcon: {
    alignSelf: "flex-start",
  },
  cardBottomRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 24,
  },
  cardTitleGroup: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontWeight: "600",
  },
  cardNumber: {
    fontWeight: "500",
    letterSpacing: 0.6,
  },
  gridWrap: {
    gap: 12,
  },
  gridRow: {
    flexDirection: "row",
    gap: 12,
  },
  gridCol: {
    flex: 1,
  },
  quickCard: {
    minHeight: 112,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    justifyContent: "space-between",
  },
  quickIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  quickTextGroup: {
    gap: 4,
  },
  quickLabel: {
    fontWeight: "600",
    marginTop: 12,
  },
  listenBanner: {
    minHeight: 48,
    marginTop: 16,
    borderRadius: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  listenBannerText: {
    fontWeight: "600",
  },
});
