import { Platform, StyleSheet } from "react-native";

export type ColorMode = "light" | "dark";

export interface ThemeColors {
  primary: string;
  onPrimary: string;
  surface: string;
  surfaceAlt: string;
  background: string;
  separator: string;
  border: string;
  text: string;
  secondaryText: string;
  textMuted: string;
  success: string;
  successLight: string;
  warning: string;
  warningLight: string;
  info: string;
  infoLight: string;
  danger: string;
  dangerLight: string;
  card: string;
  cardStrong: string;
  forest: string;
  forestLight: string;
  moss: string;
  gold: string;
  terracotta: string;
  blue: string;
  accent: string;
  white: string;
  ink: string;
  muted: string;
  line: string;
  paper: string;
  overlay: string;
  backdrop: string;
  cardAadhaar: string;
  cardPan: string;
  cardBirth: string;
  cardRation: string;
  cardMarksheet: string;
  cardDomicile: string;
  cardStackBack: string;
  cardStackMid: string;
  cameraBg: string;
  cameraOverlay: string;
  cameraControl: string;
  cameraText: string;
  tooltipBg: string;
  tooltipText: string;
  pdfBadge: string;
  shadow: string;
}

export const lightColors: ThemeColors = {
  primary: "#1E6148",
  onPrimary: "#FFFFFF",
  surface: "#FFFFFF",
  surfaceAlt: "#EFECE6",
  background: "#F6F4F1",
  separator: "#E4DED2",
  border: "#E4DED2",
  text: "#111111",
  secondaryText: "#6B7280",
  textMuted: "#6B7280",
  success: "#2E7D32",
  successLight: "#E8F5E9",
  warning: "#F59E08",
  warningLight: "#FEF7E6",
  info: "#2563EB",
  infoLight: "#EFF6FF",
  danger: "#DC2626",
  dangerLight: "#FEECEC",
  card: "#FFFFFF",
  cardStrong: "#EFECE6",
  forest: "#1E6148",
  forestLight: "#E6F2ED",
  moss: "#2E7D32",
  gold: "#F59E08",
  terracotta: "#C85A32",
  blue: "#2563EB",
  accent: "#1E6148",
  white: "#FFFFFF",
  ink: "#111111",
  muted: "#6B7280",
  line: "#E4DED2",
  paper: "#FFFFFF",
  overlay: "rgba(17, 17, 17, 0.45)",
  backdrop: "rgba(17, 17, 17, 0.48)",
  cardAadhaar: "#1E6148",
  cardPan: "#2563EB",
  cardBirth: "#6D4C3D",
  cardRation: "#0F766E",
  cardMarksheet: "#4338CA",
  cardDomicile: "#6D28D9",
  cardStackBack: "#D96B38",
  cardStackMid: "#2563EB",
  cameraBg: "#0B0B0B",
  cameraOverlay: "rgba(11, 11, 11, 0.62)",
  cameraControl: "rgba(255, 255, 255, 0.16)",
  cameraText: "#FFFFFF",
  tooltipBg: "#111111",
  tooltipText: "#FFFFFF",
  pdfBadge: "#DC2626",
  shadow: "#000000",
};

export const darkColors: ThemeColors = {
  primary: "#237356",
  onPrimary: "#FFFFFF",
  surface: "#161616",
  surfaceAlt: "#222222",
  background: "#0B0B0B",
  separator: "#262626",
  border: "#262626",
  text: "#F5F5F5",
  secondaryText: "#A3A3A3",
  textMuted: "#A3A3A3",
  success: "#4ADE80",
  successLight: "#142E1B",
  warning: "#FBBF24",
  warningLight: "#2E2208",
  info: "#60A5FA",
  infoLight: "#132238",
  danger: "#F87171",
  dangerLight: "#2E1414",
  card: "#161616",
  cardStrong: "#222222",
  forest: "#38B282",
  forestLight: "#142B22",
  moss: "#38B282",
  gold: "#FBBF24",
  terracotta: "#E07A54",
  blue: "#3B82F6",
  accent: "#38B282",
  white: "#FFFFFF",
  ink: "#F5F5F5",
  muted: "#A3A3A3",
  line: "#262626",
  paper: "#1C1C1C",
  overlay: "rgba(0, 0, 0, 0.65)",
  backdrop: "rgba(0, 0, 0, 0.7)",
  cardAadhaar: "#1E6148",
  cardPan: "#2563EB",
  cardBirth: "#6D4C3D",
  cardRation: "#0F766E",
  cardMarksheet: "#4338CA",
  cardDomicile: "#6D28D9",
  cardStackBack: "#D96B38",
  cardStackMid: "#2563EB",
  cameraBg: "#0B0B0B",
  cameraOverlay: "rgba(11, 11, 11, 0.68)",
  cameraControl: "rgba(255, 255, 255, 0.16)",
  cameraText: "#FFFFFF",
  tooltipBg: "#262626",
  tooltipText: "#F5F5F5",
  pdfBadge: "#EF4444",
  shadow: "#000000",
};

export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
} as const;

export const radius = {
  sm: 12,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 28,
  pill: 999,
} as const;

export function buildTypeScale(scale = 1) {
  const s = (size: number) => Math.round(size * scale);
  return {
    largeTitle: { fontSize: s(34), lineHeight: s(40), fontWeight: "700" as const, letterSpacing: -0.6 },
    title: { fontSize: s(28), lineHeight: s(34), fontWeight: "600" as const, letterSpacing: -0.4 },
    display: { fontSize: s(34), lineHeight: s(40), fontWeight: "700" as const, letterSpacing: -0.6 },
    h1: { fontSize: s(28), lineHeight: s(34), fontWeight: "600" as const, letterSpacing: -0.4 },
    h2: { fontSize: s(22), lineHeight: s(28), fontWeight: "600" as const, letterSpacing: -0.2 },
    h3: { fontSize: s(19), lineHeight: s(25), fontWeight: "600" as const },
    body: { fontSize: s(17), lineHeight: s(24), fontWeight: "400" as const },
    bodyStrong: { fontSize: s(17), lineHeight: s(24), fontWeight: "600" as const },
    caption: { fontSize: s(13), lineHeight: s(18), fontWeight: "400" as const },
    captionStrong: { fontSize: s(13), lineHeight: s(18), fontWeight: "600" as const },
    label: { fontSize: s(12), lineHeight: s(16), fontWeight: "500" as const },
    button: { fontSize: s(17), lineHeight: s(22), fontWeight: "600" as const },
  };
}

export const typeScale = buildTypeScale(1);

const lightShadowPreset = Platform.select({
  android: { elevation: 1 },
  default: {
    shadowColor: "#000000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
}) ?? { elevation: 1 };

export const shadows = {
  none: {},
  card: lightShadowPreset,
  xs: lightShadowPreset,
  sm: lightShadowPreset,
  md: lightShadowPreset,
  lg: lightShadowPreset,
  xl: lightShadowPreset,
} as const;

export function makeTheme(colors: ThemeColors, fontScale = 1) {
  const scaledTypes = buildTypeScale(fontScale);
  const style = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    flex: { flex: 1 },
    content: { paddingHorizontal: spacing[4], paddingTop: spacing[3], paddingBottom: spacing[8], flexGrow: 1 },
    topBar: { minHeight: 52, flexDirection: "row", alignItems: "center", marginBottom: spacing[3] },
    backButton: { minWidth: 48, minHeight: 48, justifyContent: "center", alignItems: "flex-start" },
    topBarTitle: { flex: 1, color: colors.text, ...scaledTypes.bodyStrong, textAlign: "center" },
    topBarRight: { minWidth: 48, minHeight: 48, alignItems: "flex-end", justifyContent: "center" },
    heading: { marginTop: spacing[1], marginBottom: spacing[4], gap: spacing[1] },
    center: { alignItems: "center" },
    headingTitle: { color: colors.text, ...scaledTypes.title },
    headingSubtitle: { color: colors.secondaryText, ...scaledTypes.caption },
    textCenter: { textAlign: "center" },
    primaryButton: {
      minHeight: 54,
      borderRadius: radius.lg,
      paddingHorizontal: spacing[6],
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing[2],
      backgroundColor: colors.primary,
    },
    primaryButtonPressed: { opacity: 0.9 },
    primaryButtonText: { color: colors.onPrimary, ...scaledTypes.button },
    secondaryButton: {
      minHeight: 52,
      borderRadius: radius.lg,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.separator,
      paddingHorizontal: spacing[5],
    },
    secondaryButtonText: { color: colors.text, ...scaledTypes.button },
    actionCard: {
      minHeight: 76,
      flexDirection: "row",
      alignItems: "center",
      padding: spacing[4],
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.separator,
      marginBottom: spacing[3],
      gap: spacing[3],
      ...shadows.card,
    },
    cardPressed: { opacity: 0.9 },
    actionIcon: { width: 48, height: 48, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
    actionTextWrap: { flex: 1, gap: spacing[1] },
    actionTitle: { color: colors.text, ...scaledTypes.bodyStrong },
    actionSubtitle: { color: colors.secondaryText, ...scaledTypes.caption },
    fieldWrap: { marginBottom: spacing[3], gap: spacing[1] },
    fieldLabel: { color: colors.secondaryText, ...scaledTypes.label },
    fieldInputRow: {
      minHeight: 52,
      borderRadius: radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.separator,
      backgroundColor: colors.surface,
      paddingHorizontal: spacing[3],
      flexDirection: "row",
      alignItems: "center",
    },
    fieldInput: { flex: 1, color: colors.text, ...scaledTypes.body, paddingVertical: spacing[2] },
    multiline: { minHeight: 88, alignItems: "flex-start" },
    fieldInputMultiline: { minHeight: 72 },
    statusPill: { borderRadius: radius.pill, paddingHorizontal: spacing[2], paddingVertical: spacing[1], alignSelf: "flex-start" },
    statusText: { ...scaledTypes.label, fontWeight: "600" },
    sectionLabel: { color: colors.secondaryText, ...scaledTypes.label, marginTop: spacing[2], marginBottom: spacing[2] },
    voiceButton: {
      minHeight: 48,
      alignSelf: "flex-start",
      flexDirection: "row",
      gap: spacing[2],
      alignItems: "center",
      paddingVertical: spacing[2],
      paddingHorizontal: spacing[4],
      borderRadius: radius.pill,
      backgroundColor: colors.forestLight,
    },
    voiceButtonText: { color: colors.forest, ...scaledTypes.captionStrong },
    emptyState: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: spacing[8],
      paddingHorizontal: spacing[6],
      backgroundColor: colors.surface,
      borderRadius: radius.xl,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.separator,
    },
    emptyIcon: { width: 64, height: 64, borderRadius: radius.lg, backgroundColor: colors.forestLight, alignItems: "center", justifyContent: "center", marginBottom: spacing[4] },
    emptyTitle: { color: colors.text, ...scaledTypes.h3, textAlign: "center" },
    emptySubtitle: { color: colors.secondaryText, ...scaledTypes.caption, textAlign: "center", marginTop: spacing[2] },
    divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.separator, marginVertical: spacing[3] },
  });

  return { colors, spacing, radius, typeScale: scaledTypes, shadows, style };
}

export const lightTheme = makeTheme(lightColors);
export const darkTheme = makeTheme(darkColors);

export type Theme = ReturnType<typeof makeTheme>;
