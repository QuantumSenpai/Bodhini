import React, { useCallback } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { FileText, FolderOpen, Plus, ShieldCheck } from "lucide-react-native";
import { BodhiniScreen, EmptyState, PageHeading, StatusPill } from "../../components/ui/BodhiniUI";
import { useBodhini } from "../../state/AppContext";
import { t } from "../../i18n/translations";
import { FieldValidator } from "../../infrastructure/validation/field-validator";
import { FadeInUp } from "../../components/motion";
import { useTheme } from "../../theme/ThemeProvider";

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
  const { colors } = useTheme();
  useFocusEffect(useCallback(() => { refreshDocuments().catch(() => undefined); }, [refreshDocuments]));

  return (
    <BodhiniScreen contentStyle={styles.page}>
      <View style={styles.titleRow}>
        <View style={{ flex: 1 }}><PageHeading title={t(language, "myDocumentsTitle")} subtitle={t(language, "secureLocker")} /></View>
        <Pressable onPress={() => router.push("/scan/camera")} style={[styles.addButton, { backgroundColor: colors.primary }]} accessibilityRole="button" accessibilityLabel={t(language, "addDocument")}><Plus color={colors.onPrimary} size={22} /></Pressable>
      </View>
      {documentsLoading && documents.length === 0 ? (
        <View style={styles.loading}><ActivityIndicator color={colors.primary} /><Text style={[styles.loadingText, { color: colors.textMuted }]}>{t(language, "loadingDocuments")}</Text></View>
      ) : null}
      {!documentsLoading && documents.length === 0 ? (
        <EmptyState
          icon={<FolderOpen color={colors.primary} size={31} />}
          title={t(language, "noDocumentsTitle")}
          subtitle={t(language, "noDocumentsHint")}
        />
      ) : null}
      {documents.map((doc, index) => {
        const nameField = doc.fields.find((field) => field.key === "FULL_NAME");
        const idField = doc.fields.find((field) => field.key === "AADHAAR_NO" || field.key === "PAN_NO");
        const displayId = idField?.key === "AADHAAR_NO" ? FieldValidator.maskAadhaar(idField.value) : idField?.value;
        return (
          <FadeInUp key={doc.id} index={index} maxAnimated={8}>
            <Pressable onPress={() => router.push({ pathname: "/documents/[id]", params: { id: doc.id } })} style={[styles.documentCard, { backgroundColor: colors.card, borderColor: colors.border }]} accessibilityRole="button">
              <View style={[styles.documentIcon, doc.type === "PAN" ? { backgroundColor: "#DCE6ED" } : { backgroundColor: colors.forestLight }, { backgroundColor: doc.type === "PAN" ? "#DCE6ED" : colors.forestLight }]}><FileText color={colors.primary} size={25} /></View>
              <View style={styles.documentText}>
                <Text style={[styles.docTitle, { color: colors.text }]}>{documentName(doc.type)}</Text>
                <Text style={[styles.docMeta, { color: colors.textMuted }]}>{nameField?.value ?? t(language, "documentNameNotDetected")}</Text>
                <Text style={[styles.docMeta, { color: colors.textMuted }]}>{displayId ?? new Date(doc.confirmedAt).toLocaleDateString()}</Text>
              </View>
              <Text style={[styles.chevron, { color: colors.textMuted }]}>›</Text>
            </Pressable>
          </FadeInUp>
        );
      })}
      <View style={[styles.securityNote, { backgroundColor: colors.cardStrong }]}><ShieldCheck color={colors.terracotta} size={28} /><View style={{ flex: 1 }}><Text style={[styles.securityTitle, { color: colors.text }]}>{t(language, "storedOnDevice")}</Text><Text style={[styles.securityText, { color: colors.textMuted }]}>{t(language, "localStorageNote")}</Text></View></View>
    </BodhiniScreen>
  );
}

const styles = StyleSheet.create({
  page: { paddingTop: 10 },
  titleRow: { flexDirection: "row", alignItems: "flex-start" },
  addButton: { marginTop: 2, width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  loading: { minHeight: 180, alignItems: "center", justifyContent: "center", gap: 10 },
  loadingText: { fontSize: 13 },
  documentCard: { minHeight: 88, borderRadius: 20, borderWidth: 1, flexDirection: "row", alignItems: "center", padding: 12, gap: 13, marginBottom: 10, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  documentIcon: { width: 54, height: 62, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  documentText: { flex: 1, gap: 4 },
  docTitle: { fontFamily: "serif", fontSize: 16, fontWeight: "700" },
  docMeta: { fontSize: 11 },
  chevron: { fontSize: 27 },
  securityNote: { flexDirection: "row", alignItems: "center", gap: 12, padding: 15, borderRadius: 20, marginTop: 12 },
  securityTitle: { fontSize: 12, fontWeight: "700", marginBottom: 4 },
  securityText: { fontSize: 11, lineHeight: 16 },
});