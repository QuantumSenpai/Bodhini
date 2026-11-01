import React from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Camera, Image as ImageIcon, FileText, ScanLine, Clipboard } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { BodhiniScreen, PageHeading, TopBar } from "../../components/ui/BodhiniUI";
import { useBodhini } from "../../state/AppContext";
import { t } from "../../i18n/translations";
import { FadeInUp } from "../../components/motion";
import { useTheme } from "../../theme/ThemeProvider";
import type { TranslationKey } from "../../i18n/translations";

interface FormOption {
  id: string;
  labelKey: TranslationKey;
  subtitleKey: TranslationKey;
  icon: React.ReactNode;
  tint: string;
  source: "camera" | "gallery" | null;
  kind: "PAPER_PHOTO" | "SCREENSHOT" | null;
}

export default function FormSourceScreen() {
  const router = useRouter();
  const { language, setPendingFormInput } = useBodhini();
  const { colors } = useTheme();

  const formOptions: FormOption[] = [
    { id: "camera", labelKey: "takePhoto", subtitleKey: "paperForm", icon: <Camera size={25} color={colors.onPrimary} />, tint: colors.primary, source: "camera", kind: "PAPER_PHOTO" },
    { id: "gallery", labelKey: "selectImage", subtitleKey: "fromGallery", icon: <ImageIcon size={25} color={colors.onPrimary} />, tint: colors.moss, source: "gallery", kind: "SCREENSHOT" },
    { id: "pdf", labelKey: "uploadPdf", subtitleKey: "pdfUnavailable", icon: <FileText size={25} color={colors.onPrimary} />, tint: colors.terracotta, source: null, kind: null },
    { id: "screenshot", labelKey: "screenshot", subtitleKey: "onlineForms", icon: <ScanLine size={25} color={colors.onPrimary} />, tint: "#514D3F", source: "gallery", kind: "SCREENSHOT" },
    { id: "sample", labelKey: "sampleForm", subtitleKey: "sampleFormSub", icon: <Clipboard size={25} color={colors.onPrimary} />, tint: colors.blue, source: null, kind: null },
  ];

  const chooseImage = async (source: "camera" | "gallery", kind: "PAPER_PHOTO" | "SCREENSHOT") => {
    try {
      const permission = source === "camera"
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(t(language, "permissionRequired"), t(language, "photoAccessText"));
        return;
      }
      const result = source === "camera"
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 1 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 1 });
      if (result.canceled || !result.assets[0]?.uri) return;
      setPendingFormInput({ kind, uri: result.assets[0].uri });
      router.push("/forms/analyzing");
    } catch {
      Alert.alert(t(language, "imageSourceUnavailable"), t(language, "galleryFailed"));
    }
  };

  const sampleForm = () => {
    setPendingFormInput({ kind: "SAMPLE", sampleId: "sample" });
    router.push("/forms/analyzing");
  };

  const handlePress = (option: typeof formOptions[0]) => {
    if (option.source === "camera" || option.source === "gallery") {
      chooseImage(option.source, option.kind!);
    } else if (option.id === "pdf") {
      Alert.alert(t(language, "pdfInputUnavailable"), t(language, "pdfInputBody"));
    } else if (option.id === "sample") {
      sampleForm();
    }
  };

  return (
    <BodhiniScreen contentStyle={styles.page}>
      <PageHeading title={t(language, "formTitle")} subtitle={t(language, "formIntro")} />
      {formOptions.map((option, index) => (
        <FadeInUp key={option.id} index={index} delay={index * 40}>
          <View style={[styles.chapterCard, { borderColor: option.tint, backgroundColor: colors.card }]}>
            <View style={[styles.chapterNumber, { backgroundColor: option.tint }]}><Text style={styles.chapterNumberText}>{index + 1}</Text></View>
            <Pressable onPress={() => handlePress(option)} style={styles.chapterContent} accessibilityRole="button">
              <View style={[styles.chapterIcon, { backgroundColor: option.tint }]}>{option.icon}</View>
              <View style={styles.chapterText}>
                <Text style={[styles.chapterTitle, { color: colors.text }]}>{t(language, option.labelKey)}</Text>
                <Text style={[styles.chapterSubtitle, { color: colors.textMuted }]}>{t(language, option.subtitleKey)}</Text>
              </View>
            </Pressable>
          </View>
        </FadeInUp>
      ))}
    </BodhiniScreen>
  );
}

const styles = StyleSheet.create({
  page: { paddingTop: 10 },
  chapterCard: { borderRadius: 20, borderWidth: 1, marginBottom: 12, overflow: "hidden", shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  chapterNumber: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", margin: 12 },
  chapterNumberText: { color: "#FAF8F5", fontFamily: "serif", fontSize: 18, fontWeight: "700" },
  chapterContent: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 14, gap: 14 },
  chapterIcon: { width: 52, height: 52, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  chapterText: { flex: 1, gap: 4 },
  chapterTitle: { fontFamily: "serif", fontSize: 16, fontWeight: "600" },
  chapterSubtitle: { fontSize: 12, lineHeight: 17 },
});