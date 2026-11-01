import React, { useMemo, type ReactNode } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { ChevronLeft, ChevronRight, FileText, Folder, Volume2 } from "lucide-react-native";
import { useTheme } from "../../theme/ThemeProvider";
import { documentTypeLabel, t } from "../../i18n/translations";
import { useBodhini } from "../../state/AppContext";
import { EmptyStateIllustration, FadeInUp, Hint, MarkEntrance, PressableScale } from "../motion";
import type { DocumentRecord } from "../../domain/document/document.types";
import { FieldValidator } from "../../infrastructure/validation/field-validator";

const markGreen = require("../../../assets/images/bodhini-mark-green.png");
const markWhite = require("../../../assets/images/bodhini-mark-white.png");

export { documentTypeLabel, EmptyStateIllustration };

export function BodhiniScreen({
  children,
  scroll = true,
  contentStyle,
  backgroundColor,
  inTabs = false,
  ...props
}: {
  children: ReactNode;
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  backgroundColor?: string;
  inTabs?: boolean;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const bg = backgroundColor ?? colors.background;
  const bottomPad = inTabs ? 28 : Math.max(insets.bottom + 24, 32);

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: bg }]}
      edges={inTabs ? ["top", "left", "right"] : ["top", "left", "right", "bottom"]}
      {...props}
    >
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        {scroll ? (
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.content, { paddingBottom: bottomPad }, contentStyle]}
          >
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.content, styles.flex, { paddingBottom: bottomPad }, contentStyle]}>
            {children}
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function TopBar({
  title,
  onBack,
  right,
}: {
  title?: string;
  onBack?: () => void;
  right?: ReactNode;
}) {
  const { language } = useBodhini();
  const { colors, theme } = useTheme();

  return (
    <View style={styles.topBar}>
      {onBack ? (
        <Hint hint={t(language, "hintBack")} label={t(language, "goBack")}>
          <PressableScale
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel={t(language, "goBack")}
            style={styles.backButton}
          >
            <ChevronLeft size={26} color={colors.text} strokeWidth={2.2} />
          </PressableScale>
        </Hint>
      ) : (
        <View style={styles.backButton} />
      )}
      <Text
        numberOfLines={1}
        style={[
          styles.topBarTitle,
          { color: colors.text, fontSize: theme.typeScale.bodyStrong.fontSize },
        ]}
      >
        {title ?? ""}
      </Text>
      <View style={styles.topBarRight}>{right}</View>
    </View>
  );
}

export function PageHeading({
  title,
  subtitle,
  align = "left",
}: {
  title: string;
  subtitle?: string;
  align?: "left" | "center";
}) {
  const { colors, theme } = useTheme();
  return (
    <FadeInUp index={0}>
      <View style={[styles.heading, align === "center" && styles.center]}>
        <Text
          style={[
            styles.headingTitle,
            { color: colors.text, fontSize: theme.typeScale.title.fontSize, lineHeight: theme.typeScale.title.lineHeight },
            align === "center" && styles.textCenter,
          ]}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            style={[
              styles.headingSubtitle,
              { color: colors.secondaryText, fontSize: theme.typeScale.caption.fontSize, lineHeight: theme.typeScale.caption.lineHeight },
              align === "center" && styles.textCenter,
            ]}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
    </FadeInUp>
  );
}

export function PrimaryButton({
  title,
  onPress,
  disabled = false,
  loading = false,
  icon,
  style,
  hint,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
  hint?: string;
}) {
  const { colors, theme } = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled || loading}
      hint={hint}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={[
        styles.primaryButton,
        { backgroundColor: colors.primary, opacity: disabled ? 0.55 : 1 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.onPrimary} />
      ) : (
        <>
          {icon}
          <Text style={[styles.primaryButtonText, { color: colors.onPrimary, fontSize: theme.typeScale.button.fontSize }]}>
            {title}
          </Text>
        </>
      )}
    </PressableScale>
  );
}

export function SecondaryButton({
  title,
  onPress,
  style,
  hint,
}: {
  title: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  hint?: string;
}) {
  const { colors, theme } = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      hint={hint}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={[
        styles.secondaryButton,
        { backgroundColor: colors.surface, borderColor: colors.separator },
        style,
      ]}
    >
      <Text style={[styles.secondaryButtonText, { color: colors.text, fontSize: theme.typeScale.button.fontSize }]}>
        {title}
      </Text>
    </PressableScale>
  );
}

export function ActionCard({
  title,
  subtitle,
  icon,
  tint,
  onPress,
  trailing = true,
  hint,
}: {
  title: string;
  subtitle?: string;
  icon: ReactNode;
  tint?: string;
  onPress: () => void;
  trailing?: boolean;
  hint?: string;
}) {
  const { colors, theme } = useTheme();
  const iconBg = tint ?? colors.forestLight;
  return (
    <PressableScale
      onPress={onPress}
      hint={hint}
      accessibilityRole="button"
      accessibilityLabel={subtitle ? `${title}, ${subtitle}` : title}
      style={[
        styles.actionCard,
        { backgroundColor: colors.surface, borderColor: colors.separator },
      ]}
    >
      <View style={[styles.actionIcon, { backgroundColor: iconBg }]}>{icon}</View>
      <View style={styles.actionTextWrap}>
        <Text style={[styles.actionTitle, { color: colors.text, fontSize: theme.typeScale.bodyStrong.fontSize }]}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.actionSubtitle, { color: colors.secondaryText, fontSize: theme.typeScale.caption.fontSize }]}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing ? <ChevronRight color={colors.secondaryText} size={20} /> : null}
    </PressableScale>
  );
}

export function FieldInput({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  right,
  multiline,
  keyboardType,
  warningOutline = false,
  onFocus,
  onBlur,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  right?: ReactNode;
  multiline?: boolean;
  keyboardType?: TextInputProps["keyboardType"];
  warningOutline?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
}) {
  const { colors, theme } = useTheme();
  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.fieldLabel, { color: colors.secondaryText, fontSize: theme.typeScale.label.fontSize }]}>
        {label}
      </Text>
      <View
        style={[
          styles.fieldInputRow,
          {
            backgroundColor: colors.surface,
            borderColor: warningOutline ? colors.warning : colors.separator,
            borderWidth: warningOutline ? 1.5 : StyleSheet.hairlineWidth,
          },
          multiline && styles.multiline,
        ]}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder ?? label}
          placeholderTextColor={colors.secondaryText}
          style={[
            styles.fieldInput,
            { color: colors.text, fontSize: theme.typeScale.bodyStrong.fontSize },
            multiline && styles.fieldInputMultiline,
          ]}
          secureTextEntry={secureTextEntry}
          multiline={multiline}
          textAlignVertical={multiline ? "top" : "center"}
          keyboardType={keyboardType}
          autoCapitalize="sentences"
          accessibilityLabel={label}
          onFocus={onFocus}
          onBlur={onBlur}
        />
        {right}
      </View>
    </View>
  );
}

export function StatusPill({
  label,
  tone = "green",
}: {
  label: string;
  tone?: "green" | "gold" | "red" | "neutral";
}) {
  const { colors, theme } = useTheme();
  const palette = useMemo(() => ({
    green: { bg: colors.successLight, text: colors.success },
    gold: { bg: colors.warningLight, text: colors.warning },
    red: { bg: colors.dangerLight, text: colors.danger },
    neutral: { bg: colors.surfaceAlt, text: colors.secondaryText },
  }), [colors]);
  const current = palette[tone];
  return (
    <View style={[styles.statusPill, { backgroundColor: current.bg }]}>
      <Text style={[styles.statusText, { color: current.text, fontSize: theme.typeScale.label.fontSize }]}>
        {label}
      </Text>
    </View>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  const { colors, theme } = useTheme();
  return (
    <Text style={[styles.sectionLabel, { color: colors.secondaryText, fontSize: theme.typeScale.label.fontSize }]}>
      {children}
    </Text>
  );
}

export function VoicePromptButton({ onPress }: { onPress: () => void }) {
  const { language } = useBodhini();
  const { colors, theme } = useTheme();
  return (
    <Hint hint={t(language, "readScreenAloud")} label={t(language, "readScreenAloud")}>
      <PressableScale
        onPress={onPress}
        style={[styles.voiceButton, { backgroundColor: colors.forestLight }]}
        accessibilityRole="button"
        accessibilityLabel={t(language, "readScreenAloud")}
      >
        <Volume2 size={18} color={colors.forest} />
        <Text style={[styles.voiceButtonText, { color: colors.forest, fontSize: theme.typeScale.captionStrong.fontSize }]}>
          {t(language, "listen")}
        </Text>
      </PressableScale>
    </Hint>
  );
}

export function EmptyState({
  title,
  subtitle,
  icon,
  actionTitle,
  onAction,
}: {
  title: string;
  subtitle: string;
  icon: ReactNode;
  actionTitle?: string;
  onAction?: () => void;
}) {
  const { colors, theme } = useTheme();
  return (
    <View style={[styles.emptyState, { backgroundColor: colors.surface, borderColor: colors.separator }]}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.forestLight }]}>{icon}</View>
      <Text style={[styles.emptyTitle, { color: colors.text, fontSize: theme.typeScale.h3.fontSize }]}>
        {title}
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.secondaryText, fontSize: theme.typeScale.caption.fontSize }]}>
        {subtitle}
      </Text>
      {actionTitle && onAction ? (
        <PrimaryButton title={actionTitle} onPress={onAction} style={styles.emptyButton} />
      ) : null}
    </View>
  );
}

export function Divider() {
  const { colors } = useTheme();
  return <View style={[styles.divider, { backgroundColor: colors.separator }]} />;
}

export function BodhiniLogoMark({
  width = 56,
  height = 75,
  size,
}: {
  width?: number;
  height?: number;
  size?: number;
}) {
  const { language, reduceMotion } = useBodhini();
  const { isDark } = useTheme();
  const resolvedWidth = size ?? width;
  const resolvedHeight = size ? Math.round((size * 75) / 56) : height;
  const source = isDark ? markWhite : markGreen;

  return (
    <Image
      source={source}
      contentFit="contain"
      transition={reduceMotion ? 0 : 180}
      accessibilityLabel={t(language, "bodhiniLogoAlt")}
      style={{ width: resolvedWidth, height: resolvedHeight }}
    />
  );
}

export function BrandBlock({
  variant = "compact",
}: {
  variant?: "compact" | "welcome";
}) {
  const { language } = useBodhini();
  const { colors, theme } = useTheme();
  const isWelcome = variant === "welcome";

  return (
    <View style={isWelcome ? styles.brandWelcomeWrap : styles.brandCompactWrap}>
      <MarkEntrance>
        <BodhiniLogoMark
          width={isWelcome ? 72 : 56}
          height={isWelcome ? 96 : 75}
        />
      </MarkEntrance>
      <View style={isWelcome ? styles.brandWelcomeText : styles.brandCompactText}>
        <Text
          numberOfLines={1}
          style={[
            styles.brandWordmark,
            {
              color: colors.text,
              fontSize: isWelcome ? theme.typeScale.largeTitle.fontSize : theme.typeScale.h2.fontSize,
              lineHeight: isWelcome ? theme.typeScale.largeTitle.lineHeight : theme.typeScale.h2.lineHeight,
            },
          ]}
        >
          {t(language, "brandName")}
        </Text>
        <Text
          numberOfLines={2}
          style={[
            styles.brandTagline,
            {
              color: colors.secondaryText,
              fontSize: theme.typeScale.caption.fontSize,
              lineHeight: theme.typeScale.caption.lineHeight,
            },
            isWelcome && styles.textCenter,
          ]}
        >
          {t(language, "brandShortTagline")}
        </Text>
      </View>
    </View>
  );
}

export function WatermarkFooter() {
  const { language } = useBodhini();
  const { colors, theme } = useTheme();
  const line1 = t(language, "creditLine1");
  const line2 = t(language, "creditLine2");

  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={`${line1}. ${line2}`}
      style={styles.watermarkFooter}
    >
      <View style={styles.watermarkTopRow}>
        <BodhiniLogoMark width={11} height={14} />
        <Text
          style={[
            styles.watermarkLine1,
            {
              color: colors.textMuted,
              fontSize: theme.typeScale.caption.fontSize,
              lineHeight: theme.typeScale.caption.lineHeight,
            },
          ]}
        >
          {line1}
        </Text>
      </View>
      <Text
        style={[
          styles.watermarkLine2,
          {
            color: colors.textMuted,
            fontSize: theme.typeScale.label.fontSize,
            lineHeight: theme.typeScale.label.lineHeight,
          },
        ]}
      >
        {line2}
      </Text>
    </View>
  );
}

export function getDocumentCardPalette(type: string, colors: ReturnType<typeof useTheme>["colors"]) {
  if (type === "AADHAAR") return { bg: colors.cardAadhaar, fg: colors.white, sub: colors.white, isColored: true };
  if (type === "PAN") return { bg: colors.cardPan, fg: colors.white, sub: colors.white, isColored: true };
  if (type === "BIRTH_CERTIFICATE") return { bg: colors.cardBirth, fg: colors.white, sub: colors.white, isColored: true };
  if (type === "RATION_CARD") return { bg: colors.cardRation, fg: colors.white, sub: colors.white, isColored: true };
  if (type === "MARKSHEET") return { bg: colors.cardMarksheet, fg: colors.white, sub: colors.white, isColored: true };
  if (type === "DOMICILE") return { bg: colors.cardDomicile, fg: colors.white, sub: colors.white, isColored: true };
  return { bg: colors.surface, fg: colors.text, sub: colors.secondaryText, isColored: false };
}

export function getDocumentSubtitle(doc: DocumentRecord, revealAadhaar = false, fallbackText = ""): string {
  const aadhaar = doc.fields.find((f) => f.key === "AADHAAR_NO");
  if (aadhaar?.value) {
    return revealAadhaar ? aadhaar.value : FieldValidator.maskAadhaar(aadhaar.value);
  }
  const pan = doc.fields.find((f) => f.key === "PAN_NO");
  if (pan?.value) {
    const clean = pan.value.trim();
    return clean.length > 4 ? `•••• •••• ${clean.slice(-4)}` : clean;
  }
  const otherId = doc.fields.find((f) => f.key !== "FULL_NAME" && f.value.trim().length > 0);
  const name = doc.fields.find((f) => f.key === "FULL_NAME");
  return name?.value || otherId?.value || fallbackText;
}

export function IdBadgeIcon({ color, size = 24 }: { color: string; size?: number }) {
  return (
    <View style={[styles.idBadge, { borderColor: color, width: size + 8, height: size }]}>
      <View style={[styles.idDot, { backgroundColor: color }]} />
      <View style={styles.idLines}>
        <View style={[styles.idLine, { backgroundColor: color, width: 10 }]} />
        <View style={[styles.idLine, { backgroundColor: color, width: 7 }]} />
      </View>
    </View>
  );
}

export const WalletCardRow = React.memo(function WalletCardRow({
  doc,
  onPress,
}: {
  doc: DocumentRecord;
  onPress: (id: string) => void;
}) {
  const { language } = useBodhini();
  const { colors, theme } = useTheme();
  const palette = getDocumentCardPalette(doc.type, colors);
  const title = documentTypeLabel(language, doc.type);
  const subtitle = getDocumentSubtitle(doc, false, t(language, "savedLocally"));

  return (
    <Hint hint={t(language, "hintWalletCard")} label={`${title}, ${subtitle}`}>
      <PressableScale
        onPress={() => onPress(doc.id)}
        accessibilityRole="button"
        accessibilityLabel={`${title}, ${subtitle}`}
        style={[
          styles.walletCard,
          {
            backgroundColor: palette.bg,
            borderColor: palette.isColored ? palette.bg : colors.separator,
          },
        ]}
      >
        <View
          style={[
            styles.walletCardIcon,
            { backgroundColor: palette.isColored ? colors.cameraControl : colors.surfaceAlt },
          ]}
        >
          {doc.type === "OTHER" ? (
            <Folder size={22} color={palette.fg} />
          ) : doc.type === "BIRTH_CERTIFICATE" || doc.type === "MARKSHEET" || doc.type === "DOMICILE" ? (
            <FileText size={22} color={palette.fg} />
          ) : (
            <IdBadgeIcon color={palette.fg} size={22} />
          )}
        </View>
        <View style={styles.walletCardBody}>
          <Text
            numberOfLines={1}
            style={[
              styles.walletCardTitle,
              { color: palette.fg, fontSize: theme.typeScale.bodyStrong.fontSize },
            ]}
          >
            {title}
          </Text>
          <Text
            numberOfLines={1}
            style={[
              styles.walletCardSub,
              { color: palette.sub, opacity: palette.isColored ? 0.88 : 1, fontSize: theme.typeScale.caption.fontSize },
            ]}
          >
            {subtitle}
          </Text>
        </View>
        <ChevronRight size={20} color={palette.fg} />
      </PressableScale>
    </Hint>
  );
});

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 12, flexGrow: 1 },
  topBar: { minHeight: 52, flexDirection: "row", alignItems: "center", marginBottom: 12 },
  backButton: { minWidth: 48, minHeight: 48, justifyContent: "center", alignItems: "flex-start" },
  topBarTitle: { flex: 1, fontWeight: "600", textAlign: "center" },
  topBarRight: { minWidth: 48, minHeight: 48, alignItems: "flex-end", justifyContent: "center" },
  heading: { marginTop: 4, marginBottom: 16, gap: 6 },
  center: { alignItems: "center" },
  headingTitle: { fontWeight: "700", letterSpacing: -0.4 },
  headingSubtitle: {},
  textCenter: { textAlign: "center" },
  primaryButton: {
    minHeight: 54,
    borderRadius: 16,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryButtonText: { fontWeight: "600" },
  secondaryButton: {
    minHeight: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 20,
  },
  secondaryButtonText: { fontWeight: "600" },
  actionCard: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 12,
    gap: 12,
  },
  actionIcon: { width: 48, height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  actionTextWrap: { flex: 1, gap: 4 },
  actionTitle: { fontWeight: "600" },
  actionSubtitle: {},
  fieldWrap: { marginBottom: 8, gap: 4 },
  fieldLabel: { fontWeight: "500" },
  fieldInputRow: {
    minHeight: 50,
    borderRadius: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  fieldInput: { flex: 1, fontWeight: "600", paddingVertical: 8 },
  multiline: { minHeight: 88, alignItems: "flex-start" },
  fieldInputMultiline: { minHeight: 72 },
  statusPill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, alignSelf: "flex-start" },
  statusText: { fontWeight: "600" },
  sectionLabel: { fontWeight: "600", marginTop: 8, marginBottom: 8 },
  voiceButton: {
    minHeight: 48,
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
  },
  voiceButtonText: { fontWeight: "600" },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 24,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
  },
  emptyIcon: { width: 64, height: 64, borderRadius: 16, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  emptyTitle: { fontWeight: "600", textAlign: "center" },
  emptySubtitle: { textAlign: "center", marginTop: 8 },
  emptyButton: { marginTop: 20, alignSelf: "stretch" },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: 12 },
  brandCompactWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexShrink: 1,
  },
  brandCompactText: {
    gap: 4,
    flexShrink: 1,
  },
  brandWelcomeWrap: {
    alignItems: "center",
    gap: 12,
  },
  brandWelcomeText: {
    alignItems: "center",
    gap: 4,
  },
  brandWordmark: {
    fontWeight: "700",
    letterSpacing: -0.6,
  },
  brandTagline: {
    fontWeight: "400",
  },
  watermarkFooter: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 24,
    paddingBottom: 8,
    gap: 4,
  },
  watermarkTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  watermarkLine1: {
    fontWeight: "400",
    textAlign: "center",
  },
  watermarkLine2: {
    fontWeight: "500",
    textAlign: "center",
    opacity: 0.85,
  },
  idBadge: {
    borderWidth: 1.8,
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,
    gap: 4,
  },
  idDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  idLines: {
    gap: 2.5,
  },
  idLine: {
    height: 2,
    borderRadius: 1,
  },
  walletCard: {
    height: 92,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    gap: 14,
    marginBottom: 12,
  },
  walletCardIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  walletCardBody: {
    flex: 1,
    gap: 4,
  },
  walletCardTitle: {
    fontWeight: "600",
  },
  walletCardSub: {
    letterSpacing: 0.3,
  },
});
