import React, { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Trash2, ShieldCheck } from "lucide-react-native";
import { Image } from "expo-image";
import { BodhiniScreen, PageHeading, StatusPill, TopBar } from "../../components/ui/BodhiniUI";
import { services } from "../../composition/services";
import type { DocumentRecord } from "../../domain/document/document.types";
import { FieldValidator } from "../../infrastructure/validation/field-validator";
import { useBodhini } from "../../state/AppContext";
import { t } from "../../i18n/translations";
import { FadeInUp } from "../../components/motion";
import { useTheme } from "../../theme/ThemeProvider";

function titleFor(type: string) {
  return ({ AADHAAR: "Aadhaar Card", PAN: "PAN Card", BIRTH_CERTIFICATE: "Birth Certificate", RATION_CARD: "Ration Card", MARKSHEET: "Marksheet", DOMICILE: "Domicile Certificate", OTHER: "Document" } as Record<string, string>)[type] ?? "Document";
}

export default function DocumentDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { refreshDocuments, language } = useBodhini();
  const { colors } = useTheme();
  const [record, setRecord] = useState<DocumentRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [reveal, setReveal] = useState(false);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try { setRecord(await services.documentRepository.getById(id)); }
    catch { Alert.alert(t(language, "couldNotLoad"), t(language, "pleaseTryAgain")); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  const deleteRecord = () => Alert.alert(t(language, "deleteDocument"), t(language, "deleteDocumentText"), [
    { text: t(language, "cancel"), style: "cancel" },
    { text: t(language, "delete"), style: "destructive", onPress: async () => {
      try {
        await services.documentRepository.delete(id);
        if (record?.imageUri) {
          const FileSystem = await import("expo-file-system/legacy");
          await FileSystem.deleteAsync(record.imageUri, { idempotent: true }).catch(() => undefined);
        }
        await refreshDocuments();
        router.replace("/(tabs)/documents");
      } catch { Alert.alert(t(language, "deleteFailed"), t(language, "pleaseTryAgain")); }
    } },
  ]);

  if (loading) return <BodhiniScreen contentStyle={styles.page}><TopBar onBack={() => router.back()} /><Text style={[styles.loading, { color: colors.textMuted }]}>{t(language, "loadingDocument")}</Text></BodhiniScreen>;
  if (!record) return <BodhiniScreen contentStyle={styles.page}><TopBar onBack={() => router.back()} /><PageHeading title={t(language, "documentNotFound")} subtitle={t(language, "removedFromDevice")} /></BodhiniScreen>;

  return (
    <BodhiniScreen contentStyle={styles.page}>
      <TopBar title={titleFor(record.type)} onBack={() => router.back()} right={<Pressable onPress={deleteRecord} accessibilityRole="button" accessibilityLabel={t(language, "deleteDocument")}><Trash2 color={colors.danger} size={19} /></Pressable>} />
      <PageHeading title={titleFor(record.type)} subtitle={`${t(language, "savedDate")} ${new Date(record.confirmedAt).toLocaleDateString()}`} />
      {record.imageUri ? <Image source={{ uri: record.imageUri }} style={[styles.image, { backgroundColor: colors.cardStrong }]} contentFit="cover" transition={200} /> : null}
      <View style={styles.sourceRow}><StatusPill label={t(language, "userConfirmed")} tone="green" /><Text style={[styles.sourceText, { color: colors.textMuted }]}>{t(language, "savedLocally")}</Text></View>
      {record.fields.map((field, index) => (
        <FadeInUp key={field.id} index={index} maxAnimated={8}>
          <View style={[styles.fieldRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>{field.label}</Text>
            <Text style={[styles.fieldValue, { color: colors.text }]}>{field.key === "AADHAAR_NO" && !reveal ? FieldValidator.maskAadhaar(field.value) : field.value}</Text>
          </View>
        </FadeInUp>
      ))}
      {record.fields.some((field) => field.key === "AADHAAR_NO") ? (
        <Pressable style={styles.reveal} onPress={() => setReveal((value) => !value)}>
          <Text style={[styles.revealText, { color: colors.primary }]}>{reveal ? t(language, "hideAadhaar") : t(language, "revealAadhaar")}</Text>
        </Pressable>
      ) : null}
      <View style={[styles.notice, { backgroundColor: colors.forestLight }]}><ShieldCheck color={colors.forest} size={21} /><Text style={[styles.noticeText, { color: colors.forest }]}>{t(language, "notEncrypted")}</Text></View>
    </BodhiniScreen>
  );
}

const styles = StyleSheet.create({
  page: { paddingTop: 8 },
  loading: { textAlign: "center", marginTop: 100 },
  image: { width: "100%", aspectRatio: 16 / 9, borderRadius: 16, marginBottom: 15 },
  sourceRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  sourceText: { fontSize: 11 },
  fieldRow: { paddingVertical: 13, borderBottomWidth: 1 },
  fieldLabel: { fontSize: 11, marginBottom: 5 },
  fieldValue: { fontSize: 15 },
  reveal: { alignSelf: "flex-start", paddingVertical: 12 },
  revealText: { fontSize: 12, fontWeight: "700" },
  notice: { marginTop: 16, borderRadius: 14, padding: 13, flexDirection: "row", gap: 10, alignItems: "center" },
  noticeText: { flex: 1, fontSize: 11, lineHeight: 16 },
});