import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Check, FileText, ShieldCheck } from "lucide-react-native";
import { BodhiniScreen, PrimaryButton, SecondaryButton, TopBar } from "../../components/ui/BodhiniUI";
import { useBodhini } from "../../state/AppContext";
import { services } from "../../composition/services";
import { t, type TranslationKey } from "../../i18n/translations";
import { PulseDot, ScanLine } from "../../components/motion";
import { useTheme } from "../../theme/ThemeProvider";

const statusMessageKeys: TranslationKey[] = [
  "detectFormFields",
  "matchDocuments",
  "confidenceCheck",
];

const previewFieldKeys: TranslationKey[] = [
  "fieldFullName",
  "fieldDob",
  "fieldAadhaarNo",
  "fieldAddress",
];

export default function FormAnalyzingScreen() {
  const router = useRouter();
  const { pendingFormInput, setFilledFields, language } = useBodhini();
  const { colors, theme } = useTheme();
  const [status, setStatus] = useState<"working" | "failed">("working");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [msgIdx, setMsgIdx] = useState(0);
  const busyRef = useRef(false);

  const analyze = useCallback(async () => {
    if (!pendingFormInput || busyRef.current) {
      if (!pendingFormInput) setStatus("failed");
      return;
    }
    busyRef.current = true;
    setBusy(true);
    setStatus("working");
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
      const [fields, documents] = await Promise.all([
        services.formAnalyzer.analyze(pendingFormInput),
        services.documentRepository.getAll(),
      ]);
      setStepIndex(2);
      setMsgIdx(2);
      const filled = services.fieldMatcher.match(fields, documents);
      setFilledFields(filled);
      router.replace("/forms/review");
    } catch {
      clearInterval(messageInterval);
      clearInterval(stepInterval);
      setErrorMessage(t(language, "pleaseTryAgain"));
      setStatus("failed");
    } finally {
      clearInterval(messageInterval);
      clearInterval(stepInterval);
      busyRef.current = false;
      setBusy(false);
    }
  }, [language, pendingFormInput, router, setFilledFields]);

  useEffect(() => {
    analyze();
  }, [analyze]);

  const activeMessage = errorMessage ?? t(language, statusMessageKeys[msgIdx] ?? "detectFormFields");

  return (
    <BodhiniScreen scroll={true} contentStyle={styles.page}>
      <TopBar onBack={() => router.back()} />
      <Text style={[styles.title, { color: colors.text, fontSize: theme.typeScale.title.fontSize }]}>
        {t(language, "analyzingForm")}
      </Text>
      <Text style={[styles.subtitle, { color: colors.secondaryText, fontSize: theme.typeScale.caption.fontSize }]}>
        {t(language, "findingFields")}
      </Text>

      <View style={[styles.preview, { backgroundColor: colors.surface, borderColor: colors.primary }]}>
        <View style={[styles.paper, { backgroundColor: colors.background }]}>
          <Text style={[styles.paperTitle, { color: colors.text, fontSize: theme.typeScale.bodyStrong.fontSize }]}>
            {t(language, "applicationForm")}
          </Text>
          {previewFieldKeys.map((key, index) => (
            <View key={key} style={styles.paperLine}>
              <Text style={[styles.paperLabel, { color: colors.secondaryText, fontSize: theme.typeScale.label.fontSize }]}>
                {index + 1}. {t(language, key)}
              </Text>
              <View style={[styles.line, { backgroundColor: colors.separator }]} />
            </View>
          ))}
          {status === "working" ? <ScanLine color={colors.primary} height={2.5} duration={1500} travel={160} /> : null}
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
                  <Check size={14} color={colors.onPrimary} strokeWidth={3} />
                ) : active ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <FileText size={13} color={colors.secondaryText} />
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
          {activeMessage}
        </Text>
      </View>

      {status === "failed" ? (
        <View style={[styles.error, { backgroundColor: colors.surface, borderColor: colors.separator }]}>
          <Text style={[styles.errorText, { color: colors.danger, fontSize: theme.typeScale.captionStrong.fontSize }]}>
            {activeMessage}
          </Text>
          <PrimaryButton title={t(language, "tryAgain")} onPress={analyze} loading={busy} style={styles.btnGap} />
          <SecondaryButton
            title={t(language, "chooseAnotherSource")}
            onPress={() => router.replace("/(tabs)/forms")}
            style={styles.btnGap}
          />
        </View>
      ) : (
        <View style={[styles.privacy, { backgroundColor: colors.forestLight }]}>
          <ShieldCheck color={colors.forest} size={22} />
          <Text style={[styles.privacyText, { color: colors.forest, fontSize: theme.typeScale.label.fontSize }]}>
            {t(language, "safetyRule")}
          </Text>
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
  title: {
    fontWeight: "700",
    textAlign: "center",
  },
  subtitle: {
    lineHeight: 20,
    textAlign: "center",
    marginTop: 6,
    paddingHorizontal: 10,
  },
  preview: {
    marginVertical: 20,
    borderRadius: 20,
    padding: 14,
    borderWidth: 2,
  },
  paper: {
    borderRadius: 12,
    padding: 16,
    gap: 14,
    position: "relative",
    overflow: "hidden",
  },
  paperTitle: {
    textAlign: "center",
    fontWeight: "700",
    marginBottom: 4,
  },
  paperLine: {
    gap: 6,
  },
  paperLabel: {
    fontWeight: "500",
  },
  line: {
    height: 1,
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
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
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
    marginVertical: 14,
  },
  statusText: {},
  privacy: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 16,
  },
  privacyText: {
    flex: 1,
    lineHeight: 17,
  },
  error: {
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
  },
  errorText: {
    lineHeight: 18,
    marginBottom: 4,
  },
  btnGap: {
    marginTop: 10,
  },
});
