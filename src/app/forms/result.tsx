import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CONFIDENCE_THRESHOLD } from "../../domain/constants";
import { Alert, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Check, Copy, Eye, EyeOff, FileImage, FileText } from "lucide-react-native";
import { ActionCard, BodhiniScreen, PageHeading, SecondaryButton, StatusPill, TopBar } from "../../components/ui/BodhiniUI";
import { useBodhini } from "../../state/AppContext";
import { services } from "../../composition/services";
import { FieldValidator } from "../../infrastructure/validation/field-validator";
import { t } from "../../i18n/translations";
import { AnimatedCheck, ConfettiFreeGlow, CopyMorphButton, Hint, PressableScale } from "../../components/motion";
import { useTheme } from "../../theme/ThemeProvider";
import { clipboardService } from "../../infrastructure/export/clipboardService";
import { displayValue } from "../../infrastructure/export/fieldDisplay";
import { copyItemKey, filledFieldKey } from "../../infrastructure/export/copy-key";
import type { FilledField } from "../../domain/form/form.types";

function canCopy(field: FilledField): boolean {
  return field.status === "FILLED" && field.confidence >= CONFIDENCE_THRESHOLD && Boolean(field.value?.trim());
}

export default function FormResultScreen() {
  const router = useRouter();
  const { filledFields, setFilledFields, setPendingFormInput, language, openComingSoon, showToast } = useBodhini();
  const { colors, theme } = useTheme();
  const [copyingAll, setCopyingAll] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedItemId, setCopiedItemId] = useState<string | null>(null);
  const [revealAadhaarId, setRevealAadhaarId] = useState<string | null>(null);
  const allTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const itemTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (allTimerRef.current) clearTimeout(allTimerRef.current);
      if (itemTimerRef.current) clearTimeout(itemTimerRef.current);
    };
  }, []);

  const items = useMemo(() => services.formExporter.buildCopyItems(filledFields.filter(canCopy)), [filledFields]);
  const copyableText = useMemo(
    () =>
      items
        .filter((item) => item.status === "FILLED")
        .map((item) => `${item.label}: ${item.value}`)
        .join("\n"),
    [items],
  );

  const copyAll = useCallback(async () => {
    if (!copyableText.trim() || copyingAll) return;
    setCopyingAll(true);
    try {
      const sensitive = await clipboardService.copyMany(
        items.filter((item) => item.status === "FILLED").map((item) => ({
          key: copyItemKey(item),
          value: item.value,
        }))
      );
      if (allTimerRef.current) clearTimeout(allTimerRef.current);
      setCopiedAll(true);
      showToast(sensitive ? t(language, "copiedSensitive") : t(language, "copied"));
      allTimerRef.current = setTimeout(() => {
        setCopiedAll(false);
      }, 1500);
    } catch {
      Alert.alert(t(language, "copyFailed"), t(language, "pleaseTryAgain"));
    } finally {
      setCopyingAll(false);
    }
  }, [filledFields, language, showToast, copyingAll, items]);

  const copySingle = useCallback(async (field: FilledField) => {
    if (!canCopy(field) || !field.value) return;
    try {
      const key = filledFieldKey(field) ?? "OTHER";
      const sensitive = await clipboardService.copy(key, field.value);
      if (itemTimerRef.current) clearTimeout(itemTimerRef.current);
      setCopiedItemId(field.field.id);
      showToast(sensitive ? t(language, "copiedSensitive") : t(language, "copied"));
      itemTimerRef.current = setTimeout(() => {
        setCopiedItemId(null);
      }, 1500);
    } catch {
      Alert.alert(t(language, "copyFailed"), t(language, "pleaseTryAgain"));
    }
  }, [language, showToast]);

  return (
    <BodhiniScreen contentStyle={styles.page}>
      <TopBar title={t(language, "formReady")} onBack={() => router.back()} />

      <View style={styles.successHeader}>
        <AnimatedCheck size={72} />
        <ConfettiFreeGlow color={colors.success} size={120} />
      </View>

      <PageHeading
        title={t(language, "formReady")}
        subtitle={t(language, "preparedSuccessfully")}
        align="center"
      />

      <View style={[styles.previewCard, { backgroundColor: colors.surface, borderColor: colors.separator }]}>
        <Text style={[styles.previewTitle, { color: colors.text, fontSize: theme.typeScale.bodyStrong.fontSize }]}>
          {t(language, "applicationForm")}
        </Text>
        {filledFields.map((field, index) => {
          const rawValue = field.value ?? "";
          const isAadhaar = filledFieldKey(field) === "AADHAAR_NO";
          const revealThis = revealAadhaarId === field.field.id;
          const display = isAadhaar && rawValue ? displayValue("AADHAAR_NO", rawValue, revealThis) : rawValue;
          const isCopied = copiedItemId === field.field.id;

          return (
            <View key={field.field.id} style={[styles.previewRow, { borderTopColor: colors.separator }]}>
              <View style={styles.previewRowMain}>
                <Text style={[styles.previewLabel, { color: colors.secondaryText, fontSize: theme.typeScale.label.fontSize }]}>
                  {index + 1}. {field.field.label}
                </Text>
                <Text style={[styles.previewValue, { color: colors.text, fontSize: theme.typeScale.bodyStrong.fontSize }]}>
                  {field.status === "SKIPPED"
                    ? t(language, "manualComplete")
                    : field.status === "NEEDS_USER"
                      ? t(language, "missing")
                      : display}
                </Text>
              </View>
              {field.status === "FILLED" && rawValue ? (
                <View style={styles.fieldRightIcons}>
                  {isAadhaar ? (
                    <Hint
                      hint={t(language, "hintRevealAadhaar")}
                      label={revealAadhaarId === field.field.id ? t(language, "hideValue") : t(language, "showValue")}
                    >
                      <PressableScale
                        onPress={() => setRevealAadhaarId(revealAadhaarId === field.field.id ? null : field.field.id)}
                        accessibilityRole="button"
                        accessibilityLabel={revealAadhaarId === field.field.id ? t(language, "hideValue") : t(language, "showValue")}
                        style={styles.eyeHit}
                      >
                        {revealAadhaarId === field.field.id ? (
                          <EyeOff size={20} color={colors.secondaryText} />
                        ) : (
                          <Eye size={20} color={colors.secondaryText} />
                        )}
                      </PressableScale>
                    </Hint>
                  ) : null}
                  {canCopy(field) ? (
                    <Hint
                      hint={t(language, "hintCopyField")}
                      label={isCopied ? t(language, "copied") : t(language, "copyAnswer")}
                    >
                      <PressableScale
                        onPress={() => copySingle(field)}
                        accessibilityRole="button"
                        accessibilityLabel={isCopied ? t(language, "copied") : t(language, "copyAnswer")}
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
                          {isCopied ? t(language, "copied") : t(language, "copyAnswer")}
                        </Text>
                      </PressableScale>
                    </Hint>
                  ) : (
                    <StatusPill label={t(language, "needsReview")} tone="gold" />
                  )}
                </View>
              ) : (
                <StatusPill
                  label={field.status === "SKIPPED" ? t(language, "skipped") : t(language, "missing")}
                  tone={field.status === "SKIPPED" ? "neutral" : "gold"}
                />
              )}
            </View>
          );
        })}
      </View>

      <CopyMorphButton
        label={t(language, "copyAnswers")}
        copiedLabel={t(language, "copied")}
        isCopied={copiedAll}
        onPress={copyAll}
        disabled={!copyableText.trim() || copyingAll}
        hint={t(language, "hintCopyField")}
        style={styles.copyAllBtn}
      />

      <ActionCard
        title={t(language, "saveImage")}
        subtitle={t(language, "saveImageUnavailable")}
        icon={<FileImage color={colors.onPrimary} size={22} />}
        tint={colors.success}
        onPress={() => openComingSoon(t(language, "saveImage"))}
        hint={t(language, "comingSoonMessage")}
      />
      <ActionCard
        title={t(language, "savePdf")}
        subtitle={t(language, "savePdfUnavailable")}
        icon={<FileText color={colors.onPrimary} size={22} />}
        tint={colors.pdfBadge}
        onPress={() => openComingSoon(t(language, "savePdf"))}
        hint={t(language, "comingSoonMessage")}
      />

      <SecondaryButton
        title={t(language, "fillAnother")}
        onPress={() => {
          setPendingFormInput(null);
          setFilledFields([]);
          router.replace("/(tabs)/forms");
        }}
        style={styles.fillAnother}
      />
    </BodhiniScreen>
  );
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 4,
  },
  successHeader: {
    width: 96,
    height: 96,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginVertical: 8,
    position: "relative",
  },
  previewCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 16,
  },
  previewTitle: {
    textAlign: "center",
    fontWeight: "700",
    marginBottom: 10,
  },
  previewRow: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  previewRowMain: {
    flex: 1,
    gap: 3,
  },
  previewLabel: {
    fontWeight: "500",
  },
  previewValue: {
    fontWeight: "600",
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
  copyAllBtn: {
    marginBottom: 14,
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
  fillAnother: {
    marginTop: 4,
  },
});
