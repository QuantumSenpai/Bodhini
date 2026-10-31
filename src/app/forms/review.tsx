import React, { useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Copy, ShieldCheck } from "lucide-react-native";
import * as Clipboard from "expo-clipboard";
import { BodhiniScreen, FieldInput, PageHeading, PrimaryButton, StatusPill, TopBar } from "../../components/ui/BodhiniUI";
import { useBodhini } from "../../state/AppContext";
import type { FilledField } from "../../domain/form/form.types";
import { colors } from "../../theme/tokens";
import { t } from "../../i18n/translations";

function statusLabel(status: FilledField["status"], language: "en" | "bn" | "hi"): string {
  if (status === "FILLED") return t(language, "matched");
  if (status === "SKIPPED") return t(language, "skipped");
  return t(language, "missing");
}

export default function FormReviewScreen() {
  const router = useRouter();
  const { filledFields, setFilledFields, language } = useBodhini();
  const [copyingId, setCopyingId] = useState<string | null>(null);

  const counts = useMemo(() => ({
    filled: filledFields.filter((field) => field.status === "FILLED").length,
    missing: filledFields.filter((field) => field.status === "NEEDS_USER").length,
    skipped: filledFields.filter((field) => field.status === "SKIPPED").length,
  }), [filledFields]);

  const updateField = (id: string, value: string) => {
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
    return <BodhiniScreen contentStyle={styles.page}><TopBar onBack={() => router.back()} /><PageHeading title={t(language, "nothingToReview")} subtitle={t(language, "chooseAnotherSource")} /><PrimaryButton title={t(language, "chooseAForm")} onPress={() => router.replace("/(tabs)/forms")} /></BodhiniScreen>;
  }

  return <BodhiniScreen contentStyle={styles.page}>
    <TopBar title={t(language, "reviewFilledForm")} onBack={() => router.back()} />
    <PageHeading title={t(language, "reviewFilledForm")} subtitle={t(language, "reviewMatched")} />
    <View style={styles.summary}><View><Text style={styles.summaryNumber}>{counts.filled}</Text><Text style={styles.summaryLabel}>{t(language, "matched")}</Text></View><View><Text style={styles.summaryNumber}>{counts.missing}</Text><Text style={styles.summaryLabel}>{t(language, "needsInput")}</Text></View><View><Text style={styles.summaryNumber}>{counts.skipped}</Text><Text style={styles.summaryLabel}>{t(language, "manual")}</Text></View></View>
    <View style={styles.formPaper}>
      <Text style={styles.formTitle}>{t(language, "applicationForm")}</Text><Text style={styles.formSub}>{t(language, "reviewValuesBelow")}</Text>
      {filledFields.map((item, index) => {
        const isSkipped = item.status === "SKIPPED";
        const isAadhaar = item.matchedKey === "AADHAAR_NO";
        const visibleValue = item.value ?? "";
        return <View key={item.field.id} style={styles.formField}>
          <View style={styles.fieldTop}><Text style={styles.fieldTitle}>{index + 1}. {item.field.label}</Text><StatusPill label={statusLabel(item.status, language)} tone={item.status === "FILLED" ? "green" : item.status === "SKIPPED" ? "neutral" : "gold"} /></View>
          {isSkipped ? <Text style={styles.manualNote}>{item.matchReason ?? t(language, "manualComplete")}</Text> : <>
            <FieldInput label={t(language, "answer")} value={visibleValue} onChangeText={(value) => updateField(item.field.id, value)} placeholder={t(language, "enterAnswer")} multiline={item.field.key === "ADDRESS"} />
            {isAadhaar && visibleValue ? <Text style={styles.maskNote}>{t(language, "sensitiveCopyNote")}</Text> : null}
            {item.status === "FILLED" && item.value ? <Pressable onPress={() => copyValue(item)} style={styles.copyButton}><Copy size={14} color={colors.forest} /><Text style={styles.copyText}>{copyingId === item.field.id ? t(language, "copying") : t(language, "copyAnswer")}</Text></Pressable> : <Text style={styles.missingNote}>{item.matchReason ?? t(language, "missingValue")}</Text>}
          </>}
        </View>;
      })}
    </View>
    <View style={styles.safety}><ShieldCheck size={20} color={colors.forest} /><Text style={styles.safetyText}>{t(language, "safetyRule")}</Text></View>
    <PrimaryButton title={t(language, "exportSave")} onPress={() => router.push("/forms/result")} style={{ marginTop: 19 }} />
  </BodhiniScreen>;
}

const styles = StyleSheet.create({
  page: { paddingTop: 8 }, summary: { flexDirection: "row", justifyContent: "space-around", padding: 13, backgroundColor: colors.forestLight, borderRadius: 15, marginBottom: 14 },
  summaryNumber: { color: colors.forest, fontFamily: "serif", fontSize: 21, fontWeight: "700", textAlign: "center" }, summaryLabel: { color: colors.forest, fontSize: 10, textAlign: "center", marginTop: 2 },
  formPaper: { backgroundColor: colors.card, borderColor: colors.line, borderWidth: 1, borderRadius: 17, padding: 15 }, formTitle: { fontFamily: "serif", color: colors.ink, fontSize: 19, fontWeight: "700", textAlign: "center" }, formSub: { color: colors.muted, fontSize: 11, textAlign: "center", marginTop: 4, marginBottom: 13 },
  formField: { paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.line }, fieldTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 10 }, fieldTitle: { flex: 1, color: colors.ink, fontSize: 13, fontWeight: "600" },
  copyButton: { alignSelf: "flex-start", flexDirection: "row", gap: 6, alignItems: "center", paddingVertical: 7, paddingHorizontal: 10, borderRadius: 12, backgroundColor: colors.forestLight, marginTop: -4 }, copyText: { color: colors.forest, fontSize: 11, fontWeight: "700" },
  missingNote: { color: "#93632E", fontSize: 11, marginTop: -4, lineHeight: 16 }, manualNote: { color: colors.muted, fontSize: 12, lineHeight: 18 }, maskNote: { color: colors.muted, fontSize: 10, marginTop: -5, marginBottom: 8 },
  safety: { flexDirection: "row", gap: 9, alignItems: "center", padding: 13, marginTop: 14, borderRadius: 14, backgroundColor: colors.forestLight }, safetyText: { color: colors.forest, fontSize: 11, lineHeight: 16, flex: 1 },
});
