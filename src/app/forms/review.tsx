import React, { useMemo, useState, useRef, useEffect } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Copy, ShieldCheck } from "lucide-react-native";
import * as Clipboard from "expo-clipboard";
import { BodhiniScreen, FieldInput, PageHeading, PrimaryButton, StatusPill, TopBar } from "../../components/ui/BodhiniUI";
import { useBodhini } from "../../state/AppContext";
import type { FilledField } from "../../domain/form/form.types";
import { t } from "../../i18n/translations";
import { FadeInUp } from "../../components/motion";
import { useTheme } from "../../theme/ThemeProvider";

function statusLabel(status: FilledField["status"], language: "en" | "bn" | "hi"): string {
  if (status === "FILLED") return t(language, "matched");
  if (status === "SKIPPED") return t(language, "skipped");
  return t(language, "missing");
}

export default function FormReviewScreen() {
  const router = useRouter();
  const { filledFields, setFilledFields, language } = useBodhini();
  const { colors } = useTheme();
  const [copyingId, setCopyingId] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const counts = useMemo(() => ({
    filled: filledFields.filter((field) => field.status === "FILLED").length,
    missing: filledFields.filter((field) => field.status === "NEEDS_USER").length,
    skipped: filledFields.filter((field) => field.status === "SKIPPED").length,
  }), [filledFields]);

  const updateField = (id: string, value: string) => {
    setFocusedField(id);
    setTimeout(() => setFocusedField(null), 300);
    setFilledFields((current) => current.map((item) => {
      if (item.field.id !== id || item.status === "SKIPPED") return item;
      const nextValue = value;
      return { ...item, value: nextValue, status: nextValue.trim() ? "FILLED" : "NEEDS_USER", confidence: nextValue.trim() ? 1 : 0 };
    }));
  };

  const copyValue = async (field: FilledField) => {
    if (field.status !== "FILLED" || !field.value) return;
    setCopyingId(field.field.id);
    try {
      await Clipboard.setStringAsync(field.value, { android: { isSensitive: true } });
      Alert.alert(t(language, "copied"), `${field.field.label}: ${t(language, "copied")}`);
    } catch {
      Alert.alert(t(language, "copyFailed"), t(language, "pleaseTryAgain"));
    } finally { setCopyingId(null); }
  };

  if (filledFields.length === 0) {
    return (
      <BodhiniScreen contentStyle={styles.page}>
        <TopBar onBack={() => router.back()} />
        <PageHeading title={t(language, "nothingToReview")} subtitle={t(language, "chooseAnotherSource")} />
        <PrimaryButton title={t(language, "chooseAForm")} onPress={() => router.replace("/(tabs)/forms")} />
      </BodhiniScreen>
    );
  }

  return (
    <BodhiniScreen contentStyle={styles.page}>
      <TopBar title={t(language, "reviewFilledForm")} onBack={() => router.back()} />
      <PageHeading title={t(language, "reviewFilledForm")} subtitle={t(language, "reviewMatched")} />
      <View style={[styles.summary, { backgroundColor: colors.forestLight }]}>
        <View><Text style={[styles.summaryNumber, { color: colors.forest }]}>{counts.filled}</Text><Text style={[styles.summaryLabel, { color: colors.forest }]}>{t(language, "matched")}</Text></View>
        <View><Text style={[styles.summaryNumber, { color: colors.forest }]}>{counts.missing}</Text><Text style={[styles.summaryLabel, { color: colors.forest }]}>{t(language, "needsInput")}</Text></View>
        <View><Text style={[styles.summaryNumber, { color: colors.forest }]}>{counts.skipped}</Text><Text style={[styles.summaryLabel, { color: colors.forest }]}>{t(language, "manual")}</Text></View>
      </View>
      <View style={[styles.formPaper, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.formTitle, { color: colors.text }]}>{t(language, "applicationForm")}</Text>
        <Text style={[styles.formSub, { color: colors.textMuted }]}>{t(language, "reviewValuesBelow")}</Text>
        {filledFields.map((item, index) => {
          const isSkipped = item.status === "SKIPPED";
          const isAadhaar = item.matchedKey === "AADHAAR_NO";
          const visibleValue = item.value ?? "";
          return (
            <FadeInUp key={item.field.id} index={index} maxAnimated={8}>
              <View style={[styles.formField, { borderTopColor: colors.border }]}>
                <View style={styles.fieldTop}>
                  <Text style={[styles.fieldTitle, { color: colors.text }]}>{index + 1}. {item.field.label}</Text>
                  <StatusPill label={statusLabel(item.status, language)} tone={item.status === "FILLED" ? "green" : item.status === "SKIPPED" ? "neutral" : "gold"} />
                </View>
                {isSkipped ? (
                  <Text style={[styles.manualNote, { color: colors.textMuted }]}>{item.matchReason ?? t(language, "manualComplete")}</Text>
                ) : (
                  <>
                    <View style={focusedField === item.field.id ? styles.fieldInputWrapperFocused : styles.fieldInputWrapper}>
                      <FieldInput
                        label={t(language, "answer")}
                        value={visibleValue}
                        onChangeText={(value) => updateField(item.field.id, value)}
                        placeholder={t(language, "enterAnswer")}
                        multiline={item.field.key === "ADDRESS"}
                      />
                    </View>
                    {isAadhaar && visibleValue ? <Text style={[styles.maskNote, { color: colors.textMuted }]}>{t(language, "sensitiveCopyNote")}</Text> : null}
                    {item.status === "FILLED" && item.value ? (
                      <Pressable onPress={() => copyValue(item)} style={[styles.copyButton, { backgroundColor: colors.forestLight }]}>
                        <Copy size={14} color={colors.primary} />
                        <Text style={[styles.copyText, { color: colors.primary }]}>{copyingId === item.field.id ? t(language, "copying") : t(language, "copyAnswer")}</Text>
                      </Pressable>
                    ) : (
                      <Text style={[styles.missingNote, { color: colors.warning }]}>{item.matchReason ?? t(language, "missingValue")}</Text>
                    )}
                  </>
                )}
              </View>
            </FadeInUp>
          );
        })}
      </View>
      <View style={[styles.safety, { backgroundColor: colors.forestLight }]}><ShieldCheck size={20} color={colors.forest} /><Text style={[styles.safetyText, { color: colors.forest }]}>{t(language, "safetyRule")}</Text></View>
      <PrimaryButton title={t(language, "exportSave")} onPress={() => router.push("/forms/result")} style={{ marginTop: 19 }} />
    </BodhiniScreen>
  );
}

const styles = StyleSheet.create({
  page: { paddingTop: 8 },
  summary: { flexDirection: "row", justifyContent: "space-around", padding: 13, borderRadius: 15, marginBottom: 14 },
  summaryNumber: { fontFamily: "serif", fontSize: 21, fontWeight: "700", textAlign: "center" },
  summaryLabel: { fontSize: 10, textAlign: "center", marginTop: 2 },
  formPaper: { borderWidth: 1, borderRadius: 17, padding: 15 },
  formTitle: { fontFamily: "serif", fontSize: 19, fontWeight: "700", textAlign: "center" },
  formSub: { fontSize: 11, textAlign: "center", marginTop: 4, marginBottom: 13 },
  formField: { paddingVertical: 12, borderTopWidth: 1 },
  fieldTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 10 },
  fieldTitle: { flex: 1, fontSize: 13, fontWeight: "600" },
  fieldInputWrapper: {},
  fieldInputWrapperFocused: { borderWidth: 2, borderRadius: 12 },
  copyButton: { alignSelf: "flex-start", flexDirection: "row", gap: 6, alignItems: "center", paddingVertical: 7, paddingHorizontal: 10, borderRadius: 12, marginTop: -4 },
  copyText: { fontSize: 11, fontWeight: "700" },
  missingNote: { fontSize: 11, marginTop: -4, lineHeight: 16 },
  manualNote: { fontSize: 12, lineHeight: 18 },
  maskNote: { fontSize: 10, marginTop: -5, marginBottom: 8 },
  safety: { flexDirection: "row", gap: 9, alignItems: "center", padding: 13, marginTop: 14, borderRadius: 14 },
  safetyText: { fontSize: 11, lineHeight: 16, flex: 1 },
});