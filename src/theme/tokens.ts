import { Platform, StyleSheet, type ViewStyle, type TextStyle, type ImageStyle } from "react-native";

export type ColorMode = "light" | "dark";

export const lightColors = {
  background: "#FAF8F5",
  surface: "#FFFFFF",
  surfaceAlt: "#F4F1EC",
  card: "#FFFFFF",
  border: "#E8E2DB",
  text: "#1A1816",
  textMuted: "#7A736A",
  primary: "#1B3A2F",
  onPrimary: "#FAF8F5",
  accent: "#D4A01E",
  success: "#2E7D3A",
  warning: "#B8741E",
  danger: "#A63D32",
  skyTop: "#A8D0E6",
  skyBottom: "#D6EAF5",
  overlay: "rgba(26, 24, 22, 0.35)",
  forest: "#1B3A2F",
  forestLight: "#E8F0E9",
  moss: "#6B8A6A",
  gold: "#C4943A",
  terracotta: "#A66B4D",
  blue: "#4A6B8A",
  white: "#FFFFFF",
  ink: "#1A1816",
  muted: "#7A736A",
  line: "#E8E2DB",
  paper: "#FEFDFB",
  cardStrong: "#F4F1EC",
} as const;

export const darkColors = {
  background: "#161817",
  surface: "#1E211F",
  surfaceAlt: "#252926",
  card: "#1E211F",
  border: "#333834",
  text: "#F0EDE8",
  textMuted: "#9A9388",
  primary: "#7FD8A8",
  onPrimary: "#0D1A13",
  accent: "#E8C54A",
  success: "#6FD17A",
  warning: "#E8B84A",
  danger: "#E87D74",
  skyTop: "#0F1A22",
  skyBottom: "#1A2A35",
  overlay: "rgba(240, 237, 232, 0.25)",
  forest: "#7FD8A8",
  forestLight: "#142A1E",
  moss: "#8FD498",
  gold: "#E8C54A",
  terracotta: "#D49A7D",
  blue: "#7DA8D4",
  white: "#F0EDE8",
  ink: "#F0EDE8",
  muted: "#9A9388",
  line: "#333834",
  paper: "#232724",
  cardStrong: "#252926",
} as const;

export type ThemeColors = typeof lightColors;

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
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 28,
  pill: 999,
} as const;

export const typeScale = {
  display: { fontSize: 40, lineHeight: 48, fontWeight: "700" as const, fontFamily: "serif" as const, letterSpacing: -1.5 },
  h1: { fontSize: 32, lineHeight: 40, fontWeight: "700" as const, fontFamily: "serif" as const, letterSpacing: -1 },
  h2: { fontSize: 24, lineHeight: 32, fontWeight: "600" as const, fontFamily: "serif" as const, letterSpacing: -0.5 },
  h3: { fontSize: 20, lineHeight: 28, fontWeight: "600" as const, fontFamily: "serif" as const },
  body: { fontSize: 15, lineHeight: 24, fontWeight: "400" as const },
  bodyStrong: { fontSize: 15, lineHeight: 24, fontWeight: "600" as const },
  caption: { fontSize: 12, lineHeight: 18, fontWeight: "400" as const },
  label: { fontSize: 11, lineHeight: 16, fontWeight: "600" as const, letterSpacing: 0.8, textTransform: "uppercase" as const },
  button: { fontSize: 16, lineHeight: 22, fontWeight: "600" as const },
} as const;

export const shadows = {
  none: {},
  xs: { shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  sm: { shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  md: { shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  lg: { shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 5 },
  xl: { shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 8 },
} as const;

export function makeTheme(colors: ThemeColors) {
  const style = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    flex: { flex: 1 },
    content: { paddingHorizontal: spacing[4], paddingTop: spacing[3], paddingBottom: spacing[6], flexGrow: 1 },
    topBar: { minHeight: 48, flexDirection: "row", alignItems: "center", marginBottom: spacing[4] },
    backButton: { width: 34, height: 40, justifyContent: "center", alignItems: "flex-start" },
    topBarTitle: { flex: 1, color: colors.text, fontFamily: "serif", fontSize: typeScale.h2.fontSize, textAlign: "center" },
    topBarRight: { width: 34, alignItems: "flex-end" },
    heading: { marginTop: spacing[1], marginBottom: spacing[4], gap: spacing[2] },
    center: { alignItems: "center" },
    headingTitle: { color: colors.text, ...typeScale.h1 },
    headingSubtitle: { color: colors.textMuted, ...typeScale.body },
    textCenter: { textAlign: "center" },
    primaryButton: {
      minHeight: 56,
      borderRadius: radius.pill,
      paddingHorizontal: spacing[6],
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing[2],
      backgroundColor: colors.primary,
      ...shadows.sm,
    },
    primaryButtonPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
    primaryButtonText: { color: colors.onPrimary, ...typeScale.button },
    secondaryButton: {
      minHeight: 52,
      borderRadius: radius.lg,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surfaceAlt,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing[5],
    },
    secondaryButtonText: { color: colors.text, fontFamily: "serif", ...typeScale.button },
    actionCard: {
      minHeight: 88,
      flexDirection: "row",
      alignItems: "center",
      padding: spacing[3],
      borderRadius: radius.xl,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: spacing[2],
      gap: spacing[3],
      ...shadows.xs,
    },
    cardPressed: { opacity: 0.8 },
    actionIcon: { width: 56, height: 56, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
    actionTextWrap: { flex: 1, gap: spacing[1] },
    actionTitle: { color: colors.text, fontFamily: "serif", fontWeight: "600", fontSize: typeScale.bodyStrong.fontSize },
    actionSubtitle: { color: colors.textMuted, ...typeScale.caption },
    fieldWrap: { marginBottom: spacing[3], gap: spacing[1] },
    fieldLabel: { color: colors.textMuted, ...typeScale.label },
    fieldInputRow: {
      minHeight: 52,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      paddingHorizontal: spacing[3],
      flexDirection: "row",
      alignItems: "center",
    },
    fieldInput: { flex: 1, color: colors.text, ...typeScale.body, paddingVertical: spacing[2] },
    multiline: { minHeight: 96, alignItems: "flex-start" },
    fieldInputMultiline: { minHeight: 76 },
    statusPill: { borderRadius: radius.pill, paddingHorizontal: spacing[2], paddingVertical: spacing[0], alignSelf: "flex-start" },
    statusText: { fontSize: 10, fontWeight: "700" },
    sectionLabel: { color: colors.textMuted, ...typeScale.label, marginTop: spacing[2], marginBottom: spacing[2] },
    voiceButton: {
      alignSelf: "flex-start",
      flexDirection: "row",
      gap: spacing[1],
      alignItems: "center",
      paddingVertical: spacing[2],
      paddingHorizontal: spacing[3],
      borderRadius: radius.pill,
      backgroundColor: colors.forestLight,
    },
    voiceButtonText: { color: colors.forest, ...typeScale.label },
    emptyState: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: spacing[10],
      paddingHorizontal: spacing[6],
      backgroundColor: colors.card,
      borderRadius: radius.xxl,
      borderWidth: 1,
      borderColor: colors.border,
    },
    emptyIcon: { width: 72, height: 72, borderRadius: radius.xl, backgroundColor: colors.forestLight, alignItems: "center", justifyContent: "center", marginBottom: spacing[4] },
    emptyTitle: { color: colors.text, fontFamily: "serif", fontSize: typeScale.h3.fontSize, fontWeight: "600", textAlign: "center" },
    emptySubtitle: { color: colors.textMuted, ...typeScale.caption, textAlign: "center", marginTop: spacing[2] },
    divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing[3] },
  });

  return { colors, spacing, radius, typeScale, shadows, style };
}

export const lightTheme = makeTheme(lightColors);
export const darkTheme = makeTheme(darkColors as unknown as ThemeColors);

export type Theme = {
  colors: ThemeColors;
  spacing: typeof spacing;
  radius: typeof radius;
  typeScale: typeof typeScale;
  shadows: typeof shadows;
  style: ReturnType<typeof StyleSheet.create>;
};