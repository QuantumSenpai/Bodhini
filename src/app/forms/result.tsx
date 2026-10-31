import React, { useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Check, Copy, FileImage, FileText } from "lucide-react-native";
import * as Clipboard from "expo-clipboard";
import { BodhiniScreen, ActionCard, PageHeading, PrimaryButton, StatusPill, TopBar } from "../../components/ui/BodhiniUI";
import { useBodhini } from "../../state/AppContext";
import { services } from "../../composition/services";
import { FieldValidator } from "../../infrastructure/validation/field-validator";
import { colors } from "../../theme/tokens";
import { t } from "../../i18n/translations";

export default function FormResultScreen() {
  const router = useRouter();
  const { filledFields, setFilledFields, setPendingFormInput, language } = useBodhini();
  const [copying, setCopying] = useState(false);
  const items = useMemo(() => services.formExporter.buildCopyItems(filledFields), [filledFields]);
  const copyableText = useMemo(
    () => items.filter((item) => item.status === "FILLED").map((item) => `${item.label}: ${item.value}`).join("\n"),
    [items],
  );
  const copyAll = async () => {
    if (!copyableText.trim() || copying) return;
    setCopying(true);
    try {
      await Clipboard.setStringAsync(copyableText, { android: { isSensitive: true } });
      Alert.alert(t(language, "copied"), t(language, "copyOnlyFilled"));
    } catch {
      Alert.alert(t(language, "copyFailed"), t(language, "pleaseTryAgain"));
    } finally { setCopying(false); }
  };

  return <BodhiniScreen contentStyle={styles.page}>
    <TopBar title={t(language, "formReady")} onBack={() => router.back()} />
    <View style={styles.successCircle}><Check size={62} color={colors.white} strokeWidth={2.1} /></View>
    <PageHeading title={t(language, "formReady")} subtitle={t(language, "preparedSuccessfully")} align="center" />
    <View style={styles.previewCard}>
      <Text style={styles.previewTitle}>{t(language, "applicationForm")}</Text>
      {filledFields.map((field, index) => {
        const value = field.value ?? "";
        const display = field.matchedKey === "AADHAAR_NO" && value ? FieldValidator.maskAadhaar(value) : value;
        return <View key={field.field.id} style={styles.previewRow}>
          <Text style={styles.previewLabel}>{index + 1}. {field.field.label}</Text>
          <Text style={styles.previewValue}>{field.status === "SKIPPED" ? t(language, "manualComplete") : field.status === "NEEDS_USER" ? t(language, "missing") : display}</Text>
          <StatusPill label={field.status === "FILLED" ? t(language, "matched") : field.status === "SKIPPED" ? t(language, "manual") : t(language, "missing")} tone={field.status === "FILLED" ? "green" : field.status === "SKIPPED" ? "neutral" : "gold"} />
        </View>;
      })}
    </View>
    <ActionCard title={t(language, "saveImage")} subtitle={t(language, "saveImageUnavailable")} icon={<FileImage color={colors.white} size={23} />} tint="#526C59" onPress={() => Alert.alert(t(language, "saveImageUnavailable"), t(language, "pleaseTryAgain"))} />
    <ActionCard title={t(language, "savePdf")} subtitle={t(language, "savePdfUnavailable")} icon={<FileText color={colors.white} size={23} />} tint={colors.terracotta} onPress={() => Alert.alert(t(language, "savePdfUnavailable"), t(language, "pleaseTryAgain"))} />
    <PrimaryButton title={copying ? t(language, "copying") : t(language, "copyAnswers")} onPress={copyAll} disabled={!copyableText.trim()} loading={copying} icon={<Copy size={18} color={colors.white} />} style={{ marginTop: 3 }} />
    <Pressable onPress={() => { setPendingFormInput(null); setFilledFields([]); router.replace("/(tabs)/forms"); }} style={styles.fillAnother}><Text style={styles.fillAnotherText}>{t(language, "fillAnother")}</Text></Pressable>
  </BodhiniScreen>;
}

const styles = StyleSheet.create({
  page: { paddingTop: 8 }, successCircle: { width: 112, height: 112, borderRadius: 56, backgroundColor: colors.moss, alignItems: "center", justifyContent: "center", alignSelf: "center", marginTop: 7, marginBottom: 18 },
  previewCard: { padding: 15, borderRadius: 18, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, marginBottom: 15 }, previewTitle: { fontFamily: "serif", color: colors.ink, fontSize: 18, textAlign: "center", fontWeight: "700", marginBottom: 8 },
  previewRow: { borderTopWidth: 1, borderTopColor: colors.line, paddingVertical: 10, gap: 4 }, previewLabel: { color: colors.ink, fontSize: 12, fontWeight: "700" }, previewValue: { color: colors.muted, fontSize: 12, lineHeight: 17 },
  fillAnother: { paddingVertical: 15, alignItems: "center" }, fillAnotherText: { color: colors.forest, fontFamily: "serif", fontSize: 15, textDecorationLine: "underline" },
});
