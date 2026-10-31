import React, { useRef, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { CameraView, useCameraPermissions, type CameraView as CameraViewType } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { ArrowLeft, Image as ImageIcon, Zap, RotateCcw } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { colors } from "../../theme/tokens";
import { useBodhini } from "../../state/AppContext";
import { t } from "../../i18n/translations";

export default function ScanCameraScreen() {
  const router = useRouter();
  const cameraRef = useRef<CameraViewType>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState(false);
  const [facing, setFacing] = useState<"back" | "front">("back");
  const { setPendingDocument, language } = useBodhini();

  const continueWithUri = (uri: string) => {
    setPendingDocument(null);
    router.push({ pathname: "/scan/processing", params: { uri } });
  };

  const capture = async () => {
    if (!cameraRef.current || !ready || busy) return;
    setBusy(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.9, skipProcessing: false });
      if (photo?.uri) continueWithUri(photo.uri);
      else Alert.alert(t(language, "captureFailed"), t(language, "cameraFailed"));
    } catch {
      Alert.alert(t(language, "captureFailed"), t(language, "cameraFailed"));
    } finally { setBusy(false); }
  };

  const chooseFromGallery = async () => {
    try {
      const access = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!access.granted) {
        Alert.alert(t(language, "photoAccess"), t(language, "photoAccessText"));
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.9 });
      if (!result.canceled && result.assets[0]?.uri) continueWithUri(result.assets[0].uri);
    } catch {
      Alert.alert(t(language, "photosUnavailable"), t(language, "galleryFailed"));
    }
  };

  if (!permission) return <SafeAreaView style={styles.permission}><Text style={styles.permissionText}>{t(language, "cameraChecking")}</Text></SafeAreaView>;
  if (!permission.granted) return <SafeAreaView style={styles.permission}>
    <Pressable onPress={() => router.back()} style={styles.permissionBack}><ArrowLeft color={colors.ink} /></Pressable>
    <Text style={styles.permissionTitle}>{t(language, "allowCamera")}</Text>
    <Text style={styles.permissionText}>{t(language, "cameraPermissionText")}</Text>
    <Pressable onPress={() => requestPermission()} style={styles.permissionButton}><Text style={styles.permissionButtonText}>{t(language, "allowCameraButton")}</Text></Pressable>
  </SafeAreaView>;

  return <View style={styles.container}>
    <StatusBar style="light" backgroundColor="#171512" />
    <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing={facing} enableTorch={flash} onCameraReady={() => setReady(true)} />
    <SafeAreaView style={styles.overlay}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.topButton}><ArrowLeft color={colors.white} size={22} /></Pressable>
        <Text style={styles.title}>{t(language, "cameraTitle")}</Text>
        <Pressable onPress={() => setFlash((value) => !value)} style={styles.topButton} accessibilityLabel={t(language, "torch")}><Zap color={flash ? colors.gold : colors.white} size={22} fill={flash ? colors.gold : "transparent"} /></Pressable>
      </View>
      <View style={styles.scanFrameWrap} pointerEvents="none">
        <View style={styles.scanFrame}>
          <View style={[styles.corner, styles.topLeft]} /><View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} /><View style={[styles.corner, styles.bottomRight]} />
        </View>
      </View>
      <View style={styles.bottomPanel}>
        <Text style={styles.instruction}>{t(language, "cameraInstruction")}</Text>
        <View style={styles.controls}>
          <Pressable onPress={chooseFromGallery} style={styles.smallControl} accessibilityRole="button" accessibilityLabel={t(language, "chooseGallery")}><ImageIcon color={colors.white} size={24} /></Pressable>
          <Pressable onPress={capture} disabled={!ready || busy} style={styles.captureOuter} accessibilityRole="button" accessibilityLabel={t(language, "captureDocument")}><View style={styles.captureInner}>{busy ? <Text style={{ color: colors.forest }}>…</Text> : null}</View></Pressable>
          <Pressable onPress={() => setFacing((value) => value === "back" ? "front" : "back")} style={styles.smallControl} accessibilityRole="button" accessibilityLabel={t(language, "switchCamera")}><RotateCcw color={colors.white} size={23} /></Pressable>
        </View>
      </View>
    </SafeAreaView>
  </View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D0E0D" }, overlay: { flex: 1, justifyContent: "space-between", backgroundColor: "rgba(0,0,0,0.10)" },
  topBar: { height: 70, paddingHorizontal: 20, backgroundColor: "rgba(16,15,13,0.84)", flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { color: colors.white, fontFamily: "serif", fontSize: 17 }, topButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  scanFrameWrap: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 27 },
  scanFrame: { width: "100%", aspectRatio: 1.18, maxHeight: 330, borderRadius: 12 }, corner: { position: "absolute", width: 28, height: 28, borderColor: colors.white },
  topLeft: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 8 }, topRight: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 8 },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 8 }, bottomRight: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 8 },
  bottomPanel: { paddingTop: 13, paddingBottom: 20, backgroundColor: "rgba(10,10,10,0.88)" }, instruction: { color: colors.white, fontSize: 12, textAlign: "center", marginBottom: 18 },
  controls: { flexDirection: "row", alignItems: "center", justifyContent: "space-around", paddingHorizontal: 22 }, smallControl: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#292A28", alignItems: "center", justifyContent: "center" },
  captureOuter: { width: 70, height: 70, borderRadius: 35, borderWidth: 3, borderColor: colors.white, alignItems: "center", justifyContent: "center" }, captureInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.white, alignItems: "center", justifyContent: "center" },
  permission: { flex: 1, backgroundColor: colors.background, justifyContent: "center", alignItems: "center", padding: 28 }, permissionBack: { position: "absolute", top: 55, left: 25 },
  permissionTitle: { fontFamily: "serif", fontSize: 26, color: colors.ink, fontWeight: "700", textAlign: "center" }, permissionText: { color: colors.muted, textAlign: "center", lineHeight: 22, marginTop: 12 },
  permissionButton: { paddingHorizontal: 30, paddingVertical: 15, backgroundColor: colors.forest, borderRadius: 30, marginTop: 24 }, permissionButtonText: { color: colors.white, fontWeight: "700" },
});
