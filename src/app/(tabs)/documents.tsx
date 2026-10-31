import React, { useCallback } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { FileText, FolderOpen, Plus, ShieldCheck } from "lucide-react-native";
import { BodhiniScreen, EmptyState, PageHeading, StatusPill } from "../../components/ui/BodhiniUI";
import { useBodhini } from "../../state/AppContext";
import { colors } from "../../theme/tokens";
import { t } from "../../i18n/translations";
import { FieldValidator } from "../../infrastructure/validation/field-validator";

function documentName(type: string): string {
  const names: Record<string, string> = {
    AADHAAR: "Aadhaar Card", PAN: "PAN Card", BIRTH_CERTIFICATE: "Birth Certificate",
    RATION_CARD: "Ration Card", MARKSHEET: "Marksheet", DOMICILE: "Domicile Certificate", OTHER: "Document",
  };
  return names[type] ?? "Document";
}

export default function DocumentsScreen() {
  const router = useRouter();
  const { documents, documentsLoading, refreshDocuments, language } = useBodhini();
  useFocusEffect(useCallback(() => { refreshDocuments().catch(() => undefined); }, [refreshDocuments]));

  return <BodhiniScreen contentStyle={styles.page}>
    <View style={styles.titleRow}>
      <View style={{ flex: 1 }}><PageHeading title={t(language, "myDocumentsTitle")} subtitle={t(language, "secureLocker")} /></View>
      <Pressable onPress={() => router.push("/scan/camera")} style={styles.addButton} accessibilityRole="button" accessibilityLabel={t(language, "addDocument")}><Plus color={colors.white} size={22} /></Pressable>
    </View>
    {documentsLoading && documents.length === 0 ? <View style={styles.loading}><ActivityIndicator color={colors.forest} /><Text style={styles.loadingText}>{t(language, "loadingDocuments")}</Text></View> : null}
    {!documentsLoading && documents.length === 0 ? <EmptyState icon={<FolderOpen color={colors.forest} size={31} />} title={t(language, "noDocumentsTitle")} subtitle={t(language, "noDocumentsHint")} /> : null}
    {documents.map((doc) => {
      const nameField = doc.fields.find((field) => field.key === "FULL_NAME");
      const idField = doc.fields.find((field) => field.key === "AADHAAR_NO" || field.key === "PAN_NO");
      const displayId = idField?.key === "AADHAAR_NO" ? FieldValidator.maskAadhaar(idField.value) : idField?.value;
      return <Pressable key={doc.id} onPress={() => router.push({ pathname: "/documents/[id]", params: { id: doc.id } })} style={styles.documentCard} accessibilityRole="button">
        <View style={[styles.documentIcon, doc.type === "PAN" ? { backgroundColor: "#DCE6ED" } : null]}><FileText color={colors.forest} size={25} /></View>
        <View style={styles.documentText}>
          <Text style={styles.docTitle}>{documentName(doc.type)}</Text>
          <Text style={styles.docMeta}>{nameField?.value ?? "Name not detected"}</Text>
          <Text style={styles.docMeta}>{displayId ?? new Date(doc.confirmedAt).toLocaleDateString()}</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </Pressable>;
    })}
    <View style={styles.securityNote}><ShieldCheck color={colors.terracotta} size={28} /><View style={{ flex: 1 }}><Text style={styles.securityTitle}>{t(language, "storedOnDevice")}</Text><Text style={styles.securityText}>{t(language, "localStorageNote")}</Text></View></View>
  </BodhiniScreen>;
}

const styles = StyleSheet.create({
  page: { paddingTop: 10 }, titleRow: { flexDirection: "row", alignItems: "flex-start" }, addButton: { marginTop: 2, width: 42, height: 42, borderRadius: 21, backgroundColor: colors.forest, alignItems: "center", justifyContent: "center" },
  loading: { minHeight: 180, alignItems: "center", justifyContent: "center", gap: 10 }, loadingText: { color: colors.muted, fontSize: 13 },
  documentCard: { minHeight: 88, backgroundColor: colors.card, borderRadius: 17, borderWidth: 1, borderColor: colors.line, flexDirection: "row", alignItems: "center", padding: 12, gap: 13, marginBottom: 10 },
  documentIcon: { width: 54, height: 62, backgroundColor: "#E9D8C5", borderRadius: 9, alignItems: "center", justifyContent: "center" },
  documentText: { flex: 1, gap: 4 }, docTitle: { fontFamily: "serif", color: colors.ink, fontSize: 16, fontWeight: "700" }, docMeta: { color: colors.muted, fontSize: 11 }, chevron: { color: colors.muted, fontSize: 27 },
  securityNote: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.cardStrong, padding: 15, borderRadius: 17, marginTop: 12 }, securityTitle: { fontSize: 12, color: colors.ink, fontWeight: "700", marginBottom: 4 }, securityText: { fontSize: 11, color: colors.muted, lineHeight: 16 },
});
