import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Check, FileText, ShieldCheck } from "lucide-react-native";
import { BodhiniScreen, PrimaryButton } from "../../components/ui/BodhiniUI";
import { useBodhini } from "../../state/AppContext";
import { services } from "../../composition/services";
import { colors } from "../../theme/tokens";
import { t } from "../../i18n/translations";
import { AppError } from "../../domain/errors/app.errors";
import { DemoDocumentProcessor } from "../../infrastructure/vision/demo/DemoDocumentProcessor";

export default function DocumentProcessingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ uri?: string }>();
  const uri = typeof params.uri === "string" ? params.uri : "";
  const { language, setPendingDocument } = useBodhini();
  const [status, setStatus] = useState<"working" | "failed">("working");
  const [message, setMessage] = useState("Reading text on this device");
  const [busy, setBusy] = useState(false);
  const [canUseDemo, setCanUseDemo] = useState(false);

  const analyze = async () => {
    if (!uri || busy) {
      if (!uri) setStatus("failed");
      return;
    }
    setBusy(true);
    setStatus("working");
    setCanUseDemo(false);
    setMessage("Reading text on this device");
    try {
      const analysis = await services.documentProcessor.analyze(uri, language);
      setMessage("Preparing your review");
      setPendingDocument({ imageUri: uri, analysis });
      router.replace("/scan/review");
    } catch (error) {
      const text = error instanceof AppError && error.code === "MODEL_UNAVAILABLE"
        ? t(language, "ocrDevBuildRequired")
        : t(language, "pleaseTryAgain");
      setMessage(text);
      setCanUseDemo(error instanceof AppError && error.code === "MODEL_UNAVAILABLE");
      setStatus("failed");
    } finally { setBusy(false); }
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

  useEffect(() => { analyze(); // one scan request per captured URI
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uri]);

  return <BodhiniScreen scroll={false} contentStyle={styles.page}>
    <View style={styles.top}><Text style={styles.title}>{t(language, "readingDocument")}</Text><Text style={styles.subtitle}>{t(language, "readingSubtitle")}</Text></View>
    <View style={styles.progressWrap}>
      <View style={styles.ring}><FileText color={colors.forest} size={43} strokeWidth={1.7} /></View>
      {status === "working" ? <ActivityIndicator size="small" color={colors.forest} style={styles.spinner} /> : null}
    </View>
    <View style={styles.steps}>
      <View style={styles.step}><View style={[styles.stepIcon, status === "working" ? styles.stepPending : styles.stepComplete]}>{status === "working" ? <ActivityIndicator color={colors.forest} size="small" /> : <Check color={colors.white} size={15} />}</View><Text style={styles.stepText}>{t(language, "onDeviceRecognition")}</Text></View>
      <View style={styles.step}><View style={[styles.stepIcon, status === "failed" ? styles.stepError : styles.stepPending]}>{status === "failed" ? <Text style={{ color: colors.danger }}>!</Text> : <Check color={colors.forest} size={15} />}</View><Text style={styles.stepText}>{t(language, "identifyDetails")}</Text></View>
      <View style={styles.step}><View style={[styles.stepIcon, styles.stepPending]}><FileText color={colors.forest} size={14} /></View><Text style={styles.stepText}>{t(language, "prepareReview")}</Text></View>
    </View>
    {status === "failed" ? <View style={styles.errorBox}><Text style={styles.errorText}>{message}</Text><PrimaryButton title={t(language, "tryAgain")} onPress={analyze} loading={busy} style={{ marginTop: 12 }} />{canUseDemo ? <PrimaryButton title={t(language, "continueWithDemo")} onPress={continueWithDemo} loading={busy} style={[styles.secondary, { marginTop: 9 }]} /> : null}<PrimaryButton title={t(language, "back")} onPress={() => router.replace("/scan/camera")} style={[styles.secondary, { marginTop: 9 }]} /></View> : <View style={styles.privacyBox}><ShieldCheck color={colors.terracotta} size={31} /><View style={{ flex: 1 }}><Text style={styles.privacyTitle}>{t(language, "processedOnDevice")}</Text><Text style={styles.privacyText}>{t(language, "noCloudUpload")}</Text></View></View>}
  </BodhiniScreen>;
}

const styles = StyleSheet.create({
  page: { paddingTop: 38, justifyContent: "flex-start" }, top: { alignItems: "center", paddingHorizontal: 10 }, title: { fontFamily: "serif", fontSize: 27, fontWeight: "700", color: colors.ink, textAlign: "center" }, subtitle: { color: colors.muted, fontSize: 14, lineHeight: 21, textAlign: "center", marginTop: 10 },
  progressWrap: { alignItems: "center", justifyContent: "center", marginTop: 48, marginBottom: 37 }, ring: { width: 172, height: 172, borderRadius: 86, borderWidth: 16, borderColor: "#DCE5D9", alignItems: "center", justifyContent: "center", backgroundColor: colors.card }, spinner: { position: "absolute", bottom: 4 },
  steps: { gap: 19 }, step: { flexDirection: "row", alignItems: "center", gap: 12 }, stepIcon: { width: 23, height: 23, borderRadius: 12, alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: colors.forest }, stepPending: { backgroundColor: colors.forestLight }, stepComplete: { backgroundColor: colors.forest }, stepError: { backgroundColor: "#F8E1DD", borderColor: colors.danger }, stepText: { color: colors.ink, fontSize: 14 },
  privacyBox: { marginTop: "auto", flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.cardStrong, borderRadius: 17, padding: 15 }, privacyTitle: { color: colors.ink, fontSize: 12, fontWeight: "700" }, privacyText: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 3 },
  errorBox: { marginTop: 28, padding: 16, borderRadius: 18, backgroundColor: colors.card, borderColor: colors.line, borderWidth: 1 }, errorText: { color: colors.danger, fontSize: 13, lineHeight: 19 }, secondary: { backgroundColor: colors.cardStrong },
});
