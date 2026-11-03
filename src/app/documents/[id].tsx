import React, { useCallback, useEffect, useRef, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Cloud,
  Copy,
  Eye,
  EyeOff,
  FileText,
  Folder,
  Share2,
  Trash2,
} from "lucide-react-native";
import { Image } from "expo-image";
import * as FileSystem from "expo-file-system/legacy";
import {
  BodhiniScreen,
  EmptyState,
  IdBadgeIcon,
  TopBar,
  getDocumentCardPalette,
  getDocumentSubtitle,
} from "../../components/ui/BodhiniUI";
import { services } from "../../composition/services";
import type { DocumentRecord } from "../../domain/document/document.types";
import { FieldValidator } from "../../infrastructure/validation/field-validator";
import { useBodhini } from "../../state/AppContext";
import { documentTypeLabel, fieldKeyLabel, t } from "../../i18n/translations";
import { FadeInUp, Hint, PressableScale, Shimmer } from "../../components/motion";
import { useTheme } from "../../theme/ThemeProvider";
import { clipboardService } from "../../infrastructure/export/clipboardService";
import { displayValue } from "../../infrastructure/export/fieldDisplay";

export default function DocumentDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { refreshDocuments, language, openComingSoon, showToast } = useBodhini();
  const { colors, theme } = useTheme();
  const [record, setRecord] = useState<DocumentRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [reveal, setReveal] = useState(false);
  const [detailsExpanded, setDetailsExpanded] = useState(true);
  const [revealFieldId, setRevealFieldId] = useState<string | null>(null);
  const [copiedFieldId, setCopiedFieldId] = useState<string | null>(null);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const found = await services.documentRepository.getById(id);
      setRecord(found);
    } catch {
      Alert.alert(t(language, "couldNotLoad"), t(language, "pleaseTryAgain"));
    } finally {
      setLoading(false);
    }
  }, [id, language]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    return () => {
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    };
  }, []);

  const deleteRecord = useCallback(() => {
    if (!id) return;
    Alert.alert(t(language, "deleteDocument"), t(language, "deleteDocumentText"), [
      { text: t(language, "cancel"), style: "cancel" },
      {
        text: t(language, "delete"),
        style: "destructive",
        onPress: async () => {
          try {
            await services.documentRepository.delete(id);
            if (record?.imageUri) {
              await FileSystem.deleteAsync(record.imageUri, { idempotent: true }).catch(() => undefined);
            }
            await refreshDocuments();
            showToast(t(language, "delete"));
            router.replace("/(tabs)/documents");
          } catch {
            Alert.alert(t(language, "deleteFailed"), t(language, "pleaseTryAgain"));
          }
        },
      },
    ]);
  }, [id, language, record?.imageUri, refreshDocuments, router, showToast]);

  if (loading) {
    return (
      <BodhiniScreen contentStyle={styles.page}>
        <TopBar onBack={() => router.back()} />
        <Shimmer height={164} borderRadius={20} style={styles.shimmerGap} />
        <Shimmer height={60} borderRadius={16} style={styles.shimmerGap} />
        <Shimmer height={60} borderRadius={16} style={styles.shimmerGap} />
      </BodhiniScreen>
    );
  }

  if (!record) {
    return (
      <BodhiniScreen contentStyle={styles.page}>
        <TopBar onBack={() => router.back()} />
        <EmptyState
          icon={<Folder size={30} color={colors.primary} />}
          title={t(language, "documentNotFound")}
          subtitle={t(language, "removedFromDevice")}
          actionTitle={t(language, "walletTitle")}
          onAction={() => router.replace("/(tabs)/documents")}
        />
      </BodhiniScreen>
    );
  }

  const docTitle = documentTypeLabel(language, record.type);
  const palette = getDocumentCardPalette(record.type, colors);
  const cardBg = palette.isColored ? palette.bg : colors.cardAadhaar;
  const headerNumber = getDocumentSubtitle(record, reveal, t(language, "savedLocally"));
  const hasAadhaar = record.fields.some((f) => f.key === "AADHAAR_NO");

  return (
    <BodhiniScreen contentStyle={styles.page}>
      <TopBar title={docTitle} onBack={() => router.back()} />

      <FadeInUp index={0}>
        <View style={[styles.heroCard, { backgroundColor: cardBg }]}>
          <View style={styles.heroIconRow}>
            <IdBadgeIcon color={colors.white} size={26} />
            {hasAadhaar ? (
              <Hint
                hint={t(language, "hintRevealAadhaar")}
                label={reveal ? t(language, "hideAadhaar") : t(language, "revealAadhaar")}
              >
                <PressableScale
                  onPress={() => setReveal((v) => !v)}
                  accessibilityRole="button"
                  accessibilityLabel={reveal ? t(language, "hideAadhaar") : t(language, "revealAadhaar")}
                  style={[styles.eyeBtn, { backgroundColor: colors.cameraControl }]}
                >
                  {reveal ? (
                    <EyeOff size={18} color={colors.white} />
                  ) : (
                    <Eye size={18} color={colors.white} />
                  )}
                </PressableScale>
              </Hint>
            ) : null}
          </View>
          <View style={styles.heroTextWrap}>
            <Text style={[styles.heroTitle, { color: colors.white, fontSize: theme.typeScale.h2.fontSize }]}>
              {docTitle}
            </Text>
            <Text style={[styles.heroNumber, { color: colors.white, fontSize: theme.typeScale.body.fontSize }]}>
              {headerNumber}
            </Text>
          </View>
        </View>
      </FadeInUp>

      <FadeInUp index={1}>
        <View style={[styles.menuCard, { backgroundColor: colors.surface, borderColor: colors.separator }]}>
          <Hint hint={t(language, "viewExtractedDetails")} label={t(language, "viewExtractedDetails")}>
            <PressableScale
              onPress={() => setDetailsExpanded((v) => !v)}
              accessibilityRole="button"
              accessibilityLabel={t(language, "viewExtractedDetails")}
              style={[styles.menuRow, { borderBottomColor: colors.separator }]}
            >
              <Folder size={20} color={colors.text} />
              <Text style={[styles.menuRowText, { color: colors.text, fontSize: theme.typeScale.body.fontSize }]}>
                {t(language, "viewExtractedDetails")}
              </Text>
              {detailsExpanded ? (
                <ChevronUp size={20} color={colors.secondaryText} />
              ) : (
                <ChevronDown size={20} color={colors.secondaryText} />
              )}
            </PressableScale>
          </Hint>

          {detailsExpanded ? (
            <View style={[styles.detailsPanel, { backgroundColor: colors.background, borderBottomColor: colors.separator }]}>
              {record.imageUri ? (
                <Image
                  source={{ uri: record.imageUri }}
                  style={[styles.docPreviewImage, { backgroundColor: colors.surfaceAlt }]}
                  contentFit="cover"
                  transition={150}
                  accessibilityLabel={t(language, "imageAltDocument")}
                />
              ) : null}
              {record.fields.map((field) => {
                const isAadhaarField = field.key === "AADHAAR_NO";
                const revealThis = revealFieldId === field.id;
                const shownValue = isAadhaarField ? displayValue("AADHAAR_NO", field.value, revealThis) : field.value;
                const labelText = fieldKeyLabel(language, field.key, field.label);
                const isCopied = copiedFieldId === field.id;

                const handleCopy = async () => {
                  const sensitive = await clipboardService.copy(isAadhaarField ? "AADHAAR_NO" : "OTHER", field.value);
                  setCopiedFieldId(field.id);
                  if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
                  copiedTimerRef.current = setTimeout(() => {
                    setCopiedFieldId(null);
                  }, 1500);
                  // Toast is handled by clipboardService? No, we need to show toast here
                };

                return (
                  <View key={field.id} style={[styles.detailRow, { borderBottomColor: colors.separator }]}>
                    <View style={styles.detailTextGroup}>
                      <Text style={[styles.detailLabel, { color: colors.secondaryText, fontSize: theme.typeScale.label.fontSize }]}>
                        {labelText}
                      </Text>
                      <Text style={[styles.detailValue, { color: colors.text, fontSize: theme.typeScale.bodyStrong.fontSize }]}>
                        {shownValue}
                      </Text>
                    </View>
                    <View style={styles.fieldRightIcons}>
                      {isAadhaarField ? (
                        <Hint
                          hint={t(language, "hintRevealAadhaar")}
                          label={revealThis ? t(language, "hideValue") : t(language, "showValue")}
                        >
                          <PressableScale
                            onPress={() => setRevealFieldId(revealThis ? null : field.id)}
                            accessibilityRole="button"
                            accessibilityLabel={revealThis ? t(language, "hideValue") : t(language, "showValue")}
                            style={styles.eyeHit}
                          >
                            {revealThis ? (
                              <EyeOff size={20} color={colors.secondaryText} />
                            ) : (
                              <Eye size={20} color={colors.secondaryText} />
                            )}
                          </PressableScale>
                        </Hint>
                      ) : null}
                      <Hint
                        hint={t(language, "hintCopyField")}
                        label={isCopied ? t(language, "copied") : t(language, "copyField")}
                      >
                        <PressableScale
                          onPress={async () => {
                            const sensitive = await clipboardService.copy(isAadhaarField ? "AADHAAR_NO" : "OTHER", field.value);
                            setCopiedFieldId(field.id);
                            if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
                            copiedTimerRef.current = setTimeout(() => {
                              setCopiedFieldId(null);
                            }, 1500);
                          }}
                          accessibilityRole="button"
                          accessibilityLabel={isCopied ? t(language, "copied") : t(language, "copyField")}
                          style={[
                            styles.rowCopyBtn,
                            { backgroundColor: isCopied ? colors.successLight : colors.forestLight },
                          ]}
                        >
                          {isCopied ? (
                            <Check size={14} color={colors.success} strokeWidth={2.5} />
                          ) : (
                            <Copy size={14} color={colors.forest} />
                          )}
                          <Text
                            style={[
                              styles.rowCopyText,
                              { color: isCopied ? colors.success : colors.forest, fontSize: theme.typeScale.label.fontSize },
                            ]}
                          >
                            {isCopied ? t(language, "copied") : t(language, "copyField")}
                          </Text>
                        </PressableScale>
                      </Hint>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : null}

          <Hint hint={t(language, "hintQuickFill")} label={t(language, "useInForm")}>
            <PressableScale
              onPress={() => router.push("/(tabs)/forms")}
              accessibilityRole="button"
              accessibilityLabel={t(language, "useInForm")}
              style={[styles.menuRow, { borderBottomColor: colors.separator }]}
            >
              <FileText size={20} color={colors.text} />
              <Text style={[styles.menuRowText, { color: colors.text, fontSize: theme.typeScale.body.fontSize }]}>
                {t(language, "useInForm")}
              </Text>
              <ChevronRight size={20} color={colors.secondaryText} />
            </PressableScale>
          </Hint>

          <Hint hint={t(language, "comingSoonMessage")} label={t(language, "shareDocument")}>
            <PressableScale
              onPress={() => openComingSoon(t(language, "shareDocument"))}
              accessibilityRole="button"
              accessibilityLabel={`${t(language, "shareDocument")}, ${t(language, "comingSoonBadge")}`}
              style={[styles.menuRow, { borderBottomColor: colors.separator }]}
            >
              <Share2 size={20} color={colors.text} />
              <Text style={[styles.menuRowText, { color: colors.text, fontSize: theme.typeScale.body.fontSize }]}>
                {t(language, "shareDocument")}
              </Text>
              <ChevronRight size={20} color={colors.secondaryText} />
            </PressableScale>
          </Hint>

          <Hint hint={t(language, "comingSoonMessage")} label={t(language, "backUpToCloud")}>
            <PressableScale
              onPress={() => openComingSoon(t(language, "backUpToCloud"))}
              accessibilityRole="button"
              accessibilityLabel={`${t(language, "backUpToCloud")}, ${t(language, "statusOff")}`}
              style={[styles.menuRow, styles.menuRowLast]}
            >
              <Cloud size={20} color={colors.text} />
              <Text style={[styles.menuRowText, { color: colors.text, fontSize: theme.typeScale.body.fontSize }]}>
                {t(language, "backUpToCloud")}
              </Text>
              <Text style={[styles.menuStatusOff, { color: colors.secondaryText, fontSize: theme.typeScale.caption.fontSize }]}>
                {t(language, "statusOff")}
              </Text>
            </PressableScale>
          </Hint>
        </View>
      </FadeInUp>

      <FadeInUp index={2}>
        <Hint hint={t(language, "hintDeleteDoc")} label={t(language, "removeFromWallet")}>
          <PressableScale
            onPress={deleteRecord}
            accessibilityRole="button"
            accessibilityLabel={t(language, "removeFromWallet")}
            style={styles.removeRow}
          >
            <Trash2 size={20} color={colors.danger} />
            <Text style={[styles.removeText, { color: colors.danger, fontSize: theme.typeScale.bodyStrong.fontSize }]}>
              {t(language, "removeFromWallet")}
            </Text>
          </PressableScale>
        </Hint>
      </FadeInUp>
    </BodhiniScreen>
  );
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 4,
  },
  shimmerGap: {
    marginBottom: 14,
  },
  heroCard: {
    minHeight: 164,
    borderRadius: 20,
    padding: 22,
    justifyContent: "space-between",
    marginBottom: 20,
  },
  heroIconRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  eyeBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  heroTextWrap: {
    gap: 8,
    marginTop: 24,
  },
  heroTitle: {
    fontWeight: "600",
  },
  heroNumber: {
    fontWeight: "500",
    letterSpacing: 0.8,
  },
  menuCard: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    marginBottom: 20,
  },
  menuRow: {
    minHeight: 58,
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  menuRowLast: {
    borderBottomWidth: 0,
  },
  menuRowText: {
    flex: 1,
    fontWeight: "500",
  },
  menuStatusOff: {
    fontWeight: "500",
  },
  detailsPanel: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 4,
  },
  docPreviewImage: {
    width: "100%",
    aspectRatio: 16 / 10,
    borderRadius: 12,
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  detailTextGroup: {
    flex: 1,
    gap: 3,
  },
  detailLabel: {
    fontWeight: "500",
  },
  detailValue: {
    fontWeight: "600",
  },
  inlineEyeHit: {
    width: 48,
    height: 48,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  fieldRightIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  eyeHit: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  rowCopyBtn: {
    minHeight: 48,
    paddingHorizontal: 12,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  rowCopyText: {
    fontWeight: "700",
  },
  removeRow: {
    minHeight: 54,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  removeText: {
    fontWeight: "600",
  },
});
