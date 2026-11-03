import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import {
  AlertCircle,
  Check,
  CheckSquare,
  ChevronRight,
  Copy,
  Eye,
  EyeOff,
  FileText,
  Info,
  ShieldCheck,
  Sparkles,
} from "lucide-react-native";
import {
  BodhiniScreen,
  EmptyState,
  PrimaryButton,
  SecondaryButton,
  StatusPill,
  TopBar,
} from "../../components/ui/BodhiniUI";
import { useBodhini } from "../../state/AppContext";
import type { FilledField } from "../../domain/form/form.types";
import { FieldValidator } from "../../infrastructure/validation/field-validator";
import { CONFIDENCE_THRESHOLD } from "../../domain/constants";
import { fieldKeyLabel, t } from "../../i18n/translations";
import { FadeInUp, Hint, PressableScale } from "../../components/motion";
import { useTheme } from "../../theme/ThemeProvider";
import { clipboardService } from "../../infrastructure/export/clipboardService";
import { displayValue } from "../../infrastructure/export/fieldDisplay";

function statusLabel(field: FilledField, language: "en" | "bn" | "hi"): string {
  if (field.status === "SKIPPED") return t(language, "skipped");
  if (field.status === "FILLED") {
    return field.confidence < CONFIDENCE_THRESHOLD ? t(language, "needsReview") : t(language, "detected");
  }
  return t(language, "needsInput");
}

export default function FormReviewScreen() {
  const router = useRouter();
  const { filledFields, setFilledFields, pendingFormInput, language, openComingSoon, showToast } = useBodhini();
  const { colors, theme } = useTheme();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [revealAadhaar, setRevealAadhaar] = useState(false);
  const [editingAadhaarId, setEditingAadhaarId] = useState<string | null>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  const counts = useMemo(() => {
    const matched = filledFields.filter((f) => f.status === "FILLED" && f.confidence >= CONFIDENCE_THRESHOLD).length;
    const needsReview = filledFields.filter(
      (f) => (f.status === "FILLED" && f.confidence < CONFIDENCE_THRESHOLD) || f.status === "SKIPPED",
    ).length;
    const missing = filledFields.filter((f) => f.status === "NEEDS_USER").length;
    return { matched, needsReview, missing };
  }, [filledFields]);

  const updateField = useCallback((id: string, value: string) => {
    setFilledFields((current) =>
      current.map((item) => {
        if (item.field.id !== id || item.status === "SKIPPED") return item;
        const trimmed = value.trim();
        return {
          ...item,
          value,
          status: trimmed ? "FILLED" : "NEEDS_USER",
          confidence: trimmed ? 1 : 0,
        };
      }),
    );
  }, [setFilledFields]);

  const copyValue = useCallback(async (field: FilledField) => {
    if (field.status !== "FILLED" || !field.value) return;
    try {
      const isAadhaar = field.matchedKey === "AADHAAR_NO";
      const isPan = field.matchedKey === "PAN_NO";
      const key = isAadhaar ? "AADHAAR_NO" : isPan ? "PAN_NO" : "OTHER";
      const sensitive = await clipboardService.copy(key, field.value);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      setCopiedId(field.field.id);
      showToast(sensitive ? t(language, "copiedSensitive") : t(language, "copied"));
      copyTimerRef.current = setTimeout(() => {
        setCopiedId(null);
      }, 1500);
    } catch {
      Alert.alert(t(language, "copyFailed"), t(language, "pleaseTryAgain"));
    }
  }, [language, showToast]);

  if (filledFields.length === 0) {
    return (
      <BodhiniScreen contentStyle={styles.page}>
        <TopBar title={t(language, "formTitle")} onBack={() => router.back()} />
        <EmptyState
          icon={<FileText size={30} color={colors.primary} />}
          title={t(language, "nothingToReview")}
          subtitle={t(language, "chooseAnotherSource")}
          actionTitle={t(language, "chooseAForm")}
          onAction={() => router.replace("/(tabs)/forms")}
        />
      </BodhiniScreen>
    );
  }

  const fileName =
    pendingFormInput?.kind === "SAMPLE"
      ? `${t(language, "sampleFormFile")}.pdf`
      : `${t(language, "scannedFormFile")}.jpg`;

  return (
    <BodhiniScreen contentStyle={styles.page}>
      <TopBar title={t(language, "reviewFilledForm")} onBack={() => router.back()} />

      <FadeInUp index={0}>
        <Hint hint={t(language, "chooseAnotherSource")} label={fileName}>
          <PressableScale
            onPress={() => router.push("/(tabs)/forms")}
            accessibilityRole="button"
            accessibilityLabel={fileName}
            style={[styles.fileCard, { backgroundColor: colors.surface, borderColor: colors.separator }]}
          >
            <View style={[styles.pdfBadge, { backgroundColor: colors.pdfBadge }]}>
              <Text style={[styles.pdfBadgeText, { color: colors.onPrimary }]}>PDF</Text>
            </View>
            <View style={styles.fileTextWrap}>
              <Text numberOfLines={1} style={[styles.fileName, { color: colors.text, fontSize: theme.typeScale.bodyStrong.fontSize }]}>
                {fileName}
              </Text>
              <Text style={[styles.fileMeta, { color: colors.secondaryText, fontSize: theme.typeScale.caption.fontSize }]}>
                {filledFields.length} {t(language, "fieldsDetected")}
              </Text>
            </View>
            <ChevronRight size={20} color={colors.secondaryText} />
          </PressableScale>
        </Hint>
      </FadeInUp>

      <FadeInUp index={1}>
        <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.separator }]}>
          <View style={[styles.summaryRow, { borderBottomColor: colors.separator }]}>
            <CheckSquare size={20} color={colors.success} />
            <Text style={[styles.summaryRowLabel, { color: colors.text, fontSize: theme.typeScale.body.fontSize }]}>
              {t(language, "matched")}
            </Text>
            <Text style={[styles.summaryRowCount, { color: colors.text, fontSize: theme.typeScale.bodyStrong.fontSize }]}>
              {counts.matched}
            </Text>
          </View>
          <View style={[styles.summaryRow, { borderBottomColor: colors.separator }]}>
            <AlertCircle size={20} color={colors.warning} />
            <Text style={[styles.summaryRowLabel, { color: colors.text, fontSize: theme.typeScale.body.fontSize }]}>
              {t(language, "needsReview")}
            </Text>
            <Text style={[styles.summaryRowCount, { color: colors.text, fontSize: theme.typeScale.bodyStrong.fontSize }]}>
              {counts.needsReview}
            </Text>
          </View>
          <View style={[styles.summaryRow, styles.summaryRowLast]}>
            <Info size={20} color={colors.secondaryText} />
            <Text style={[styles.summaryRowLabel, { color: colors.text, fontSize: theme.typeScale.body.fontSize }]}>
              {t(language, "missing")}
            </Text>
            <Text style={[styles.summaryRowCount, { color: colors.text, fontSize: theme.typeScale.bodyStrong.fontSize }]}>
              {counts.missing}
            </Text>
          </View>
        </View>
      </FadeInUp>

      <View style={styles.fieldsWrap}>
        {filledFields.map((item, index) => {
          const isSkipped = item.status === "SKIPPED";
          const isAadhaar = item.matchedKey === "AADHAAR_NO" || item.field.key === "AADHAAR_NO";
          const rawValue = item.value ?? "";
          const isEditingThisAadhaar = editingAadhaarId === item.field.id;
          const displayValue =
            isAadhaar && rawValue && !revealAadhaar && !isEditingThisAadhaar
              ? FieldValidator.maskAadhaar(rawValue)
              : rawValue;
          const isCopied = copiedId === item.field.id;
          const isLowConf = item.status === "FILLED" && item.confidence < CONFIDENCE_THRESHOLD;
          const labelText = item.field.key
            ? fieldKeyLabel(language, item.field.key, item.field.label)
            : item.field.label;

          return (
            <FadeInUp key={item.field.id} index={index + 2} maxAnimated={8}>
              <View
                style={[
                  styles.fieldCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: isLowConf || item.status === "NEEDS_USER" ? colors.warning : colors.separator,
                    borderWidth: isLowConf || item.status === "NEEDS_USER" ? 1.5 : StyleSheet.hairlineWidth,
                  },
                ]}
              >
                <View style={styles.fieldTop}>
                  <Text style={[styles.fieldTitle, { color: colors.text, fontSize: theme.typeScale.captionStrong.fontSize }]}>
                    {index + 1}. {labelText}
                  </Text>
                  <StatusPill
                    label={statusLabel(item, language)}
                    tone={
                      item.status === "FILLED" && !isLowConf
                        ? "green"
                        : item.status === "SKIPPED"
                          ? "neutral"
                          : "gold"
                    }
                  />
                </View>

                {isSkipped ? (
                  <Text style={[styles.manualNote, { color: colors.secondaryText, fontSize: theme.typeScale.caption.fontSize }]}>
                    {t(language, "manualComplete")}
                  </Text>
                ) : (
                  <>
                    <View style={[styles.inputRow, { backgroundColor: colors.background, borderColor: colors.separator }]}>
                      <TextInput
                        value={displayValue}
                        onChangeText={(val) => updateField(item.field.id, val)}
                        onFocus={() => {
                          if (isAadhaar) setEditingAadhaarId(item.field.id);
                        }}
                        onBlur={() => {
                          if (isAadhaar) setEditingAadhaarId(null);
                        }}
                        placeholder={t(language, "enterAnswer")}
                        placeholderTextColor={colors.secondaryText}
                        multiline={item.field.key === "ADDRESS"}
                        accessibilityLabel={labelText}
                        style={[
                          styles.textInput,
                          { color: colors.text, fontSize: theme.typeScale.bodyStrong.fontSize },
                        ]}
                      />
                      {isAadhaar && rawValue ? (
                        <Hint
                          hint={t(language, "hintRevealAadhaar")}
                          label={revealAadhaar ? t(language, "hideAadhaar") : t(language, "revealAadhaar")}
                        >
                          <PressableScale
                            onPress={() => setRevealAadhaar((v) => !v)}
                            accessibilityRole="button"
                            accessibilityLabel={revealAadhaar ? t(language, "hideAadhaar") : t(language, "revealAadhaar")}
                            style={styles.eyeHit}
                          >
                            {revealAadhaar ? (
                              <EyeOff size={18} color={colors.secondaryText} />
                            ) : (
                              <Eye size={18} color={colors.secondaryText} />
                            )}
                          </PressableScale>
                        </Hint>
                      ) : null}
                    </View>

                    <View style={styles.fieldFooterRow}>
                      {item.status === "FILLED" && rawValue ? (
                        <Hint hint={t(language, "hintCopyField")} label={isCopied ? t(language, "copied") : t(language, "copyAnswer")}>
                          <PressableScale
                            onPress={() => copyValue(item)}
                            accessibilityRole="button"
                            accessibilityLabel={isCopied ? t(language, "copied") : t(language, "copyAnswer")}
                            style={[
                              styles.copyChip,
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
                                styles.copyChipText,
                                {
                                  color: isCopied ? colors.success : colors.forest,
                                  fontSize: theme.typeScale.label.fontSize,
                                },
                              ]}
                            >
                              {isCopied ? t(language, "copied") : t(language, "copyAnswer")}
                            </Text>
                          </PressableScale>
                        </Hint>
                      ) : (
                        <Text style={[styles.missingNote, { color: colors.warning, fontSize: theme.typeScale.label.fontSize }]}>
                          {t(language, "missingValue")}
                        </Text>
                      )}
                    </View>
                  </>
                )}
              </View>
            </FadeInUp>
          );
        })}
      </View>

      <View style={[styles.safety, { backgroundColor: colors.forestLight }]}>
        <ShieldCheck size={20} color={colors.forest} />
        <Text style={[styles.safetyText, { color: colors.forest, fontSize: theme.typeScale.label.fontSize }]}>
          {t(language, "safetyRule")}
        </Text>
      </View>

      <View style={styles.bottomActions}>
        <PrimaryButton
          title={t(language, "exportSave")}
          onPress={() => router.push("/forms/result")}
          hint={t(language, "exportSave")}
        />
        <SecondaryButton
          title={t(language, "fillWithAi")}
          onPress={() => openComingSoon(t(language, "fillWithAi"))}
          hint={t(language, "comingSoonMessage")}
        />
      </View>
    </BodhiniScreen>
  );
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 4,
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
    marginBottom: 14,
  },
  pdfBadge: {
    width: 42,
    height: 48,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  pdfBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  fileTextWrap: {
    flex: 1,
    gap: 2,
  },
  fileName: {
    fontWeight: "600",
  },
  fileMeta: {},
  summaryCard: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    marginBottom: 16,
  },
  summaryRow: {
    minHeight: 52,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  summaryRowLast: {
    borderBottomWidth: 0,
  },
  summaryRowLabel: {
    flex: 1,
    fontWeight: "500",
  },
  summaryRowCount: {
    fontWeight: "700",
  },
  fieldsWrap: {
    gap: 10,
  },
  fieldCard: {
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  fieldTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  fieldTitle: {
    flex: 1,
    fontWeight: "600",
  },
  inputRow: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  textInput: {
    flex: 1,
    fontWeight: "600",
    paddingVertical: 8,
  },
  eyeHit: {
    width: 48,
    height: 48,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  fieldFooterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  copyChip: {
    minHeight: 48,
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  copyChipText: {
    fontWeight: "700",
  },
  missingNote: {
    lineHeight: 16,
  },
  manualNote: {
    lineHeight: 18,
  },
  safety: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    padding: 14,
    marginTop: 16,
    borderRadius: 16,
  },
  safetyText: {
    lineHeight: 17,
    flex: 1,
  },
  bottomActions: {
    gap: 10,
    marginTop: 18,
  },
});
