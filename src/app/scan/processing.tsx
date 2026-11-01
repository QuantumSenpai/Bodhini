import React, { useEffect, useState, useRef } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Check, FileText, ShieldCheck } from "lucide-react-native";
import { BodhiniScreen, PrimaryButton, StatusPill } from "../../components/ui/BodhiniUI";
import { useBodhini } from "../../state/AppContext";
import { services } from "../../composition/services";
import { t } from "../../i18n/translations";
import { AppError } from "../../domain/errors/app.errors";
import { DemoDocumentProcessor } from "../../infrastructure/vision/demo/DemoDocumentProcessor";
import { ScanLine, PulseDot, FadeInUp } from "../../components/motion";
import { useTheme } from "../../theme/ThemeProvider";

const statusMessages = [
  "Reading text on this device",
  "Identifying document details",
  "Preparing your review",
];

export default function DocumentProcessingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ uri?: string }>();
  const uri = typeof params.uri === "string" ? params.uri : "";
  const { language, setPendingDocument } = useBodhini();
  const { colors } = useTheme();
  const [status, setStatus] = useState<"working" | "failed">("working");
  const [message, setMessage] = useState(statusMessages[0]);
  const [busy, setBusy] = useState(false);
  const [canUseDemo, setCanUseDemo] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const messageIndex = useRef(0);

  const analyze = async () => {
    if (!uri || busy) {
      if (!uri) setStatus("failed");
      return;
    }
    setBusy(true);
    setStatus("working");
    setCanUseDemo(false);
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
      const analysis = await services.documentProcessor.analyze(uri, language);
      setMessage("Preparing your review");
      setStepIndex(2);
      setPendingDocument({ imageUri: uri, analysis });
      router.replace("/scan/review");
    } catch (error) {
      clearInterval(messageInterval);
      clearInterval(stepInterval);
      const text = error instanceof AppError && error.code === "MODEL_UNAVAILABLE"
        ? t(language, "ocrDevBuildRequired")
        : t(language, "pleaseTryAgain");
      setMessage(text);
      setCanUseDemo(error instanceof AppError && error.code === "MODEL_UNAVAILABLE");
      setStatus("failed");
    } finally {
      clearInterval(messageInterval);
      clearInterval(stepInterval);
      setBusy(false);
    }
  };

  const continueWithDemo = async () => {
    if (!uri || busy) return;
    setBusy(true);
    try {
      const analysis = await DemoDocumentProcessor.analyze(uri, language);
      setPendingDocument({ imageUri: uri, analysis });
      router.replace("/scan/review");
    } catch {
      Alert.alert(t(language, "pleaseTryAgain"));
    } finally { setBusy(false); }
  };

  useEffect(() => { analyze(); return () => {}; }, [uri]);

  return (
    <BodhiniScreen scroll={false} contentStyle={styles.page}>
      <View style={styles.top}>
        <Text style={[styles.title, { color: colors.text }]}>{t(language, "readingDocument")}</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>{t(language, "readingSubtitle")}</Text>
      </View>
      <View style={styles.progressWrap}>
        <View style={[styles.documentCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.docHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.docType, { color: colors.text }]}>Document</Text>
            <StatusPill label={t(language, "onDeviceRecognition")} tone="green" />
          </View>
          <View style={styles.docContent}>
            <View style={styles.placeholderRow}>
              <View style={[styles.placeholderLabel, { backgroundColor: colors.border }]} />
              <View style={[styles.placeholderValue, { backgroundColor: colors.surfaceAlt }]} />
            </View>
            <View style={styles.placeholderRow}>
              <View style={[styles.placeholderLabel, { backgroundColor: colors.border }]} />
              <View style={[styles.placeholderValue, { backgroundColor: colors.surfaceAlt }]} />
            </View>
            <View style={styles.placeholderRow}>
              <View style={[styles.placeholderLabel, { backgroundColor: colors.border }]} />
              <View style={[styles.placeholderValue, { backgroundColor: colors.surfaceAlt }]} />
            </View>
            <ScanLine color={colors.primary} height={2} duration={1800} />
          </View>
        </View>
      </View>
      <View style={styles.steps}>
        <View style={styles.step}><View style={[styles.stepIcon, stepIndex >= 0 ? styles.stepComplete : styles.stepPending]}>{stepIndex >= 0 ? <Check color={colors.onPrimary} size={15} /> : <ActivityIndicator color={colors.primary} size="small" />}</View><Text style={[styles.stepText, { color: colors.text }]}>{t(language, "onDeviceRecognition")}</Text></View>
        <View style={styles.step}><View style={[styles.stepIcon, stepIndex >= 1 ? styles.stepComplete : stepIndex === 0 ? styles.stepPending : styles.stepPending]}>{stepIndex >= 1 ? <Check color={colors.onPrimary} size={15} /> : <FileText color={colors.primary} size={14} />}</View><Text style={[styles.stepText, { color: colors.text }]}>{t(language, "identifyDetails")}</Text></View>
        <View style={styles.step}><View style={[styles.stepIcon, stepIndex >= 2 ? styles.stepComplete : styles.stepPending]}>{stepIndex >= 2 ? <Check color={colors.onPrimary} size={15} /> : <ActivityIndicator color={colors.primary} size="small" />}</View><Text style={[styles.stepText, { color: colors.text }]}>{t(language, "prepareReview")}</Text></View>
      </View>
      <View style={styles.statusLine}><PulseDot color={colors.primary} size={6} /><Text style={[styles.statusText, { color: colors.textMuted }]}>{message}</Text></View>
      {status === "failed" ? (
        <View style={[styles.errorBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.errorText, { color: colors.danger }]}>{message}</Text>
          <PrimaryButton title={t(language, "tryAgain")} onPress={analyze} loading={busy} style={{ marginTop: 12 }} />
          {canUseDemo ? <PrimaryButton title={t(language, "continueWithDemo")} onPress={continueWithDemo} loading={busy} style={[styles.secondaryBtn, { marginTop: 9, backgroundColor: colors.surfaceAlt }]} /> : null}
          <PrimaryButton title={t(language, "back")} onPress={() => router.replace("/scan/camera")} style={[styles.secondaryBtn, { marginTop: 9, backgroundColor: colors.surfaceAlt }]} />
        </View>
      ) : (
        <View style={[styles.privacyBox, { backgroundColor: colors.cardStrong }]}><ShieldCheck color={colors.terracotta} size={31} /><View style={{ flex: 1 }}><Text style={[styles.privacyTitle, { color: colors.text }]}>{t(language, "processedOnDevice")}</Text><Text style={[styles.privacyText, { color: colors.textMuted }]}>{t(language, "noCloudUpload")}</Text></View></View>
      )}
    </BodhiniScreen>
  );
}

const styles = StyleSheet.create({
  page: { paddingTop: 38, justifyContent: "flex-start" },
  top: { alignItems: "center", paddingHorizontal: 10 },
  title: { fontFamily: "serif", fontSize: 27, fontWeight: "700", textAlign: "center" },
  subtitle: { fontSize: 14, lineHeight: 21, textAlign: "center", marginTop: 10 },
  progressWrap: { alignItems: "center", justifyContent: "center", marginTop: 48, marginBottom: 37 },
  documentCard: { width: "90%", maxWidth: 320, borderRadius: 16, borderWidth: 1, overflow: "hidden", shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  docHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 12, borderBottomWidth: 1 },
  docType: { fontFamily: "serif", fontSize: 15, fontWeight: "600" },
  docContent: { padding: 12, gap: 10, position: "relative" },
  placeholderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  placeholderLabel: { width: "35%", height: 14, borderRadius: 4 },
  placeholderValue: { width: "55%", height: 14, borderRadius: 4 },
  steps: { gap: 19 },
  step: { flexDirection: "row", alignItems: "center", gap: 12 },
  stepIcon: { width: 23, height: 23, borderRadius: 12, alignItems: "center", justifyContent: "center", borderWidth: 1.5 },
  stepPending: {},
  stepComplete: {},
  stepError: {},
  stepText: { fontSize: 14 },
  statusLine: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 24, marginBottom: 16 },
  statusText: { fontSize: 12 },
  privacyBox: { marginTop: "auto", flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 17, padding: 15 },
  privacyTitle: { fontSize: 12, fontWeight: "700" },
  privacyText: { fontSize: 11, lineHeight: 16, marginTop: 3 },
  errorBox: { marginTop: 28, padding: 16, borderRadius: 18, borderWidth: 1 },
  errorText: { fontSize: 13, lineHeight: 19 },
  secondaryBtn: {},
});