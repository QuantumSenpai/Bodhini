import React from "react";
import { Alert, Pressable, StyleSheet, Text } from "react-native";
import { useRouter } from "expo-router";
import { Camera, ImagePlus, FileText, ScanLine, Clipboard } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { BodhiniScreen, ActionCard, PageHeading, TopBar } from "../../components/ui/BodhiniUI";
import { useBodhini } from "../../state/AppContext";
import { t } from "../../i18n/translations";
import { colors } from "../../theme/tokens";

export default function FormSourceScreen() {
  const router = useRouter();
  const { language, setPendingFormInput } = useBodhini();

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

  return <BodhiniScreen contentStyle={styles.page}>
    <PageHeading title={t(language, "formTitle")} subtitle={t(language, "formIntro")} />
    <ActionCard title={t(language, "takePhoto")} subtitle={t(language, "paperForm")} icon={<Camera size={25} color={colors.white} />} onPress={() => chooseImage("camera", "PAPER_PHOTO")} />
    <ActionCard title={t(language, "selectImage")} subtitle={t(language, "fromGallery")} icon={<ImagePlus size={25} color={colors.white} />} tint={colors.moss} onPress={() => chooseImage("gallery", "SCREENSHOT")} />
    <ActionCard title={t(language, "uploadPdf")} subtitle={t(language, "pdfUnavailable")} icon={<FileText size={25} color={colors.white} />} tint={colors.terracotta} onPress={() => Alert.alert(t(language, "pdfInputUnavailable"), t(language, "pdfInputBody"))} />
    <ActionCard title={t(language, "screenshot")} subtitle={t(language, "onlineForms")} icon={<ScanLine size={25} color={colors.white} />} tint="#514D3F" onPress={() => chooseImage("gallery", "SCREENSHOT")} />
    <ActionCard title={t(language, "sampleForm")} subtitle={t(language, "sampleFormSub")} icon={<Clipboard size={25} color={colors.white} />} tint={colors.blue} onPress={sampleForm} />
  </BodhiniScreen>;
}

const styles = StyleSheet.create({ page: { paddingTop: 10 } });
