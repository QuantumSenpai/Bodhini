import React, { useCallback, useMemo } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { ChevronRight, FileText, Layers, Scan, Sparkles, UserRound, Volume2 } from "lucide-react-native";
import {
  BodhiniScreen,
  EmptyStateIllustration,
  IdBadgeIcon,
  documentTypeLabel,
  getDocumentCardPalette,
  getDocumentSubtitle,
} from "../../components/ui/BodhiniUI";
import { useBodhini } from "../../state/AppContext";
import { t, type TranslationKey } from "../../i18n/translations";
import { useTheme } from "../../theme/ThemeProvider";
import { services } from "../../composition/services";
import { FadeInUp, Hint, PressableScale, Shimmer } from "../../components/motion";

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
  } = useBodhini();
  const { colors, theme } = useTheme();

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
        <Text style={[styles.brand, { color: colors.text, fontSize: theme.typeScale.h2.fontSize }]}>
          {t(language, "brandName")}
        </Text>
        <Hint hint={t(language, "hintAvatar")} label={t(language, "openProfileSettings")}>
          <PressableScale
            onPress={() => router.push("/(tabs)/profile")}
            accessibilityRole="button"
            accessibilityLabel={t(language, "openProfileSettings")}
            style={[styles.avatarHit, { backgroundColor: colors.surface, borderColor: colors.separator }]}
          >
            <UserRound size={20} color={colors.text} />
          </PressableScale>
        </Hint>
      </View>

      <FadeInUp index={0}>
        <View style={styles.greetingBlock}>
          {hasName ? (
            <>
              <Text style={[styles.greetingLead, { color: colors.text, fontSize: theme.typeScale.h3.fontSize }]}>
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
            <>
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
              <Text style={[styles.greetingSub, { color: colors.secondaryText, fontSize: theme.typeScale.caption.fontSize }]}>
                {t(language, "homePrompt")}
              </Text>
            </>
          )}
        </View>
      </FadeInUp>

      <FadeInUp index={1}>
        {documentsLoading && documents.length === 0 ? (
          <Shimmer height={176} borderRadius={20} style={styles.stackSpacer} />
        ) : frontDoc && frontPalette ? (
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
        ) : (
          <Hint hint={t(language, "hintQuickScan")} label={t(language, "scan")}>
            <PressableScale
              onPress={() => router.push("/scan/camera")}
              accessibilityRole="button"
              accessibilityLabel={`${t(language, "noDocuments")}, ${t(language, "scan")}`}
              style={[
                styles.emptyStackCard,
                { backgroundColor: colors.surface, borderColor: colors.separator },
              ]}
            >
              <EmptyStateIllustration />
              <View style={styles.emptyStackText}>
                <Text style={[styles.emptyStackTitle, { color: colors.text, fontSize: theme.typeScale.bodyStrong.fontSize }]}>
                  {t(language, "noDocuments")}
                </Text>
                <Text style={[styles.emptyStackSub, { color: colors.secondaryText, fontSize: theme.typeScale.caption.fontSize }]}>
                  {t(language, "scanFirst")}
                </Text>
              </View>
              <ChevronRight size={20} color={colors.primary} />
            </PressableScale>
          </Hint>
        )}
      </FadeInUp>

      <View style={styles.gridWrap}>
        <View style={styles.gridRow}>
          <FadeInUp index={2} style={styles.gridCol}>
            <Hint hint={t(language, "hintQuickScan")} label={t(language, "scan")}>
              <PressableScale
                onPress={() => router.push("/scan/camera")}
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

          <FadeInUp index={3} style={styles.gridCol}>
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
          <FadeInUp index={4} style={styles.gridCol}>
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

          <FadeInUp index={5} style={styles.gridCol}>
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
        <FadeInUp index={6}>
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
  },
  brand: {
    fontWeight: "700",
    letterSpacing: -0.4,
  },
  avatarHit: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  greetingBlock: {
    marginBottom: 20,
    gap: 2,
  },
  greetingLead: {
    fontWeight: "500",
  },
  greetingName: {
    fontWeight: "700",
    letterSpacing: -0.4,
  },
  greetingSub: {
    marginTop: 4,
  },
  stackSpacer: {
    marginBottom: 24,
  },
  stackContainer: {
    height: 184,
    marginBottom: 20,
    position: "relative",
  },
  stackCardBack: {
    position: "absolute",
    top: 0,
    left: 28,
    right: 0,
    height: 140,
    borderRadius: 20,
  },
  stackCardMid: {
    position: "absolute",
    top: 12,
    left: 14,
    right: 10,
    height: 146,
    borderRadius: 20,
  },
  stackCardFront: {
    marginTop: 24,
    marginRight: 20,
    minHeight: 156,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 18,
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
    gap: 6,
  },
  cardTitle: {
    fontWeight: "600",
  },
  cardNumber: {
    fontWeight: "500",
    letterSpacing: 0.6,
  },
  emptyStackCard: {
    minHeight: 132,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 20,
  },
  emptyStackText: {
    flex: 1,
    gap: 4,
  },
  emptyStackTitle: {
    fontWeight: "600",
  },
  emptyStackSub: {
    lineHeight: 18,
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
    gap: 2,
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
