import React, { type ReactNode } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, ChevronRight, Volume2 } from "lucide-react-native";
import { useTheme } from "../../theme/ThemeProvider";
import { t } from "../../i18n/translations";
import { useBodhini } from "../../state/AppContext";
import { PressableScale, FadeInUp } from "../../components/motion";

export function BodhiniScreen({ children, scroll = true, contentStyle, backgroundColor, ...props }: {
  children: ReactNode;
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  backgroundColor?: string;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const bg = backgroundColor ?? colors.background;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bg }]} edges={["top", "left", "right", "bottom"]} {...props}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        {scroll ? (
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 34 }, contentStyle]}>
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.content, styles.flex, { paddingBottom: insets.bottom + 34 }, contentStyle]}>
            {children}
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function TopBar({ title, onBack, right }: { title?: string; onBack?: () => void; right?: ReactNode }) {
  const { language } = useBodhini();
  const { colors } = useTheme();

  return (
    <View style={[styles.topBar, { backgroundColor: colors.surface }]}>
      <PressableScale onPress={onBack} disabled={!onBack} hitSlop={10} accessibilityRole="button" accessibilityLabel={t(language, "goBack")} style={styles.backButton}>
        {onBack ? <ArrowLeft size={22} color={colors.text} /> : null}
      </PressableScale>
      <Text style={[styles.topBarTitle, { color: colors.text }]}>{title ?? ""}</Text>
      <View style={styles.topBarRight}>{right}</View>
    </View>
  );
}

export function PageHeading({ title, subtitle, align = "left" }: { title: string; subtitle?: string; align?: "left" | "center" }) {
  const { colors } = useTheme();
  return (
    <FadeInUp index={0}>
      <View style={[styles.heading, align === "center" && styles.center]}>
        <Text style={[styles.headingTitle, { color: colors.text }, align === "center" && styles.textCenter]}>{title}</Text>
        {subtitle ? <Text style={[styles.headingSubtitle, { color: colors.textMuted }, align === "center" && styles.textCenter]}>{subtitle}</Text> : null}
      </View>
    </FadeInUp>
  );
}

export function PrimaryButton({ title, onPress, disabled = false, loading = false, icon, style }: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  return (
    <PressableScale onPress={onPress} disabled={disabled || loading} accessibilityRole="button" style={({ pressed }) => [styles.primaryButton, { backgroundColor: colors.primary }, style, (pressed || disabled) && styles.primaryButtonPressed]}>
      {loading ? <ActivityIndicator color={colors.onPrimary} /> : <> {icon} <Text style={[styles.primaryButtonText, { color: colors.onPrimary }]}>{title}</Text> </>}
    </PressableScale>
  );
}

export function SecondaryButton({ title, onPress, style }: { title: string; onPress: () => void; style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  return (
    <PressableScale onPress={onPress} accessibilityRole="button" style={({ pressed }) => [styles.secondaryButton, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }, style, pressed && styles.secondaryButtonPressed]}>
      <Text style={[styles.secondaryButtonText, { color: colors.text }]}>{title}</Text>
    </PressableScale>
  );
}

export function ActionCard({ title, subtitle, icon, tint, onPress, trailing = true }: {
  title: string;
  subtitle?: string;
  icon: ReactNode;
  tint?: string;
  onPress: () => void;
  trailing?: boolean;
}) {
  const { colors } = useTheme();
  const iconBg = tint ?? colors.primary;
  return (
    <PressableScale onPress={onPress} accessibilityRole="button" style={({ pressed }) => [styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border }, pressed && styles.cardPressed]}>
      <View style={[styles.actionIcon, { backgroundColor: iconBg }]}>{icon}</View>
      <View style={styles.actionTextWrap}>
        <Text style={styles.actionTitle}>{title}</Text>
        {subtitle ? <Text style={styles.actionSubtitle}>{subtitle}</Text> : null}
      </View>
      {trailing ? <ChevronRight color={colors.textMuted} size={20} /> : null}
    </PressableScale>
  );
}

export function FieldInput({ label, value, onChangeText, placeholder, secureTextEntry, right, multiline, keyboardType }: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  right?: ReactNode;
  multiline?: boolean;
  keyboardType?: TextInputProps["keyboardType"];
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>{label}</Text>
      <View style={[styles.fieldInputRow, { backgroundColor: colors.surface, borderColor: colors.border }, multiline && styles.multiline]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder ?? `Enter ${label.toLowerCase()}`}
          placeholderTextColor={colors.textMuted}
          style={[styles.fieldInput, { color: colors.text }, multiline && styles.fieldInputMultiline]}
          secureTextEntry={secureTextEntry}
          multiline={multiline}
          textAlignVertical={multiline ? "top" : "center"}
          keyboardType={keyboardType}
          autoCapitalize="sentences"
        />
        {right}
      </View>
    </View>
  );
}

export function StatusPill({ label, tone = "green" }: { label: string; tone?: "green" | "gold" | "red" | "neutral" }) {
  const { colors } = useTheme();
  const themes = {
    green: { bg: colors.forestLight, text: colors.forest },
    gold: { bg: "#FEF3E2", text: colors.warning },
    red: { bg: "#FDF0EF", text: colors.danger },
    neutral: { bg: colors.surfaceAlt, text: colors.textMuted },
  };
  const theme = themes[tone];
  return (
    <View style={[styles.statusPill, { backgroundColor: theme.bg }]}>
      <Text style={[styles.statusText, { color: theme.text }]}>{label}</Text>
    </View>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  return <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>{children}</Text>;
}

export function VoicePromptButton({ onPress }: { onPress: () => void }) {
  const { language } = useBodhini();
  const { colors } = useTheme();
  return (
    <PressableScale onPress={onPress} style={[styles.voiceButton, { backgroundColor: colors.forestLight }]} accessibilityRole="button" accessibilityLabel={t(language, "readScreenAloud")}>
      <Volume2 size={17} color={colors.forest} />
      <Text style={[styles.voiceButtonText, { color: colors.forest }]}>{t(language, "listen")}</Text>
    </PressableScale>
  );
}

export function EmptyState({ title, subtitle, icon }: { title: string; subtitle: string; icon: ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.forestLight }]}>{icon}</View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>{subtitle}</Text>
    </View>
  );
}

export function Divider() {
  const { colors } = useTheme();
  return <View style={[styles.divider, { backgroundColor: colors.border }]} />;
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 34, flexGrow: 1 },
  topBar: { minHeight: 48, flexDirection: "row", alignItems: "center", marginBottom: 16 },
  backButton: { width: 34, height: 40, justifyContent: "center", alignItems: "flex-start" },
  topBarTitle: { flex: 1, fontFamily: "serif", fontSize: 20, textAlign: "center" },
  topBarRight: { width: 34, alignItems: "flex-end" },
  heading: { marginTop: 4, marginBottom: 16, gap: 8 },
  center: { alignItems: "center" },
  headingTitle: { fontFamily: "serif", fontSize: 32, lineHeight: 40, fontWeight: "700", letterSpacing: -1 },
  headingSubtitle: { fontSize: 15, lineHeight: 24 },
  textCenter: { textAlign: "center" },
  primaryButton: { minHeight: 56, borderRadius: 999, paddingHorizontal: 24, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  primaryButtonPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  primaryButtonText: { fontSize: 16, fontWeight: "600" },
  secondaryButton: { minHeight: 52, borderRadius: 16, alignItems: "center", justifyContent: "center", borderWidth: 1, paddingHorizontal: 20 },
  secondaryButtonPressed: { opacity: 0.85 },
  secondaryButtonText: { fontFamily: "serif", fontSize: 16 },
  actionCard: { minHeight: 88, flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 20, borderWidth: 1, marginBottom: 8, gap: 12 },
  cardPressed: { opacity: 0.8 },
  actionIcon: { width: 56, height: 56, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  actionTextWrap: { flex: 1, gap: 4 },
  actionTitle: { fontFamily: "serif", fontWeight: "600", fontSize: 15 },
  actionSubtitle: { fontSize: 12, lineHeight: 18 },
  fieldWrap: { marginBottom: 12, gap: 4 },
  fieldLabel: { fontSize: 11, fontWeight: "600", letterSpacing: 0.8, textTransform: "uppercase" },
  fieldInputRow: { minHeight: 52, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, flexDirection: "row", alignItems: "center" },
  fieldInput: { flex: 1, fontSize: 15, lineHeight: 24, paddingVertical: 8 },
  multiline: { minHeight: 96, alignItems: "flex-start" },
  fieldInputMultiline: { minHeight: 76 },
  statusPill: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 0, alignSelf: "flex-start" },
  statusText: { fontSize: 10, fontWeight: "700" },
  sectionLabel: { fontSize: 11, fontWeight: "600", letterSpacing: 0.8, textTransform: "uppercase", marginTop: 8, marginBottom: 8 },
  voiceButton: { alignSelf: "flex-start", flexDirection: "row", gap: 6, alignItems: "center", paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999 },
  voiceButtonText: { fontSize: 11, fontWeight: "600" },
  emptyState: { alignItems: "center", justifyContent: "center", paddingVertical: 48, paddingHorizontal: 24, borderRadius: 24, borderWidth: 1 },
  emptyIcon: { width: 72, height: 72, borderRadius: 20, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  emptyTitle: { fontFamily: "serif", fontSize: 20, fontWeight: "600", textAlign: "center" },
  emptySubtitle: { fontSize: 12, lineHeight: 18, textAlign: "center", marginTop: 8 },
  divider: { height: 1, marginVertical: 12 },
});