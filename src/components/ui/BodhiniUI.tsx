import React, { type ReactNode } from "react";
import {
  ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet,
  Text, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, ChevronRight, Volume2 } from "lucide-react-native";
import { colors, radii } from "../../theme/tokens";

export function BodhiniScreen({ children, scroll = true, contentStyle, backgroundColor = colors.background }: {
  children: ReactNode; scroll?: boolean; contentStyle?: StyleProp<ViewStyle>; backgroundColor?: string;
}) {
  return <SafeAreaView style={[styles.safe, { backgroundColor }]} edges={["top", "left", "right"]}>
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      {scroll ? <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, contentStyle]}>{children}</ScrollView>
        : <View style={[styles.content, styles.flex, contentStyle]}>{children}</View>}
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

export function TopBar({ title, onBack, right }: { title?: string; onBack?: () => void; right?: ReactNode }) {
  return <View style={styles.topBar}>
    <Pressable onPress={onBack} disabled={!onBack} hitSlop={10} style={styles.backButton} accessibilityRole="button" accessibilityLabel="Go back">
      {onBack ? <ArrowLeft size={22} color={colors.ink} /> : null}
    </Pressable>
    <Text style={styles.topBarTitle}>{title ?? ""}</Text>
    <View style={styles.topBarRight}>{right}</View>
  </View>;
}

export function PageHeading({ title, subtitle, align = "left" }: { title: string; subtitle?: string; align?: "left" | "center" }) {
  return <View style={[styles.heading, align === "center" && styles.center]}>
    <Text style={[styles.headingTitle, align === "center" && styles.textCenter]}>{title}</Text>
    {subtitle ? <Text style={[styles.headingSubtitle, align === "center" && styles.textCenter]}>{subtitle}</Text> : null}
  </View>;
}

export function PrimaryButton({ title, onPress, disabled = false, loading = false, icon, style }: {
  title: string; onPress: () => void; disabled?: boolean; loading?: boolean; icon?: ReactNode; style?: StyleProp<ViewStyle>;
}) {
  return <Pressable onPress={onPress} disabled={disabled || loading} accessibilityRole="button" style={({ pressed }) => [styles.primaryButton, style, (pressed || disabled) && styles.primaryButtonPressed]}>
    {loading ? <ActivityIndicator color={colors.white} /> : <>{icon}<Text style={styles.primaryButtonText}>{title}</Text></>}
  </Pressable>;
}

export function SecondaryButton({ title, onPress, style }: { title: string; onPress: () => void; style?: StyleProp<ViewStyle> }) {
  return <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [styles.secondaryButton, style, pressed && { opacity: 0.7 }]}><Text style={styles.secondaryButtonText}>{title}</Text></Pressable>;
}

export function ActionCard({ title, subtitle, icon, tint = colors.forest, onPress, trailing = true }: {
  title: string; subtitle?: string; icon: ReactNode; tint?: string; onPress: () => void; trailing?: boolean;
}) {
  return <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [styles.actionCard, pressed && styles.cardPressed]}>
    <View style={[styles.actionIcon, { backgroundColor: tint }]}>{icon}</View>
    <View style={styles.actionTextWrap}><Text style={styles.actionTitle}>{title}</Text>{subtitle ? <Text style={styles.actionSubtitle}>{subtitle}</Text> : null}</View>
    {trailing ? <ChevronRight color={colors.muted} size={20} /> : null}
  </Pressable>;
}

export function FieldInput({ label, value, onChangeText, placeholder, secureTextEntry, right, multiline, keyboardType }: {
  label: string; value: string; onChangeText: (value: string) => void; placeholder?: string;
  secureTextEntry?: boolean; right?: ReactNode; multiline?: boolean; keyboardType?: TextInputProps["keyboardType"];
}) {
  return <View style={styles.fieldWrap}><Text style={styles.fieldLabel}>{label}</Text>
    <View style={[styles.fieldInputRow, multiline && styles.multiline]}>
      <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder ?? `Enter ${label.toLowerCase()}`}
        placeholderTextColor="#A69B8D" style={[styles.fieldInput, multiline && styles.fieldInputMultiline]}
        secureTextEntry={secureTextEntry} multiline={multiline} textAlignVertical={multiline ? "top" : "center"}
        keyboardType={keyboardType} autoCapitalize="sentences" />{right}
    </View>
  </View>;
}

export function StatusPill({ label, tone = "green" }: { label: string; tone?: "green" | "gold" | "red" | "neutral" }) {
  const theme = tone === "green" ? { bg: "#E4EEE3", text: colors.forest } : tone === "gold" ? { bg: "#F6E8D4", text: "#8A5A2C" }
    : tone === "red" ? { bg: "#F6E1DA", text: colors.danger } : { bg: "#ECE5DB", text: colors.muted };
  return <View style={[styles.statusPill, { backgroundColor: theme.bg }]}><Text style={[styles.statusText, { color: theme.text }]}>{label}</Text></View>;
}
export function SectionLabel({ children }: { children: ReactNode }) { return <Text style={styles.sectionLabel}>{children}</Text>; }
export function VoicePromptButton({ onPress }: { onPress: () => void }) {
  return <Pressable onPress={onPress} style={styles.voiceButton} accessibilityRole="button" accessibilityLabel="Read this screen aloud"><Volume2 size={17} color={colors.forest} /><Text style={styles.voiceButtonText}>Listen</Text></Pressable>;
}
export function EmptyState({ title, subtitle, icon }: { title: string; subtitle: string; icon: ReactNode }) {
  return <View style={styles.emptyState}><View style={styles.emptyIcon}>{icon}</View><Text style={styles.emptyTitle}>{title}</Text><Text style={styles.emptySubtitle}>{subtitle}</Text></View>;
}
export function Divider() { return <View style={styles.divider} />; }

const styles = StyleSheet.create({
  safe: { flex: 1 }, flex: { flex: 1 },
  content: { paddingHorizontal: 22, paddingTop: 12, paddingBottom: 34, flexGrow: 1 },
  topBar: { minHeight: 48, flexDirection: "row", alignItems: "center", marginBottom: 18 },
  backButton: { width: 34, height: 40, justifyContent: "center", alignItems: "flex-start" },
  topBarTitle: { flex: 1, color: colors.ink, fontFamily: "serif", fontSize: 17, textAlign: "center" },
  topBarRight: { width: 34, alignItems: "flex-end" },
  heading: { marginTop: 4, marginBottom: 18, gap: 8 }, center: { alignItems: "center" },
  headingTitle: { color: colors.ink, fontFamily: "serif", fontSize: 27, lineHeight: 34, fontWeight: "600" },
  headingSubtitle: { color: colors.muted, fontSize: 14, lineHeight: 21 }, textCenter: { textAlign: "center" },
  primaryButton: { minHeight: 56, borderRadius: radii.pill, paddingHorizontal: 24, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: colors.forest, shadowColor: "#263B30", shadowOpacity: 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 3 },
  primaryButtonPressed: { opacity: 0.82, transform: [{ scale: 0.99 }] }, primaryButtonText: { color: colors.white, fontSize: 16, fontWeight: "600" },
  secondaryButton: { minHeight: 52, borderRadius: radii.lg, alignItems: "center", justifyContent: "center", backgroundColor: colors.cardStrong, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 18 },
  secondaryButtonText: { color: colors.ink, fontFamily: "serif", fontSize: 16 },
  actionCard: { minHeight: 82, flexDirection: "row", alignItems: "center", padding: 13, borderRadius: radii.lg, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, marginBottom: 10, gap: 13, shadowColor: "#70583F", shadowOpacity: 0.045, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 1 },
  cardPressed: { opacity: 0.76 }, actionIcon: { width: 52, height: 52, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  actionTextWrap: { flex: 1, gap: 5 }, actionTitle: { color: colors.ink, fontFamily: "serif", fontWeight: "600", fontSize: 16 },
  actionSubtitle: { color: colors.muted, fontSize: 12, lineHeight: 17 }, fieldWrap: { marginBottom: 13, gap: 6 },
  fieldLabel: { color: colors.muted, fontSize: 12, fontWeight: "600" },
  fieldInputRow: { minHeight: 48, borderRadius: radii.md, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.paper, paddingHorizontal: 13, flexDirection: "row", alignItems: "center" },
  fieldInput: { flex: 1, color: colors.ink, fontSize: 14, paddingVertical: 10 }, multiline: { minHeight: 88, alignItems: "flex-start" }, fieldInputMultiline: { minHeight: 70 },
  statusPill: { borderRadius: radii.pill, paddingHorizontal: 10, paddingVertical: 5, alignSelf: "flex-start" }, statusText: { fontSize: 11, fontWeight: "700" },
  sectionLabel: { color: colors.muted, fontSize: 11, fontWeight: "700", letterSpacing: 1.2, textTransform: "uppercase", marginTop: 10, marginBottom: 10 },
  voiceButton: { alignSelf: "flex-start", flexDirection: "row", gap: 6, alignItems: "center", paddingVertical: 8, paddingHorizontal: 12, borderRadius: radii.pill, backgroundColor: colors.forestLight },
  voiceButtonText: { color: colors.forest, fontSize: 12, fontWeight: "600" },
  emptyState: { alignItems: "center", justifyContent: "center", paddingVertical: 52, paddingHorizontal: 24, backgroundColor: colors.card, borderRadius: radii.xl, borderWidth: 1, borderColor: colors.line },
  emptyIcon: { width: 64, height: 64, borderRadius: 22, backgroundColor: colors.forestLight, alignItems: "center", justifyContent: "center", marginBottom: 18 },
  emptyTitle: { color: colors.ink, fontFamily: "serif", fontSize: 20, fontWeight: "600", textAlign: "center" },
  emptySubtitle: { color: colors.muted, fontSize: 13, lineHeight: 20, textAlign: "center", marginTop: 8 }, divider: { height: 1, backgroundColor: colors.line, marginVertical: 14 },
});
