import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Linking, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { CameraView, useCameraPermissions, type CameraView as CameraViewType } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { Camera, Image as ImageIcon, X, Zap } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useBodhini } from "../../state/AppContext";
import { t } from "../../i18n/translations";
import { useTheme } from "../../theme/ThemeProvider";
import { Hint, PressableScale, PulseDot, SegmentedControl, useScreenFocused } from "../../components/motion";
import { PrimaryButton, SecondaryButton } from "../../components/ui/BodhiniUI";

type ScanMode = "document" | "photo";

export default function ScanCameraScreen() {
  const router = useRouter();
  const cameraRef = useRef<CameraViewType>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState(false);
  const [scanMode, setScanMode] = useState<ScanMode>("document");
  const [cameraError, setCameraError] = useState(false);
  const [captureError, setCaptureError] = useState<string | null>(null);
  const { setPendingDocument, language, reduceMotion } = useBodhini();
  const { colors, theme } = useTheme();
  const isFocused = useScreenFocused();

  const bracketOpacity = useSharedValue(1);
  const isIdle = isFocused && ready && !busy && !captureError && !cameraError;

  useEffect(() => {
    if (!isIdle || reduceMotion) {
      cancelAnimation(bracketOpacity);
      bracketOpacity.value = 1;
      return;
    }
    bracketOpacity.value = 0.65;
    bracketOpacity.value = withRepeat(
      withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    return () => {
      cancelAnimation(bracketOpacity);
    };
  }, [bracketOpacity, isIdle, reduceMotion]);

  const bracketAnimatedStyle = useAnimatedStyle(() => ({
    opacity: bracketOpacity.value,
  }));

  const continueWithUri = useCallback((uri: string) => {
    setCaptureError(null);
    setPendingDocument(null);
    router.push({ pathname: "/scan/processing", params: { uri } });
  }, [router, setPendingDocument]);

  const capture = useCallback(async () => {
    if (!cameraRef.current || !ready || busy) return;
    setBusy(true);
    setCaptureError(null);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 1, skipProcessing: true });
      if (photo?.uri) {
        continueWithUri(photo.uri);
      } else {
        setCaptureError(t(language, "cameraFailed"));
      }
    } catch {
      setCaptureError(t(language, "cameraFailed"));
    } finally {
      setBusy(false);
    }
  }, [busy, continueWithUri, language, ready]);

  const chooseFromGallery = useCallback(async () => {
    setCaptureError(null);
    try {
      const access = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!access.granted) {
        setCaptureError(t(language, "photoAccessText"));
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 1 });
      if (!result.canceled && result.assets[0]?.uri) {
        continueWithUri(result.assets[0].uri);
      }
    } catch {
      setCaptureError(t(language, "galleryFailed"));
    }
  }, [continueWithUri, language]);

  const openDeviceSettings = useCallback(() => {
    Linking.openSettings().catch(() => undefined);
  }, []);

  const modeOptions = [
    { value: "document" as ScanMode, label: t(language, "cameraModeDocument") },
    { value: "photo" as ScanMode, label: t(language, "cameraModePhoto") },
  ];

  if (!permission) {
    return (
      <SafeAreaView style={[styles.stateScreen, { backgroundColor: colors.cameraBg }]}>
        <StatusBar style="light" />
        <PulseDot color={colors.primary} size={10} />
        <Text style={[styles.stateSubtitle, { color: colors.cameraText, fontSize: theme.typeScale.body.fontSize }]}>
          {t(language, "cameraChecking")}
        </Text>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    const isBlocked = permission.canAskAgain === false;
    return (
      <SafeAreaView style={[styles.stateScreen, { backgroundColor: colors.background }]}>
        <StatusBar style="auto" />
        <View style={styles.stateTopBar}>
          <Hint hint={t(language, "hintCloseCamera")} label={t(language, "closeScreen")}>
            <PressableScale
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel={t(language, "closeScreen")}
              style={styles.iconHit}
            >
              <X color={colors.text} size={24} />
            </PressableScale>
          </Hint>
        </View>
        <View style={styles.stateCenter}>
          <View style={[styles.stateIconCircle, { backgroundColor: colors.forestLight }]}>
            <Camera size={32} color={colors.forest} />
          </View>
          <Text style={[styles.stateTitle, { color: colors.text, fontSize: theme.typeScale.title.fontSize }]}>
            {isBlocked ? t(language, "cameraBlockedTitle") : t(language, "allowCamera")}
          </Text>
          <Text style={[styles.stateBody, { color: colors.secondaryText, fontSize: theme.typeScale.body.fontSize }]}>
            {isBlocked ? t(language, "cameraBlockedText") : t(language, "cameraPermissionText")}
          </Text>
          <View style={styles.stateActions}>
            {isBlocked ? (
              <PrimaryButton
                title={t(language, "openSettings")}
                onPress={openDeviceSettings}
                hint={t(language, "openSettings")}
              />
            ) : (
              <PrimaryButton
                title={t(language, "allowCameraButton")}
                onPress={() => requestPermission().catch(() => undefined)}
                hint={t(language, "allowCameraButton")}
              />
            )}
            <SecondaryButton
              title={t(language, "selectImage")}
              onPress={chooseFromGallery}
              hint={t(language, "hintGallery")}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (cameraError) {
    return (
      <SafeAreaView style={[styles.stateScreen, { backgroundColor: colors.background }]}>
        <StatusBar style="auto" />
        <View style={styles.stateTopBar}>
          <Hint hint={t(language, "hintCloseCamera")} label={t(language, "closeScreen")}>
            <PressableScale
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel={t(language, "closeScreen")}
              style={styles.iconHit}
            >
              <X color={colors.text} size={24} />
            </PressableScale>
          </Hint>
        </View>
        <View style={styles.stateCenter}>
          <View style={[styles.stateIconCircle, { backgroundColor: colors.warningLight }]}>
            <Camera size={32} color={colors.warning} />
          </View>
          <Text style={[styles.stateTitle, { color: colors.text, fontSize: theme.typeScale.title.fontSize }]}>
            {t(language, "cameraUnavailableTitle")}
          </Text>
          <Text style={[styles.stateBody, { color: colors.secondaryText, fontSize: theme.typeScale.body.fontSize }]}>
            {t(language, "cameraUnavailableText")}
          </Text>
          <View style={styles.stateActions}>
            <PrimaryButton
              title={t(language, "selectImage")}
              onPress={chooseFromGallery}
              hint={t(language, "hintGallery")}
            />
            <SecondaryButton
              title={t(language, "retry")}
              onPress={() => setCameraError(false)}
              hint={t(language, "retry")}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.cameraBg }]}>
      <StatusBar style="light" />
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="back"
        enableTorch={flash}
        onCameraReady={() => setReady(true)}
        onMountError={() => setCameraError(true)}
      />

      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={[styles.dimTop, { backgroundColor: colors.cameraOverlay }]} />
        <View style={styles.dimMiddleRow}>
          <View style={[styles.dimSide, { backgroundColor: colors.cameraOverlay }]} />
          <View
            style={[
              styles.cutoutWindow,
              scanMode === "document" ? styles.idCardRatio : styles.photoRatio,
            ]}
          >
            <Animated.View style={[StyleSheet.absoluteFill, bracketAnimatedStyle]}>
              <View style={[styles.corner, styles.topLeft, { borderColor: colors.cameraText }]} />
              <View style={[styles.corner, styles.topRight, { borderColor: colors.cameraText }]} />
              <View style={[styles.corner, styles.bottomLeft, { borderColor: colors.cameraText }]} />
              <View style={[styles.corner, styles.bottomRight, { borderColor: colors.cameraText }]} />
            </Animated.View>
          </View>
          <View style={[styles.dimSide, { backgroundColor: colors.cameraOverlay }]} />
        </View>
        <View style={[styles.dimBottom, { backgroundColor: colors.cameraOverlay }]} />
      </View>

      <SafeAreaView style={styles.overlay} edges={["top", "left", "right", "bottom"]}>
        <View style={styles.topBar}>
          <Hint hint={t(language, "hintCloseCamera")} label={t(language, "closeScreen")}>
            <PressableScale
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel={t(language, "closeScreen")}
              style={styles.iconHit}
            >
              <X color={colors.cameraText} size={24} strokeWidth={2.2} />
            </PressableScale>
          </Hint>

          <Text style={[styles.topTitle, { color: colors.cameraText, fontSize: theme.typeScale.bodyStrong.fontSize }]}>
            {t(language, "cameraTitle")}
          </Text>

          <Hint hint={t(language, "hintFlash")} label={t(language, "torch")}>
            <PressableScale
              onPress={() => setFlash((v) => !v)}
              accessibilityRole="button"
              accessibilityLabel={t(language, "torch")}
              accessibilityState={{ selected: flash }}
              style={styles.iconHit}
            >
              <Zap
                color={flash ? colors.warning : colors.cameraText}
                size={22}
                fill={flash ? colors.warning : "transparent"}
              />
            </PressableScale>
          </Hint>
        </View>

        <View style={styles.centerSpacer}>
          <Text style={[styles.guideCaption, { color: colors.cameraText, fontSize: theme.typeScale.caption.fontSize }]}>
            {t(language, "cameraInstruction")}
          </Text>
        </View>

        <View style={styles.bottomArea}>
          {captureError ? (
            <View style={[styles.errorBanner, { backgroundColor: colors.dangerLight, borderColor: colors.danger }]}>
              <Text style={[styles.errorText, { color: colors.danger, fontSize: theme.typeScale.captionStrong.fontSize }]}>
                {captureError}
              </Text>
              <PressableScale
                onPress={capture}
                accessibilityRole="button"
                accessibilityLabel={t(language, "retry")}
                style={[styles.retryPill, { backgroundColor: colors.danger }]}
              >
                <Text style={[styles.retryPillText, { color: colors.onPrimary, fontSize: theme.typeScale.label.fontSize }]}>
                  {t(language, "retry")}
                </Text>
              </PressableScale>
            </View>
          ) : null}

          <Hint hint={t(language, "hintCameraMode")} label={t(language, "cameraModeDocument")}>
            <View style={styles.modeToggleWrap}>
              <SegmentedControl
                options={modeOptions}
                value={scanMode}
                onChange={setScanMode}
                darkSurface
                style={styles.modeSegmented}
              />
            </View>
          </Hint>

          <View style={styles.controlsRow}>
            <Hint hint={t(language, "hintGallery")} label={t(language, "chooseGallery")}>
              <PressableScale
                onPress={chooseFromGallery}
                disabled={busy}
                accessibilityRole="button"
                accessibilityLabel={t(language, "chooseGallery")}
                style={[styles.galleryButton, { borderColor: colors.cameraText, backgroundColor: colors.cameraControl }]}
              >
                <ImageIcon color={colors.cameraText} size={22} />
              </PressableScale>
            </Hint>

            <Hint hint={t(language, "hintShutter")} label={t(language, "captureDocument")}>
              <PressableScale
                onPress={capture}
                disabled={!ready || busy}
                accessibilityRole="button"
                accessibilityLabel={t(language, "captureDocument")}
                style={[
                  styles.shutterOuter,
                  { borderColor: colors.cameraText, opacity: !ready || busy ? 0.6 : 1 },
                ]}
              >
                <View style={[styles.shutterInner, { backgroundColor: colors.cameraText }]}>
                  {busy ? <ActivityIndicator color={colors.primary} size="small" /> : null}
                </View>
              </PressableScale>
            </Hint>

            <View style={styles.rightSpacer} />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: "space-between",
  },
  topBar: {
    minHeight: 60,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  topTitle: {
    fontWeight: "600",
    textAlign: "center",
  },
  iconHit: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  dimTop: {
    flex: 1.1,
  },
  dimMiddleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  dimSide: {
    width: 24,
    alignSelf: "stretch",
  },
  cutoutWindow: {
    flex: 1,
    position: "relative",
  },
  idCardRatio: {
    aspectRatio: 85.6 / 54,
  },
  photoRatio: {
    aspectRatio: 4 / 3,
  },
  dimBottom: {
    flex: 1.4,
  },
  corner: {
    position: "absolute",
    width: 30,
    height: 30,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3.5,
    borderLeftWidth: 3.5,
    borderTopLeftRadius: 12,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3.5,
    borderRightWidth: 3.5,
    borderTopRightRadius: 12,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3.5,
    borderLeftWidth: 3.5,
    borderBottomLeftRadius: 12,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3.5,
    borderRightWidth: 3.5,
    borderBottomRightRadius: 12,
  },
  centerSpacer: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 16,
  },
  guideCaption: {
    textAlign: "center",
    paddingHorizontal: 24,
    opacity: 0.9,
  },
  bottomArea: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 20,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  errorText: {
    flex: 1,
    fontWeight: "600",
  },
  retryPill: {
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  retryPillText: {
    fontWeight: "600",
  },
  modeToggleWrap: {
    alignItems: "center",
  },
  modeSegmented: {
    width: 210,
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
  },
  galleryButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  shutterOuter: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 3.5,
    alignItems: "center",
    justifyContent: "center",
  },
  shutterInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  rightSpacer: {
    width: 48,
    height: 48,
  },
  stateScreen: {
    flex: 1,
    paddingHorizontal: 24,
  },
  stateTopBar: {
    minHeight: 56,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  stateCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingBottom: 40,
  },
  stateIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  stateTitle: {
    fontWeight: "700",
    textAlign: "center",
  },
  stateBody: {
    textAlign: "center",
    lineHeight: 24,
    maxWidth: 300,
  },
  stateSubtitle: {
    marginTop: 14,
    textAlign: "center",
  },
  stateActions: {
    width: "100%",
    gap: 12,
    marginTop: 16,
  },
});
