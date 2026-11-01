import React, { useEffect, useState, useRef } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Check, FileText, ShieldCheck } from "lucide-react-native";
import { BodhiniScreen, PrimaryButton } from "../../components/ui/BodhiniUI";
import { useBodhini } from "../../state/AppContext";
import { services } from "../../composition/services";
import { t } from "../../i18n/translations";
import { ScanLine, PulseDot, FadeInUp } from "../../components/motion";
import { useTheme } from "../../theme/ThemeProvider";

const statusMessages = [
  "Detecting form fields",
  "Matching with your documents",
  "Checking confidence and missing values",
];

export default function FormAnalyzingScreen() {
  const router = useRouter();
  const { pendingFormInput, setFilledFields, language } = useBodhini();
  const { colors } = useTheme();
  const [status, setStatus] = useState<"working" | "failed">("working");
  const [message, setMessage] = useState(statusMessages[0]);
  const [busy, setBusy] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const messageIndex = useRef(0);

  const analyze = async () => {
    if (!pendingFormInput || busy) {
      if (!pendingFormInput) setStatus("failed");
      return;
    }
    setBusy(true);
    setStatus("working");
    setMessage(statusMessages[0]);
    setStepIndex(0);
    messageIndex.current = 0;

    const messageInterval = setInterval(() => {
      messageIndex.current = (messageIndex.current + 1) % statusMessages.length;
      setMessage(statusMessages[messageIndex.current]);
    }, 1500);

    const stepInterval = setInterval(() => {
      setStepIndex((prev) => Math.min(prev + 1, 2));
    }, 1200);

    try {
      const [fields, documents] = await Promise.all([
        services.formAnalyzer.analyze(pendingFormInput),
        services.documentRepository.getAll(),
      ]);
      setMessage(statusMessages[2]);
      setStepIndex(2);
      const filled = services.fieldMatcher.match(fields, documents);
      setFilledFields(filled);
      router.replace("/forms/review");
    } catch (error) {
      clearInterval(messageInterval);
      clearInterval(stepInterval);
      setMessage(t(language, "pleaseTryAgain"));
      setStatus("failed");
    } finally {
      clearInterval(messageInterval);
      clearInterval(stepInterval);
      setBusy(false);
    }
  };

  useEffect(() => { analyze(); return () => {}; }, [pendingFormInput?.uri, pendingFormInput?.sampleId]);

  return (
    <BodhiniScreen scroll={false} contentStyle={styles.page}>
      <Text style={[styles.title, { color: colors.text }]}>{t(language, "analyzingForm")}</Text>
      <Text style={[styles.subtitle, { color: colors.textMuted }]}>{t(language, "findingFields")}</Text>
      <Text style={[styles.scriptNote, { color: colors.warning }]}>{t(language, "ocrScriptLimit")}</Text>
      <View style={[styles.preview, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.paper, { backgroundColor: colors.paper }]}><Text style={[styles.paperTitle, { color: colors.text }]}>{t(language, "applicationForm")}</Text>
          {[
            "Applicant Name", "Date of Birth", "Address", "PIN Code", "Phone Number",
          ].map((label, index) => (
            <View key={label} style={styles.paperLine}>
              <Text style={[styles.paperLabel, { color: colors.text }]}>{index + 1}. {label}</Text>
              <View style={[styles.line, { backgroundColor: colors.border }]} />
            </View>
          ))}
        </View>
        {status === "working" ? (
          <View style={[styles.scanBadge, { backgroundColor: colors.forestLight }]}>
            <ScanLine color={colors.primary} height={2} duration={1500} style={{ width: "100%" }} />
          </View>
        ) : null}
      </View>
      <View style={styles.steps}>
        <View style={styles.step}><View style={[styles.stepIcon, stepIndex >= 0 ? styles.stepDone : styles.stepPending]}>{stepIndex >= 0 ? <Check size={14} color={colors.onPrimary} /> : <ActivityIndicator size="small" color={colors.primary} />}</View><Text style={[styles.stepText, { color: colors.text }]}>{t(language, "detectFormFields")}</Text></View>
        <View style={styles.step}><View style={[styles.stepIcon, stepIndex >= 1 ? styles.stepDone : stepIndex === 0 ? styles.stepPending : styles.stepPending]}>{stepIndex >= 1 ? <Check size={14} color={colors.onPrimary} /> : <FileText size={14} color={colors.primary} />}</View><Text style={[styles.stepText, { color: colors.text }]}>{t(language, "matchDocuments")}</Text></View>
        <View style={styles.step}><View style={[styles.stepIcon, stepIndex >= 2 ? styles.stepDone : styles.stepPending]}>{stepIndex >= 2 ? <Check size={14} color={colors.onPrimary} /> : <ActivityIndicator size="small" color={colors.primary} />}</View><Text style={[styles.stepText, { color: colors.text }]}>{t(language, "confidenceCheck")}</Text></View>
      </View>
      <View style={styles.statusLine}><PulseDot color={colors.primary} size={6} /><Text style={[styles.statusText, { color: colors.textMuted }]}>{message}</Text></View>
      {status === "failed" ? (
        <View style={[styles.error, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.errorText, { color: colors.danger }]}>{message}</Text>
          <PrimaryButton title={t(language, "tryAgain")} onPress={analyze} loading={busy} style={{ marginTop: 12 }} />
          <PrimaryButton title={t(language, "chooseAnotherSource")} onPress={() => router.replace("/(tabs)/forms")} style={[styles.secondaryBtn, { marginTop: 9, backgroundColor: colors.surfaceAlt }]} />
        </View>
      ) : null}
      <View style={[styles.privacy, { backgroundColor: colors.forestLight }]}><ShieldCheck color={colors.forest} size={22} /><Text style={[styles.privacyText, { color: colors.forest }]}>{t(language, "safetyRule")}</Text></View>
    </BodhiniScreen>
  );
}

const styles = StyleSheet.create({
  page: { paddingTop: 35 },
  title: { fontFamily: "serif", fontSize: 28, fontWeight: "700", textAlign: "center" },
  subtitle: { fontSize: 14, lineHeight: 21, textAlign: "center", marginTop: 9, paddingHorizontal: 10 },
  scriptNote: { fontSize: 11, lineHeight: 16, textAlign: "center", paddingHorizontal: 12, marginTop: 8 },
  preview: { height: 330, marginTop: 28, borderRadius: 18, padding: 16, borderWidth: 1, position: "relative" },
  paper: { flex: 1, borderRadius: 8, padding: 16, gap: 17 },
  paperTitle: { fontFamily: "serif", fontSize: 18, textAlign: "center", fontWeight: "700", marginBottom: 4 },
  paperLine: { gap: 8 },
  paperLabel: { fontSize: 11 },
  line: { height: 1 },
  scanBadge: { position: "absolute", right: 25, top: 18, width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  steps: { gap: 17, marginTop: 23 },
  step: { flexDirection: "row", alignItems: "center", gap: 12 },
  stepIcon: { width: 22, height: 22, borderRadius: 11, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  stepPending: {},
  stepDone: {},
  stepFailed: {},
  stepText: { fontSize: 13 },
  statusLine: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 16, marginBottom: 8 },
  statusText: { fontSize: 12 },
  privacy: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: "auto", padding: 13, borderRadius: 14 },
  privacyText: { flex: 1, fontSize: 11, lineHeight: 16 },
  error: { marginTop: 20, padding: 15, borderWidth: 1, borderRadius: 16 },
  errorText: { fontSize: 12, lineHeight: 18 },
  secondaryBtn: {},
});