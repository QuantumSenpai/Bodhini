import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Check, FileText, ShieldCheck } from "lucide-react-native";
import { BodhiniScreen, PrimaryButton } from "../../components/ui/BodhiniUI";
import { useBodhini } from "../../state/AppContext";
import { services } from "../../composition/services";
import { colors } from "../../theme/tokens";
import { t } from "../../i18n/translations";

export default function FormAnalyzingScreen() {
  const router = useRouter();
  const { pendingFormInput, setFilledFields, language } = useBodhini();
  const [status, setStatus] = useState<"working" | "failed">("working");
  const [message, setMessage] = useState("Identifying form fields");
  const [busy, setBusy] = useState(false);

  const analyze = async () => {
    if (!pendingFormInput || busy) {
      if (!pendingFormInput) setStatus("failed");
      return;
    }
    setBusy(true);
    setStatus("working");
    setMessage(t(language, "detectFormFields"));
    try {
      const [fields, documents] = await Promise.all([
        services.formAnalyzer.analyze(pendingFormInput),
        services.documentRepository.getAll(),
      ]);
      setMessage(t(language, "matchDocuments"));
      const filled = services.fieldMatcher.match(fields, documents);
      setFilledFields(filled);
      router.replace("/forms/review");
    } catch (error) {
      setMessage(t(language, "pleaseTryAgain"));
      setStatus("failed");
    } finally { setBusy(false); }
  };

  useEffect(() => { analyze(); // one analysis per selected input
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingFormInput?.uri, pendingFormInput?.sampleId]);

  return <BodhiniScreen scroll={false} contentStyle={styles.page}>
    <Text style={styles.title}>{t(language, "analyzingForm")}</Text>
    <Text style={styles.subtitle}>{t(language, "findingFields")}</Text>
    <Text style={styles.scriptNote}>{t(language, "ocrScriptLimit")}</Text>
    <View style={styles.preview}>
      <View style={styles.paper}><Text style={styles.paperTitle}>{t(language, "applicationForm")}</Text>
        {[
          "Applicant Name", "Date of Birth", "Address", "PIN Code", "Phone Number",
        ].map((label, index) => <View key={label} style={styles.paperLine}><Text style={styles.paperLabel}>{index + 1}. {label}</Text><View style={styles.line} /></View>)}
      </View>
      {status === "working" ? <View style={styles.scanBadge}><ActivityIndicator size="small" color={colors.forest} /></View> : null}
    </View>
    <View style={styles.steps}>
      <View style={styles.step}><View style={[styles.stepIcon, status === "failed" ? styles.failed : styles.done]}>{status === "failed" ? <Text style={{ color: colors.danger }}>!</Text> : <Check size={14} color={colors.white} />}</View><Text style={styles.stepText}>{t(language, "detectFormFields")}</Text></View>
      <View style={styles.step}><View style={styles.stepIcon}><FileText size={14} color={colors.forest} /></View><Text style={styles.stepText}>{t(language, "matchDocuments")}</Text></View>
      <View style={styles.step}><View style={styles.stepIcon}><ActivityIndicator size="small" color={colors.forest} /></View><Text style={styles.stepText}>{t(language, "confidenceCheck")}</Text></View>
    </View>
    {status === "failed" ? <View style={styles.error}><Text style={styles.errorText}>{message}</Text><PrimaryButton title={t(language, "tryAgain")} onPress={analyze} loading={busy} style={{ marginTop: 12 }} /><PrimaryButton title={t(language, "chooseAnotherSource")} onPress={() => router.replace("/(tabs)/forms")} style={{ marginTop: 9, backgroundColor: colors.cardStrong }} /></View> : null}
    <View style={styles.privacy}><ShieldCheck color={colors.forest} size={22} /><Text style={styles.privacyText}>{t(language, "safetyRule")}</Text></View>
  </BodhiniScreen>;
}

const styles = StyleSheet.create({
  page: { paddingTop: 35 }, title: { color: colors.ink, fontFamily: "serif", fontSize: 28, fontWeight: "700", textAlign: "center" }, subtitle: { color: colors.muted, fontSize: 14, lineHeight: 21, textAlign: "center", marginTop: 9, paddingHorizontal: 10 }, scriptNote: { color: "#79512D", fontSize: 11, lineHeight: 16, textAlign: "center", paddingHorizontal: 12, marginTop: 8 },
  preview: { height: 330, marginTop: 28, backgroundColor: colors.card, borderRadius: 18, padding: 16, borderColor: colors.line, borderWidth: 1 }, paper: { flex: 1, backgroundColor: colors.paper, borderRadius: 8, padding: 16, gap: 17 }, paperTitle: { color: colors.ink, fontFamily: "serif", fontSize: 18, textAlign: "center", fontWeight: "700", marginBottom: 4 },
  paperLine: { gap: 8 }, paperLabel: { color: colors.ink, fontSize: 11 }, line: { height: 1, backgroundColor: "#D8CCBD" }, scanBadge: { position: "absolute", right: 25, top: 18, width: 34, height: 34, borderRadius: 17, backgroundColor: colors.forestLight, alignItems: "center", justifyContent: "center" },
  steps: { gap: 17, marginTop: 23 }, step: { flexDirection: "row", alignItems: "center", gap: 12 }, stepIcon: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.forestLight, borderWidth: 1, borderColor: colors.forest, alignItems: "center", justifyContent: "center" }, done: { backgroundColor: colors.forest }, failed: { backgroundColor: "#F8E1DD", borderColor: colors.danger }, stepText: { color: colors.ink, fontSize: 13 },
  privacy: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: "auto", padding: 13, backgroundColor: colors.forestLight, borderRadius: 14 }, privacyText: { flex: 1, color: colors.forest, fontSize: 11, lineHeight: 16 },
  error: { marginTop: 20, padding: 15, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, borderRadius: 16 }, errorText: { color: colors.danger, fontSize: 12, lineHeight: 18 },
});
