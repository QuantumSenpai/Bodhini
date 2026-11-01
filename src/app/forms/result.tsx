import React, { useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Check, Copy, FileImage, FileText } from "lucide-react-native";
import * as Clipboard from "expo-clipboard";
import { BodhiniScreen, ActionCard, PageHeading, PrimaryButton, StatusPill, TopBar } from "../../components/ui/BodhiniUI";
import { useBodhini } from "../../state/AppContext";
import { services } from "../../composition/services";
import { FieldValidator } from "../../infrastructure/validation/field-validator";
import { t } from "../../i18n/translations";
import { AnimatedCheck, ConfettiFreeGlow, CopyMorphButton } from "../../components/motion";
import { useTheme } from "../../theme/ThemeProvider";

export default function FormResultScreen() {
  const router = useRouter();
  const { filledFields, setFilledFields, setPendingFormInput, language } = useBodhini();
  const { colors } = useTheme();
  const [copying, setCopying] = useState(false);
  const [showCheck, setShowCheck] = useState(false);
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
      setShowCheck(true);
      Alert.alert(t(language, "copied"), t(language, "copyOnlyFilled"));
    } catch {
      Alert.alert(t(language, "copyFailed"), t(language, "pleaseTryAgain"));
    } finally { setCopying(false); }
  };

  return (
    <BodhiniScreen contentStyle={styles.page}>
      <TopBar title={t(language, "formReady")} onBack={() => router.back()} />
      <View style={[styles.successCircle, { backgroundColor: colors.moss }]}>
        <AnimatedCheck size={72} strokeColor={colors.onPrimary} strokeWidth={2.5} onComplete={() => setShowCheck(true)} />
        <ConfettiFreeGlow color={colors.moss} size={140} />
      </View>
      <PageHeading title={t(language, "formReady")} subtitle={t(language, "preparedSuccessfully")} align="center" />
      <View style={[styles.previewCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.previewTitle, { color: colors.text }]}>{t(language, "applicationForm")}</Text>
        {filledFields.map((field, index) => {
          const value = field.value ?? "";
          const display = field.matchedKey === "AADHAAR_NO" && value ? FieldValidator.maskAadhaar(value) : value;
          return (
            <View key={field.field.id} style={[styles.previewRow, { borderTopColor: colors.border }]}>
              <Text style={[styles.previewLabel, { color: colors.text }]}>{index + 1}. {field.field.label}</Text>
              <Text style={[styles.previewValue, { color: colors.textMuted }]}>{field.status === "SKIPPED" ? t(language, "manualComplete") : field.status === "NEEDS_USER" ? t(language, "missing") : display}</Text>
              <StatusPill label={field.status === "FILLED" ? t(language, "matched") : field.status === "SKIPPED" ? t(language, "manual") : t(language, "missing")} tone={field.status === "FILLED" ? "green" : field.status === "SKIPPED" ? "neutral" : "gold"} />
            </View>
          );
        })}
      </View>
      <ActionCard title={t(language, "saveImage")} subtitle={t(language, "saveImageUnavailable")} icon={<FileImage color={colors.onPrimary} size={23} />} tint={colors.moss} onPress={() => Alert.alert(t(language, "saveImageUnavailable"), t(language, "pleaseTryAgain"))} />
      <ActionCard title={t(language, "savePdf")} subtitle={t(language, "savePdfUnavailable")} icon={<FileText color={colors.onPrimary} size={23} />} tint={colors.terracotta} onPress={() => Alert.alert(t(language, "savePdfUnavailable"), t(language, "pleaseTryAgain"))} />
      <CopyMorphButton
        label={t(language, "copyAnswers")}
        copiedLabel={t(language, "copied")}
        isCopied={showCheck}
        onPress={copyAll}
        disabled={!copyableText.trim() || copying}
      />
      <Pressable onPress={() => { setPendingFormInput(null); setFilledFields([]); router.replace("/(tabs)/forms"); }} style={styles.fillAnother}><Text style={[styles.fillAnotherText, { color: colors.primary }]}>{t(language, "fillAnother")}</Text></Pressable>
    </BodhiniScreen>
  );
}

const styles = StyleSheet.create({
  page: { paddingTop: 8 },
  successCircle: { width: 112, height: 112, borderRadius: 56, alignItems: "center", justifyContent: "center", alignSelf: "center", marginTop: 7, marginBottom: 18, position: "relative" },
  previewCard: { padding: 15, borderRadius: 18, borderWidth: 1, marginBottom: 15 },
  previewTitle: { fontFamily: "serif", fontSize: 18, textAlign: "center", fontWeight: "700", marginBottom: 8 },
  previewRow: { borderTopWidth: 1, paddingVertical: 10, gap: 4 },
  previewLabel: { fontSize: 12, fontWeight: "700" },
  previewValue: { fontSize: 12, lineHeight: 17 },
  fillAnother: { paddingVertical: 15, alignItems: "center" },
  fillAnotherText: { fontFamily: "serif", fontSize: 15, textDecorationLine: "underline" },
});