import React, { useEffect, useState } from "react";
import { Alert, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Trash2, ShieldCheck } from "lucide-react-native";
import { BodhiniScreen, PageHeading, StatusPill, TopBar } from "../../components/ui/BodhiniUI";
import { services } from "../../composition/services";
import type { DocumentRecord } from "../../domain/document/document.types";
import { FieldValidator } from "../../infrastructure/validation/field-validator";
import { useBodhini } from "../../state/AppContext";
import { colors } from "../../theme/tokens";
import { t } from "../../i18n/translations";

function titleFor(type: string) {
  return ({ AADHAAR: "Aadhaar Card", PAN: "PAN Card", BIRTH_CERTIFICATE: "Birth Certificate", RATION_CARD: "Ration Card", MARKSHEET: "Marksheet", DOMICILE: "Domicile Certificate", OTHER: "Document" } as Record<string, string>)[type] ?? "Document";
}

export default function DocumentDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { refreshDocuments, language } = useBodhini();
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

  useEffect(() => { load(); // Load the requested saved record.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const deleteRecord = () => Alert.alert(t(language, "deleteDocument"), t(language, "deleteDocumentText"), [
    { text: t(language, "cancel"), style: "cancel" },
    { text: t(language, "delete"), style: "destructive", onPress: async () => {
      try {
        await services.documentRepository.delete(id);
        if (record?.imageUri) {
          // The saved image is private app data; remove it with the database record.
          const FileSystem = await import("expo-file-system/legacy");
          await FileSystem.deleteAsync(record.imageUri, { idempotent: true }).catch(() => undefined);
        }
        await refreshDocuments();
        router.replace("/(tabs)/documents");
      } catch { Alert.alert(t(language, "deleteFailed"), t(language, "pleaseTryAgain")); }
    } },
  ]);

  if (loading) return <BodhiniScreen contentStyle={styles.page}><TopBar onBack={() => router.back()} /><Text style={styles.loading}>{t(language, "loadingDocument")}</Text></BodhiniScreen>;
  if (!record) return <BodhiniScreen contentStyle={styles.page}><TopBar onBack={() => router.back()} /><PageHeading title={t(language, "documentNotFound")} subtitle={t(language, "removedFromDevice")} /></BodhiniScreen>;

  return <BodhiniScreen contentStyle={styles.page}>
    <TopBar title={titleFor(record.type)} onBack={() => router.back()} right={<Pressable onPress={deleteRecord} accessibilityRole="button" accessibilityLabel={t(language, "deleteDocument")}><Trash2 color={colors.danger} size={19} /></Pressable>} />
    <PageHeading title={titleFor(record.type)} subtitle={`${t(language, "savedDate")} ${new Date(record.confirmedAt).toLocaleDateString()}`} />
    {record.imageUri ? <Image source={{ uri: record.imageUri }} style={styles.image} resizeMode="cover" /> : null}
    <View style={styles.sourceRow}><StatusPill label={t(language, "userConfirmed")} tone="green" /><Text style={styles.sourceText}>{t(language, "savedLocally")}</Text></View>
    {record.fields.map((field) => {
      const sensitive = field.key === "AADHAAR_NO";
      const value = sensitive && !reveal ? FieldValidator.maskAadhaar(field.value) : field.value;
      return <View key={field.id} style={styles.fieldRow}><Text style={styles.fieldLabel}>{field.label}</Text><Text style={styles.fieldValue}>{value}</Text></View>;
    })}
    {record.fields.some((field) => field.key === "AADHAAR_NO") ? <Pressable style={styles.reveal} onPress={() => setReveal((value) => !value)}><Text style={styles.revealText}>{reveal ? t(language, "hideAadhaar") : t(language, "revealAadhaar")}</Text></Pressable> : null}
    <View style={styles.notice}><ShieldCheck color={colors.forest} size={21} /><Text style={styles.noticeText}>{t(language, "notEncrypted")}</Text></View>
  </BodhiniScreen>;
}

const styles = StyleSheet.create({
  page: { paddingTop: 8 }, loading: { color: colors.muted, textAlign: "center", marginTop: 100 }, image: { width: "100%", height: 175, borderRadius: 16, backgroundColor: colors.cardStrong, marginBottom: 15 },
  sourceRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }, sourceText: { color: colors.muted, fontSize: 11 },
  fieldRow: { paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: colors.line }, fieldLabel: { color: colors.muted, fontSize: 11, marginBottom: 5 }, fieldValue: { color: colors.ink, fontSize: 15 },
  reveal: { alignSelf: "flex-start", paddingVertical: 12 }, revealText: { color: colors.forest, fontSize: 12, fontWeight: "700" },
  notice: { marginTop: 16, backgroundColor: colors.forestLight, borderRadius: 14, padding: 13, flexDirection: "row", gap: 10, alignItems: "center" }, noticeText: { flex: 1, color: colors.forest, fontSize: 11, lineHeight: 16 },
});
