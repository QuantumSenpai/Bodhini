import React, { useCallback, useMemo } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import {
  AlertCircle,
  Camera,
  CheckSquare,
  ChevronRight,
  Clipboard,
  FileText,
  Image as ImageIcon,
  Info,
  Sparkles,
} from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { ActionCard, BodhiniScreen, PageHeading, PrimaryButton, SecondaryButton } from "../../components/ui/BodhiniUI";
import { useBodhini } from "../../state/AppContext";
import { t, type TranslationKey } from "../../i18n/translations";
import { FadeInUp, Hint, PressableScale } from "../../components/motion";
import { useTheme } from "../../theme/ThemeProvider";
import { CONFIDENCE_THRESHOLD } from "../../domain/constants";

interface FormOption {
  id: string;
  labelKey: TranslationKey;
  subtitleKey: TranslationKey;
  icon: React.ReactNode;
  tint: string;
  source: "camera" | "gallery" | null;
  kind: "PAPER_PHOTO" | "SCREENSHOT" | null;
}

export default function FormSourceScreen() {
  const router = useRouter();
  const { language, setPendingFormInput, filledFields, pendingFormInput, openComingSoon } = useBodhini();
  const { colors, theme } = useTheme();

  const counts = useMemo(() => {
    const matched = filledFields.filter((f) => f.status === "FILLED" && f.confidence >= CONFIDENCE_THRESHOLD).length;
    const needsReview = filledFields.filter(
      (f) => (f.status === "FILLED" && f.confidence < CONFIDENCE_THRESHOLD) || f.status === "SKIPPED",
    ).length;
    const missing = filledFields.filter((f) => f.status === "NEEDS_USER").length;
    return { matched, needsReview, missing };
  }, [filledFields]);

  const chooseImage = useCallback(async (source: "camera" | "gallery", kind: "PAPER_PHOTO" | "SCREENSHOT") => {
    try {
      const permission =
        source === "camera"
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(t(language, "permissionRequired"), t(language, "photoAccessText"));
        return;
      }
      const result =
        source === "camera"
          ? await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 1 })
          : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 1 });
      if (result.canceled || !result.assets[0]?.uri) return;
      setPendingFormInput({ kind, uri: result.assets[0].uri });
      router.push("/forms/analyzing");
    } catch {
      Alert.alert(t(language, "imageSourceUnavailable"), t(language, "galleryFailed"));
    }
  }, [language, router, setPendingFormInput]);

  const startSampleForm = useCallback(() => {
    setPendingFormInput({ kind: "SAMPLE", sampleId: "sample" });
    router.push("/forms/analyzing");
  }, [router, setPendingFormInput]);

  const formOptions: FormOption[] = useMemo(() => [
    {
      id: "sample",
      labelKey: "sampleForm",
      subtitleKey: "sampleFormSub",
      icon: <Clipboard size={22} color={colors.onPrimary} />,
      tint: colors.primary,
      source: null,
      kind: null,
    },
    {
      id: "camera",
      labelKey: "takePhoto",
      subtitleKey: "paperForm",
      icon: <Camera size={22} color={colors.onPrimary} />,
      tint: colors.info,
      source: "camera",
      kind: "PAPER_PHOTO",
    },
    {
      id: "gallery",
      labelKey: "selectImage",
      subtitleKey: "fromGallery",
      icon: <ImageIcon size={22} color={colors.onPrimary} />,
      tint: colors.success,
      source: "gallery",
      kind: "SCREENSHOT",
    },
    {
      id: "pdf",
      labelKey: "uploadPdf",
      subtitleKey: "pdfUnavailable",
      icon: <FileText size={22} color={colors.onPrimary} />,
      tint: colors.pdfBadge,
      source: null,
      kind: null,
    },
  ], [colors]);

  const handleOptionPress = useCallback((option: FormOption) => {
    if (option.source === "camera" || option.source === "gallery") {
      chooseImage(option.source, option.kind!);
    } else if (option.id === "pdf") {
      openComingSoon(t(language, "uploadPdf"));
    } else if (option.id === "sample") {
      startSampleForm();
    }
  }, [chooseImage, language, openComingSoon, startSampleForm]);

  const activeFileName = pendingFormInput?.kind === "SAMPLE"
    ? `${t(language, "sampleFormFile")}.pdf`
    : `${t(language, "scannedFormFile")}.jpg`;

  return (
    <BodhiniScreen inTabs contentStyle={styles.page}>
      <PageHeading title={t(language, "formTitle")} subtitle={t(language, "formIntro")} />

      {filledFields.length > 0 ? (
        <FadeInUp index={0}>
          <View style={styles.activeSummaryWrap}>
            <Hint hint={t(language, "reviewAnswers")} label={activeFileName}>
              <PressableScale
                onPress={() => router.push("/forms/review")}
                accessibilityRole="button"
                accessibilityLabel={activeFileName}
                style={[styles.fileCard, { backgroundColor: colors.surface, borderColor: colors.separator }]}
              >
                <View style={[styles.pdfIconBox, { backgroundColor: colors.pdfBadge }]}>
                  <Text style={[styles.pdfIconText, { color: colors.onPrimary }]}>PDF</Text>
                </View>
                <View style={styles.fileCardInfo}>
                  <Text numberOfLines={1} style={[styles.fileName, { color: colors.text, fontSize: theme.typeScale.bodyStrong.fontSize }]}>
                    {activeFileName}
                  </Text>
                  <Text style={[styles.fileSub, { color: colors.secondaryText, fontSize: theme.typeScale.caption.fontSize }]}>
                    {filledFields.length} {t(language, "fieldsDetected")}
                  </Text>
                </View>
                <ChevronRight size={20} color={colors.secondaryText} />
              </PressableScale>
            </Hint>

            <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.separator }]}>
              <View style={[styles.summaryRow, { borderBottomColor: colors.separator }]}>
                <CheckSquare size={20} color={colors.success} />
                <Text style={[styles.summaryLabel, { color: colors.text, fontSize: theme.typeScale.body.fontSize }]}>
                  {t(language, "matched")}
                </Text>
                <Text style={[styles.summaryCount, { color: colors.text, fontSize: theme.typeScale.bodyStrong.fontSize }]}>
                  {counts.matched}
                </Text>
              </View>
              <View style={[styles.summaryRow, { borderBottomColor: colors.separator }]}>
                <AlertCircle size={20} color={colors.warning} />
                <Text style={[styles.summaryLabel, { color: colors.text, fontSize: theme.typeScale.body.fontSize }]}>
                  {t(language, "needsReview")}
                </Text>
                <Text style={[styles.summaryCount, { color: colors.text, fontSize: theme.typeScale.bodyStrong.fontSize }]}>
                  {counts.needsReview}
                </Text>
              </View>
              <View style={[styles.summaryRow, styles.summaryRowLast]}>
                <Info size={20} color={colors.secondaryText} />
                <Text style={[styles.summaryLabel, { color: colors.text, fontSize: theme.typeScale.body.fontSize }]}>
                  {t(language, "missing")}
                </Text>
                <Text style={[styles.summaryCount, { color: colors.text, fontSize: theme.typeScale.bodyStrong.fontSize }]}>
                  {counts.missing}
                </Text>
              </View>
            </View>

            <View style={styles.summaryButtons}>
              <PrimaryButton
                title={t(language, "reviewAnswers")}
                onPress={() => router.push("/forms/review")}
                hint={t(language, "reviewAnswers")}
              />
              <SecondaryButton
                title={t(language, "fillWithAi")}
                onPress={() => openComingSoon(t(language, "fillWithAi"))}
                hint={t(language, "comingSoonMessage")}
              />
            </View>
          </View>
        </FadeInUp>
      ) : null}

      <View style={styles.optionsList}>
        {formOptions.map((option, index) => (
          <FadeInUp key={option.id} index={index + 1}>
            <ActionCard
              title={t(language, option.labelKey)}
              subtitle={t(language, option.subtitleKey)}
              icon={option.icon}
              tint={option.tint}
              onPress={() => handleOptionPress(option)}
              hint={t(language, option.subtitleKey)}
            />
          </FadeInUp>
        ))}
      </View>

      {filledFields.length === 0 ? (
        <FadeInUp index={5}>
          <Hint hint={t(language, "comingSoonMessage")} label={t(language, "fillWithAi")}>
            <PressableScale
              onPress={() => openComingSoon(t(language, "fillWithAi"))}
              accessibilityRole="button"
              accessibilityLabel={`${t(language, "fillWithAi")}, ${t(language, "comingSoonBadge")}`}
              style={[styles.aiCtaButton, { backgroundColor: colors.primary }]}
            >
              <Sparkles size={18} color={colors.onPrimary} />
              <Text style={[styles.aiCtaText, { color: colors.onPrimary, fontSize: theme.typeScale.button.fontSize }]}>
                {t(language, "fillWithAi")}
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
  activeSummaryWrap: {
    gap: 12,
    marginBottom: 20,
  },
  fileCard: {
    minHeight: 72,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  pdfIconBox: {
    width: 42,
    height: 48,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  pdfIconText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  fileCardInfo: {
    flex: 1,
    gap: 2,
  },
  fileName: {
    fontWeight: "600",
  },
  fileSub: {},
  summaryCard: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  summaryRow: {
    minHeight: 54,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  summaryRowLast: {
    borderBottomWidth: 0,
  },
  summaryLabel: {
    flex: 1,
    fontWeight: "500",
  },
  summaryCount: {
    fontWeight: "700",
  },
  summaryButtons: {
    gap: 10,
  },
  optionsList: {
    marginTop: 4,
  },
  aiCtaButton: {
    minHeight: 54,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
  },
  aiCtaText: {
    fontWeight: "600",
  },
});
