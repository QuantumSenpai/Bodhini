import React, { useEffect, useMemo, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { FileText, ShieldCheck, AlertCircle } from "lucide-react-native";
import * as FileSystem from "expo-file-system/legacy";
import { BodhiniScreen, FieldInput, PageHeading, PrimaryButton, StatusPill, TopBar, VoicePromptButton } from "../../components/ui/BodhiniUI";
import { useBodhini } from "../../state/AppContext";
import { services } from "../../composition/services";
import type { DocumentRecord, ExtractedField } from "../../domain/document/document.types";
import { colors } from "../../theme/tokens";
import { t } from "../../i18n/translations";

function makeId() { return `doc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`; }

export default function ScanReviewScreen() {
  const router = useRouter();
  const { pendingDocument, setPendingDocument, refreshDocuments, language } = useBodhini();
  const [fields, setFields] = useState<ExtractedField[]>(pendingDocument?.analysis.fields ?? []);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!pendingDocument) router.replace("/scan/camera");
    else setFields(pendingDocument.analysis.fields);
  }, [pendingDocument, router]);

  const warnings = useMemo(() => fields.filter((field) => !services.documentValidator.validate(field).ok), [fields]);
  if (!pendingDocument) return null;

  const updateField = (id: string, value: string) => setFields((current) => current.map((field) => field.id === id ? { ...field, value } : field));

  const saveDocument = async () => {
    if (saving) return;
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
        fields: fields.map((field) => ({ ...field, value: field.value.trim() })),
        createdAt: timestamp,
        confirmedAt: timestamp,
      };
      await services.documentRepository.save(record);
      // A list refresh failure must not roll back a successfully persisted record or delete its image.
      await refreshDocuments().catch(() => undefined);
      setPendingDocument(null);
      Alert.alert(t(language, "documentSaved"), t(language, "documentSavedBody"), [
        { text: t(language, "viewDocuments"), onPress: () => router.replace("/(tabs)/documents") },
      ]);
    } catch (error) {
      if (copiedImageUri) await FileSystem.deleteAsync(copiedImageUri, { idempotent: true }).catch(() => undefined);
      Alert.alert(t(language, "saveFailed"), error instanceof Error ? error.message : t(language, "pleaseTryAgain"));
    } finally { setSaving(false); }
  };

  const speakReview = () => services.voiceService.speak(language === "bn" ? "সংরক্ষণ করার আগে প্রতিটি তথ্য ভালো করে দেখে নিন।" : language === "hi" ? "सहेजने से पहले कृपया हर विवरण ध्यान से जाँचें।" : "Please review every detail carefully before saving.", language).catch(() => Alert.alert(t(language, "voiceUnavailable"), t(language, "ttsUnavailable")));

  return <BodhiniScreen contentStyle={styles.page}>
    <TopBar title={t(language, "reviewInformation")} onBack={() => router.back()} />
    <PageHeading title={t(language, "reviewInformation")} subtitle={t(language, "checkDetails")} />
    <View style={styles.documentPreview}>
      <Image source={{ uri: pendingDocument.imageUri }} style={styles.previewImage} contentFit="cover" />
      <View style={{ flex: 1 }}><Text style={styles.previewTitle}>{pendingDocument.analysis.type.replaceAll("_", " ")}</Text><Text style={styles.previewSub}>{pendingDocument.analysis.fields.length} fields detected</Text></View>
      <StatusPill label={pendingDocument.analysis.source} tone="green" />
    </View>
    <VoicePromptButton onPress={speakReview} />
    {fields.map((field) => {
      const validation = services.documentValidator.validate(field);
      return <View key={field.id} style={styles.fieldCard}>
        <FieldInput label={field.label} value={field.value} onChangeText={(value) => updateField(field.id, value)} multiline={field.key === "ADDRESS"} />
        <View style={styles.fieldMeta}>
          <StatusPill label={validation.ok ? t(language, "detected") : t(language, "verify")} tone={validation.ok ? "green" : "gold"} />
          <Text style={styles.confidence}>{Math.round(field.confidence * 100)}% {t(language, "confidence")}</Text>
        </View>
      </View>;
    })}
    {warnings.length > 0 ? <View style={styles.warning}><AlertCircle color={colors.gold} size={18} /><Text style={styles.warningText}>{warnings.length} {t(language, "attentionNeeded")}</Text></View> : null}
    {pendingDocument.analysis.warnings.map((warning) => <Text key={warning} style={styles.note}>{warning}</Text>)}
    <View style={styles.privacyBox}><ShieldCheck color={colors.forest} size={22} /><Text style={styles.privacyText}>{t(language, "onlyConfirmedSaved")}</Text></View>
    <PrimaryButton title={t(language, "save")} onPress={saveDocument} loading={saving} style={styles.saveButton} />
  </BodhiniScreen>;
}

const styles = StyleSheet.create({
  page: { paddingTop: 8 }, documentPreview: { flexDirection: "row", alignItems: "center", gap: 12, padding: 11, borderRadius: 16, backgroundColor: colors.card, borderColor: colors.line, borderWidth: 1, marginBottom: 14 },
  previewImage: { width: 58, height: 58, borderRadius: 10, backgroundColor: colors.cardStrong }, previewTitle: { fontFamily: "serif", fontSize: 15, fontWeight: "700", color: colors.ink }, previewSub: { marginTop: 4, fontSize: 11, color: colors.muted },
  fieldCard: { marginTop: 13, padding: 13, borderRadius: 15, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line }, fieldMeta: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: -5 }, confidence: { fontSize: 11, color: colors.muted },
  warning: { flexDirection: "row", gap: 9, padding: 12, backgroundColor: "#F8E9D4", borderRadius: 14, marginTop: 12 }, warningText: { color: "#79512D", fontSize: 12, lineHeight: 17, flex: 1 },
  note: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 8 }, privacyBox: { flexDirection: "row", gap: 10, alignItems: "center", padding: 14, backgroundColor: colors.forestLight, borderRadius: 15, marginTop: 15 }, privacyText: { flex: 1, fontSize: 11, color: colors.forest, lineHeight: 16 },
  saveButton: { marginTop: 20 },
});
