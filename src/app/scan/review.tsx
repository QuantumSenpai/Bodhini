import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { AlertCircle, Check, Copy, Eye, EyeOff, Plus } from "lucide-react-native";
import * as FileSystem from "expo-file-system/legacy";
import {
  BodhiniScreen,
  PageHeading,
  PrimaryButton,
  StatusPill,
  TopBar,
  VoicePromptButton,
} from "../../components/ui/BodhiniUI";
import { redactForDebug } from "../../infrastructure/vision/ocr/redact";
import type { OcrRow } from "../../infrastructure/vision/ocr/ocr.types";
import { services } from "../../composition/services";
import type { DocumentRecord, ExtractedField, FieldKey } from "../../domain/document/document.types";
import { FieldValidator } from "../../infrastructure/validation/field-validator";
import { CONFIDENCE_THRESHOLD } from "../../domain/constants";
import { documentTypeLabel, fieldKeyLabel, t, type TranslationKey } from "../../i18n/translations";
import { AnimatedCheck, FadeInUp, Hint, PressableScale } from "../../components/motion";
import { useTheme } from "../../theme/ThemeProvider";
import { clipboardService } from "../../infrastructure/export/clipboardService";
import { displayValue } from "../../infrastructure/export/fieldDisplay";
import { useBodhini } from "../../state/AppContext";

function makeId() {
  return `doc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function validationMessageKeyFor(key: FieldKey): TranslationKey {
  if (key === "AADHAAR_NO") return "invalidAadhaarHint";
  if (key === "PAN_NO") return "invalidPanHint";
  if (key === "DOB") return "invalidDobHint";
  if (key === "PIN_CODE") return "invalidPinHint";
  if (key === "PHONE") return "invalidPhoneHint";
  return "invalidFieldHint";
}

const standardCoreKeys: FieldKey[] = [
  "FULL_NAME",
  "DOB",
  "GENDER",
  "AADHAAR_NO",
  "ADDRESS",
  "PIN_CODE",
  "FATHER_NAME",
];

export default function ScanReviewScreen() {
  const router = useRouter();
  const { pendingDocument, setPendingDocument, refreshDocuments, language, showToast, debugOcr } = useBodhini();
  const { colors, theme } = useTheme();
  const [fields, setFields] = useState<ExtractedField[]>(pendingDocument?.analysis.fields ?? []);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [revealAadhaar, setRevealAadhaar] = useState(false);
  const [editingAadhaarId, setEditingAadhaarId] = useState<string | null>(null);
  const [revealFieldId, setRevealFieldId] = useState<string | null>(null);
  const [copiedFieldId, setCopiedFieldId] = useState<string | null>(null);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!pendingDocument) {
      router.replace("/scan/camera");
    } else {
      setFields(pendingDocument.analysis.fields);
    }
  }, [pendingDocument, router]);

  useEffect(() => {
    return () => {
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    };
  }, []);

  const warnings = useMemo(
    () => fields.filter((field) => !services.documentValidator.validate(field).ok),
    [fields],
  );

  const updateField = useCallback((id: string, value: string) => {
    setFields((current) =>
      current.map((field) => (field.id === id ? { ...field, value, confidence: Math.max(field.confidence, 0.9) } : field)),
    );
  }, []);

  const missingCoreKey = useMemo(() => {
    const existingKeys = new Set(fields.map((f) => f.key));
    return standardCoreKeys.find((k) => !existingKeys.has(k)) ?? null;
  }, [fields]);

  const handleAddMissingField = useCallback(() => {
    if (!missingCoreKey) return;
    const newField: ExtractedField = {
      id: `manual-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      key: missingCoreKey,
      label: fieldKeyLabel(language, missingCoreKey),
      value: "",
      confidence: 1,
      source: pendingDocument?.analysis.source ?? "OCR",
    };
    setFields((prev) => [...prev, newField]);
  }, [language, missingCoreKey, pendingDocument?.analysis.source]);

  const saveDocument = useCallback(async () => {
    if (!pendingDocument || saving || savedSuccess) return;
    setSaving(true);
    let copiedImageUri: string | null = null;
    try {
      const id = makeId();
      let imageUri = pendingDocument.imageUri;
      const directory = FileSystem.documentDirectory;
      if (!directory) throw new Error("App-private document storage is unavailable on this device.");
      const imageDirectory = `${directory}documents/`;
      await FileSystem.makeDirectoryAsync(imageDirectory, { intermediates: true });
      const extension = pendingDocument.imageUri.split("?")[0].split(".").pop()?.toLowerCase();
      const safeExtension = extension && /^[a-z0-9]{2,5}$/.test(extension) ? extension : "jpg";
      const permanentUri = `${imageDirectory}${id}.${safeExtension}`;
      await FileSystem.copyAsync({ from: pendingDocument.imageUri, to: permanentUri });
      copiedImageUri = permanentUri;
      imageUri = permanentUri;

      const timestamp = Date.now();
      const record: DocumentRecord = {
        id,
        type: pendingDocument.analysis.type,
        imageUri,
        fields: fields
          .map((field) => ({ ...field, value: field.value.trim() }))
          .filter((field) => field.value.length > 0),
        createdAt: timestamp,
        confirmedAt: timestamp,
      };
      await services.documentRepository.save(record);
      await refreshDocuments().catch(() => undefined);
      setSavedSuccess(true);
      showToast(t(language, "documentSaved"));
      setTimeout(() => {
        setPendingDocument(null);
        router.replace("/(tabs)/documents");
      }, 650);
    } catch (error) {
      if (copiedImageUri) {
        await FileSystem.deleteAsync(copiedImageUri, { idempotent: true }).catch(() => undefined);
      }
      Alert.alert(t(language, "saveFailed"), error instanceof Error ? error.message : t(language, "pleaseTryAgain"));
    } finally {
      setSaving(false);
    }
  }, [fields, language, pendingDocument, refreshDocuments, router, savedSuccess, saving, setPendingDocument, showToast]);

  const speakReview = useCallback(() => {
    services.voiceService
      .speak(t(language, "checkDetails"), language)
      .catch(() => Alert.alert(t(language, "voiceUnavailable"), t(language, "ttsUnavailable")));
  }, [language]);

  if (!pendingDocument) return null;

  const docTitle = documentTypeLabel(language, pendingDocument.analysis.type);

  return (
    <BodhiniScreen contentStyle={styles.page}>
      <TopBar onBack={() => router.back()} right={<VoicePromptButton onPress={speakReview} />} />
      <PageHeading title={t(language, "reviewInformation")} subtitle={t(language, "checkDetails")} />

      <View style={[styles.typeBanner, { backgroundColor: colors.surface, borderColor: colors.separator }]}>
        <Text style={[styles.typeBannerTitle, { color: colors.text, fontSize: theme.typeScale.bodyStrong.fontSize }]}>
          {docTitle}
        </Text>
        <StatusPill
          label={pendingDocument.analysis.source === "DEMO" ? t(language, "sourceDemo") : t(language, "sourceOcr")}
          tone="green"
        />
      </View>

      {savedSuccess ? (
        <View style={[styles.savedCard, { backgroundColor: colors.surface, borderColor: colors.separator }]}>
          <AnimatedCheck size={64} />
          <Text style={[styles.savedTitle, { color: colors.text, fontSize: theme.typeScale.h2.fontSize }]}>
            {t(language, "documentSaved")}
          </Text>
          <Text style={[styles.savedSub, { color: colors.secondaryText, fontSize: theme.typeScale.caption.fontSize }]}>
            {t(language, "documentSavedBody")}
          </Text>
        </View>
      ) : null}

      <View style={styles.fieldsList}>
        {fields.map((field, index) => {
          const validation = services.documentValidator.validate(field);
          const isLowConfidence = field.confidence > 0 && field.confidence < CONFIDENCE_THRESHOLD;
          const needsAttention = !validation.ok || isLowConfidence;
          const isAadhaar = field.key === "AADHAAR_NO";
          const isEditingThisAadhaar = editingAadhaarId === field.id;
          const revealThis = revealFieldId === field.id;
          const displayValueResult =
            isAadhaar && !revealThis && !isEditingThisAadhaar
              ? displayValue("AADHAAR_NO", field.value, false)
              : isAadhaar
              ? displayValue("AADHAAR_NO", field.value, revealThis)
              : field.value;
          const localizedLabel = fieldKeyLabel(language, field.key, field.label);
          const isCopied = copiedFieldId === field.id;

          return (
            <FadeInUp key={field.id} index={index} maxAnimated={8}>
              <View
                style={[
                  styles.fieldCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: needsAttention ? colors.warning : colors.separator,
                    borderWidth: needsAttention ? 1.5 : StyleSheet.hairlineWidth,
                  },
                ]}
              >
                <View style={styles.fieldRowMain}>
                  <View style={styles.fieldTextCol}>
                    <Text style={[styles.fieldLabel, { color: colors.secondaryText, fontSize: theme.typeScale.label.fontSize }]}>
                      {localizedLabel}
                    </Text>
                    <TextInput
                      value={displayValueResult}
                      onChangeText={(val) => updateField(field.id, val)}
                      onFocus={() => {
                        if (isAadhaar) setEditingAadhaarId(field.id);
                      }}
                      onBlur={() => {
                        if (isAadhaar) setEditingAadhaarId(null);
                      }}
                      placeholder={localizedLabel}
                      placeholderTextColor={colors.secondaryText}
                      multiline={field.key === "ADDRESS"}
                      keyboardType={field.key === "PIN_CODE" || field.key === "PHONE" || isAadhaar ? "number-pad" : "default"}
                      accessibilityLabel={localizedLabel}
                      style={[
                        styles.fieldValueInput,
                        { color: colors.text, fontSize: theme.typeScale.bodyStrong.fontSize },
                      ]}
                    />
                  </View>

                  <View style={styles.fieldRightIcons}>
                    {isAadhaar ? (
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
                          const sensitive = await clipboardService.copy(isAadhaar ? "AADHAAR_NO" : "OTHER", field.value);
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

                    {needsAttention ? (
                      <View style={[styles.warnCircle, { backgroundColor: colors.warningLight }]}>
                        <AlertCircle size={18} color={colors.warning} />
                      </View>
                    ) : (
                      <View style={[styles.tickCircle, { backgroundColor: colors.success }]}>
                        <Check size={14} color={colors.onPrimary} strokeWidth={3} />
                      </View>
                    )}
                  </View>
                </View>

                {!validation.ok ? (
                  <Text style={[styles.helperText, { color: colors.warning, fontSize: theme.typeScale.label.fontSize }]}>
                    {t(language, validationMessageKeyFor(field.key))}
                  </Text>
                ) : isLowConfidence ? (
                  <Text style={[styles.helperText, { color: colors.warning, fontSize: theme.typeScale.label.fontSize }]}>
                    {t(language, "lowConfidenceHint")}
                  </Text>
                ) : null}
              </View>
            </FadeInUp>
          );
        })}
      </View>

      {missingCoreKey ? (
        <PressableScale
          onPress={handleAddMissingField}
          accessibilityRole="button"
          accessibilityLabel={t(language, "addField")}
          style={[styles.addFieldBtn, { borderColor: colors.separator, backgroundColor: colors.surface }]}
        >
          <Plus size={18} color={colors.forest} />
          <Text style={[styles.addFieldText, { color: colors.forest, fontSize: theme.typeScale.captionStrong.fontSize }]}>
            {t(language, "addField")}: {fieldKeyLabel(language, missingCoreKey)}
          </Text>
        </PressableScale>
      ) : null}

      {warnings.length > 0 ? (
        <View style={[styles.warningBanner, { backgroundColor: colors.warningLight, borderColor: colors.warning }]}>
          <AlertCircle color={colors.warning} size={18} />
          <Text style={[styles.warningBannerText, { color: colors.text, fontSize: theme.typeScale.caption.fontSize }]}>
            {warnings.length} {t(language, "attentionNeeded")}
          </Text>
        </View>
      ) : null}

      {debugOcr && pendingDocument?.analysis?.rows ? (
        <View style={[styles.debugOcrPanel, { backgroundColor: colors.surfaceAlt, borderColor: colors.separator }]}>
          <Text style={[styles.debugOcrTitle, { color: colors.text, fontSize: theme.typeScale.captionStrong.fontSize }]}>
            {t(language, "debugOcrLabel")}
          </Text>
          <View style={styles.debugOcrRows}>
            {pendingDocument.analysis.rows.map((row: OcrRow, idx: number) => (
              <Text key={idx} style={[styles.debugOcrRow, { color: colors.secondaryText, fontSize: theme.typeScale.caption.fontSize }]}>
                [{row.script}] {redactForDebug(row.text)}
              </Text>
            ))}
          </View>
          <PressableScale
            onPress={() => {
              const text = pendingDocument.analysis.rows!.map((r: OcrRow) => `[${r.script}] ${redactForDebug(r.text)}`).join("\n");
              clipboardService.copyText(text).catch(() => undefined);
              showToast(t(language, "copied"));
            }}
            accessibilityRole="button"
            accessibilityLabel={t(language, "copyAnswer")}
            style={[styles.debugOcrCopyBtn, { backgroundColor: colors.forestLight }]}
          >
            <Text style={[styles.debugOcrCopyText, { color: colors.forest, fontSize: theme.typeScale.label.fontSize }]}>
              {t(language, "copyAnswer")}
            </Text>
          </PressableScale>
        </View>
      ) : null}

      <PrimaryButton
        title={t(language, "save")}
        onPress={saveDocument}
        loading={saving}
        disabled={savedSuccess}
        hint={t(language, "save")}
        style={styles.saveButton}
      />
    </BodhiniScreen>
  );
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 4,
  },
  typeBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 12,
  },
  typeBannerTitle: {
    fontWeight: "600",
  },
  savedCard: {
    alignItems: "center",
    padding: 24,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 16,
    gap: 8,
  },
  savedTitle: {
    fontWeight: "700",
    marginTop: 4,
  },
  savedSub: {
    textAlign: "center",
  },
  fieldsList: {
    gap: 10,
  },
  fieldCard: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 6,
  },
  fieldRowMain: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  fieldTextCol: {
    flex: 1,
    gap: 2,
  },
  fieldLabel: {
    fontWeight: "500",
  },
  fieldValueInput: {
    fontWeight: "700",
    paddingVertical: 4,
    minHeight: 32,
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
  tickCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  warnCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
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
  helperText: {
    fontWeight: "500",
  },
  addFieldBtn: {
    minHeight: 48,
    marginTop: 12,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
  },
  addFieldText: {
    fontWeight: "600",
  },
  warningBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 14,
  },
  warningBannerText: {
    flex: 1,
    lineHeight: 18,
  },
  saveButton: {
    marginTop: 20,
  },
  debugOcrPanel: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    marginTop: 16,
    gap: 12,
  },
  debugOcrTitle: {
    fontWeight: "600",
  },
  debugOcrRows: {
    gap: 6,
    maxHeight: 200,
  },
  debugOcrRow: {
    fontFamily: "monospace",
  },
  debugOcrCopyBtn: {
    minHeight: 48,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  debugOcrCopyText: {
    fontWeight: "600",
  },
});
