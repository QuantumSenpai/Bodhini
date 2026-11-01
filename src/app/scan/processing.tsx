import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Check, FileText, ShieldCheck } from "lucide-react-native";
import { BodhiniScreen, PrimaryButton, SecondaryButton, StatusPill, TopBar } from "../../components/ui/BodhiniUI";
import { useBodhini } from "../../state/AppContext";
import { services } from "../../composition/services";
import { t, type TranslationKey } from "../../i18n/translations";
import { AppError } from "../../domain/errors/app.errors";
import { DemoDocumentProcessor } from "../../infrastructure/vision/demo/DemoDocumentProcessor";
import { PulseDot, ScanLine } from "../../components/motion";
import { useTheme } from "../../theme/ThemeProvider";

const statusMessageKeys: TranslationKey[] = [
  "onDeviceRecognition",
  "identifyDetails",
  "prepareReview",
];

export default function DocumentProcessingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ uri?: string }>();
  const uri = typeof params.uri === "string" ? params.uri : "";
  const { language, setPendingDocument } = useBodhini();
  const { colors, theme } = useTheme();
  const [status, setStatus] = useState<"working" | "failed">("working");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [canUseDemo, setCanUseDemo] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [msgIdx, setMsgIdx] = useState(0);
  const busyRef = useRef(false);

  const analyze = useCallback(async () => {
    if (!uri || busyRef.current) {
      if (!uri) setStatus("failed");
      return;
    }
    busyRef.current = true;
    setBusy(true);
    setStatus("working");
    setCanUseDemo(false);
    setErrorMessage(null);
    setStepIndex(0);
    setMsgIdx(0);

    const messageInterval = setInterval(() => {
      setMsgIdx((prev) => (prev + 1) % statusMessageKeys.length);
    }, 1400);

    const stepInterval = setInterval(() => {
      setStepIndex((prev) => Math.min(prev + 1, 2));
    }, 1100);

    try {
      const analysis = await services.documentProcessor.analyze(uri, language);
      setStepIndex(2);
      setMsgIdx(2);
      setPendingDocument({ imageUri: uri, analysis });
      router.replace("/scan/review");
    } catch (error) {
      clearInterval(messageInterval);
      clearInterval(stepInterval);
      const isModelUnavailable = error instanceof AppError && error.code === "MODEL_UNAVAILABLE";
      const text = isModelUnavailable ? t(language, "ocrDevBuildRequired") : t(language, "pleaseTryAgain");
      setErrorMessage(text);
      setCanUseDemo(isModelUnavailable);
      setStatus("failed");
    } finally {
      clearInterval(messageInterval);
      clearInterval(stepInterval);
      busyRef.current = false;
      setBusy(false);
    }
  }, [language, router, setPendingDocument, uri]);

  const continueWithDemo = useCallback(async () => {
    if (!uri || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      const analysis = await DemoDocumentProcessor.analyze(uri, language);
      setPendingDocument({ imageUri: uri, analysis });
      router.replace("/scan/review");
    } catch {
      Alert.alert(t(language, "pleaseTryAgain"));
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }, [language, router, setPendingDocument, uri]);

  useEffect(() => {
    analyze();
  }, [analyze]);

  const activeStatusText = errorMessage ?? t(language, statusMessageKeys[msgIdx] ?? "onDeviceRecognition");

  return (
    <BodhiniScreen scroll={true} contentStyle={styles.page}>
      <TopBar onBack={() => router.back()} />
      <View style={styles.top}>
        <Text style={[styles.title, { color: colors.text, fontSize: theme.typeScale.title.fontSize }]}>
          {t(language, "readingDocument")}
        </Text>
        <Text style={[styles.subtitle, { color: colors.secondaryText, fontSize: theme.typeScale.caption.fontSize }]}>
          {t(language, "readingSubtitle")}
        </Text>
      </View>

      <View style={styles.progressWrap}>
        <View style={[styles.documentOutline, { backgroundColor: colors.surface, borderColor: colors.primary }]}>
          <View style={[styles.docHeader, { borderBottomColor: colors.separator }]}>
            <Text style={[styles.docType, { color: colors.text, fontSize: theme.typeScale.captionStrong.fontSize }]}>
              {t(language, "docTypeOther")}
            </Text>
            <StatusPill label={t(language, "sourceOcr")} tone="green" />
          </View>
          <View style={styles.docContent}>
            <View style={styles.placeholderRow}>
              <View style={[styles.placeholderLabel, { backgroundColor: colors.separator }]} />
              <View style={[styles.placeholderValue, { backgroundColor: colors.surfaceAlt }]} />
            </View>
            <View style={styles.placeholderRow}>
              <View style={[styles.placeholderLabel, { backgroundColor: colors.separator }]} />
              <View style={[styles.placeholderValue, { backgroundColor: colors.surfaceAlt }]} />
            </View>
            <View style={styles.placeholderRow}>
              <View style={[styles.placeholderLabel, { backgroundColor: colors.separator }]} />
              <View style={[styles.placeholderValue, { backgroundColor: colors.surfaceAlt }]} />
            </View>
            {status === "working" ? <ScanLine color={colors.primary} height={2.5} duration={1600} travel={96} /> : null}
          </View>
        </View>
      </View>

      <View style={styles.steps}>
        {statusMessageKeys.map((key, idx) => {
          const done = stepIndex > idx;
          const active = stepIndex === idx;
          return (
            <View key={key} style={styles.step}>
              <View
                style={[
                  styles.stepIcon,
                  {
                    backgroundColor: done ? colors.success : colors.surface,
                    borderColor: done ? colors.success : active ? colors.primary : colors.separator,
                  },
                ]}
              >
                {done ? (
                  <Check color={colors.onPrimary} size={14} strokeWidth={3} />
                ) : active ? (
                  <ActivityIndicator color={colors.primary} size="small" />
                ) : (
                  <FileText color={colors.secondaryText} size={13} />
                )}
              </View>
              <Text style={[styles.stepText, { color: colors.text, fontSize: theme.typeScale.captionStrong.fontSize }]}>
                {t(language, key)}
              </Text>
            </View>
          );
        })}
      </View>

      <View style={styles.statusLine}>
        <PulseDot color={status === "failed" ? colors.danger : colors.primary} size={8} />
        <Text style={[styles.statusText, { color: colors.secondaryText, fontSize: theme.typeScale.caption.fontSize }]}>
          {activeStatusText}
        </Text>
      </View>

      {status === "failed" ? (
        <View style={[styles.errorBox, { backgroundColor: colors.surface, borderColor: colors.separator }]}>
          <Text style={[styles.errorText, { color: colors.danger, fontSize: theme.typeScale.captionStrong.fontSize }]}>
            {activeStatusText}
          </Text>
          <PrimaryButton title={t(language, "tryAgain")} onPress={analyze} loading={busy} style={styles.btnGap} />
          {canUseDemo ? (
            <SecondaryButton
              title={t(language, "continueWithDemo")}
              onPress={continueWithDemo}
              style={styles.btnGap}
            />
          ) : null}
          <SecondaryButton
            title={t(language, "back")}
            onPress={() => router.replace("/scan/camera")}
            style={styles.btnGap}
          />
        </View>
      ) : (
        <View style={[styles.privacyBox, { backgroundColor: colors.forestLight }]}>
          <ShieldCheck color={colors.forest} size={24} />
          <View style={styles.privacyTextWrap}>
            <Text style={[styles.privacyTitle, { color: colors.forest, fontSize: theme.typeScale.captionStrong.fontSize }]}>
              {t(language, "processedOnDevice")}
            </Text>
            <Text style={[styles.privacyText, { color: colors.forest, fontSize: theme.typeScale.label.fontSize }]}>
              {t(language, "noCloudUpload")}
            </Text>
          </View>
        </View>
      )}
    </BodhiniScreen>
  );
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 4,
    justifyContent: "space-between",
  },
  top: {
    alignItems: "center",
    paddingHorizontal: 12,
  },
  title: {
    fontWeight: "700",
    textAlign: "center",
  },
  subtitle: {
    lineHeight: 20,
    textAlign: "center",
    marginTop: 8,
  },
  progressWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 28,
  },
  documentOutline: {
    width: "92%",
    maxWidth: 320,
    borderRadius: 20,
    borderWidth: 2,
    overflow: "hidden",
  },
  docHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  docType: {
    fontWeight: "600",
  },
  docContent: {
    padding: 18,
    gap: 14,
    minHeight: 124,
    position: "relative",
  },
  placeholderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  placeholderLabel: {
    width: "34%",
    height: 12,
    borderRadius: 4,
  },
  placeholderValue: {
    width: "56%",
    height: 12,
    borderRadius: 4,
  },
  steps: {
    gap: 14,
    paddingHorizontal: 8,
  },
  step: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  stepIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },
  stepText: {
    flex: 1,
    fontWeight: "500",
  },
  statusLine: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginVertical: 16,
  },
  statusText: {
    textAlign: "center",
  },
  privacyBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    padding: 16,
  },
  privacyTextWrap: {
    flex: 1,
    gap: 2,
  },
  privacyTitle: {
    fontWeight: "600",
  },
  privacyText: {
    lineHeight: 16,
  },
  errorBox: {
    padding: 16,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  errorText: {
    lineHeight: 20,
    marginBottom: 4,
  },
  btnGap: {
    marginTop: 10,
  },
});
