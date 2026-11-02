import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, BackHandler, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import {
  CheckCircle2,
  ChevronRight,
  Cloud,
  Cpu,
  Database,
  Globe,
  Info,
  Lock,
  Mic,
  RefreshCw,
  ShieldCheck,
  SlidersHorizontal,
  Sun,
  Trash2,
  Type,
  UserRound,
} from "lucide-react-native";
import {
  BodhiniLogoMark,
  BodhiniScreen,
  FieldInput,
  PageHeading,
  PrimaryButton,
  SecondaryButton,
  TopBar,
} from "../../components/ui/BodhiniUI";
import { useBodhini, type TextSize, type ThemeMode } from "../../state/AppContext";
import { t } from "../../i18n/translations";
import { useTheme } from "../../theme/ThemeProvider";
import { AnimatedSwitch, FadeInUp, Hint, PressableScale, SegmentedControl } from "../../components/motion";

type SubView = "main" | "account" | "security" | "storage" | "about";

export default function ProfileScreen() {
  const router = useRouter();
  const {
    language,
    interactionMode,
    setInteractionMode,
    documents,
    themeMode,
    setThemeMode,
    profileName,
    setProfileName,
    textSize,
    setTextSize,
    userReduceMotion,
    setReduceMotion,
    debugOcr,
    setDebugOcr,
    clearAllData,
    openComingSoon,
    showToast,
  } = useBodhini();
  const { colors, theme, setMode: setThemeModeDirect } = useTheme();

  const [subView, setSubView] = useState<SubView>("main");
  const [draftName, setDraftName] = useState(profileName);
  const [savingName, setSavingName] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);

  useEffect(() => {
    setDraftName(profileName);
  }, [profileName]);

  useEffect(() => {
    if (subView === "main") return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      setSubView("main");
      return true;
    });
    return () => sub.remove();
  }, [subView]);

  const languageLabel = language === "bn" ? "বাংলা" : language === "hi" ? "हिंदी" : "English";

  const themeOptions = useMemo(() => [
    { value: "system" as ThemeMode, label: t(language, "themeSystem") },
    { value: "light" as ThemeMode, label: t(language, "themeLight") },
    { value: "dark" as ThemeMode, label: t(language, "themeDark") },
  ], [language]);

  const textSizeOptions = useMemo(() => [
    { value: "1", label: t(language, "textSizeDefault") },
    { value: "1.15", label: t(language, "textSizeLarge") },
    { value: "1.3", label: t(language, "textSizeLarger") },
  ], [language]);

  const handleSaveName = useCallback(async () => {
    if (savingName) return;
    setSavingName(true);
    try {
      await setProfileName(draftName);
      showToast(t(language, "nameSavedToast"));
      setSubView("main");
    } catch {
      Alert.alert(t(language, "saveFailed"), t(language, "pleaseTryAgain"));
    } finally {
      setSavingName(false);
    }
  }, [draftName, language, savingName, setProfileName, showToast]);

  const handleDeleteAll = useCallback(() => {
    if (documents.length === 0) {
      showToast(t(language, "noDataToDelete"));
      return;
    }
    Alert.alert(t(language, "deleteAllConfirmTitle"), t(language, "deleteAllConfirmBody"), [
      { text: t(language, "cancel"), style: "cancel" },
      {
        text: t(language, "deleteAllData"),
        style: "destructive",
        onPress: async () => {
          setDeletingAll(true);
          try {
            await clearAllData();
            showToast(t(language, "allDataDeletedToast"));
          } catch {
            Alert.alert(t(language, "deleteFailed"), t(language, "pleaseTryAgain"));
          } finally {
            setDeletingAll(false);
          }
        },
      },
    ]);
  }, [clearAllData, documents.length, language, showToast]);

  const handleVoiceRowPress = useCallback(() => {
    Alert.alert(t(language, "voiceUnderDevelopmentTitle"), t(language, "voiceUnderDevelopmentMessage"), [
      {
        text: t(language, "speak"),
        onPress: () => setInteractionMode("speak").catch(() => undefined),
      },
      {
        text: t(language, "type"),
        onPress: () => setInteractionMode("type").catch(() => undefined),
      },
      { text: t(language, "cancel"), style: "cancel" },
    ]);
  }, [language, setInteractionMode]);

  if (subView === "security") {
    const securityItems = [
      {
        icon: <Database size={22} color={colors.text} />,
        title: t(language, "secItem1Title"),
        body: t(language, "secItem1Body"),
      },
      {
        icon: <Cpu size={22} color={colors.text} />,
        title: t(language, "secItem2Title"),
        body: t(language, "secItem2Body"),
      },
      {
        icon: <CheckCircle2 size={22} color={colors.text} />,
        title: t(language, "secItem3Title"),
        body: t(language, "secItem3Body"),
      },
      {
        icon: <ShieldCheck size={22} color={colors.text} />,
        title: t(language, "secItem4Title"),
        body: t(language, "secItem4Body"),
      },
    ];

    return (
      <BodhiniScreen inTabs contentStyle={styles.page}>
        <TopBar onBack={() => setSubView("main")} />
        <PageHeading title={t(language, "securityPrivacyTitle")} subtitle={t(language, "privateOffline")} />
        <View style={[styles.cardGroup, { backgroundColor: colors.surface, borderColor: colors.separator }]}>
          {securityItems.map((item, idx) => (
            <FadeInUp key={item.title} index={idx}>
              <View
                style={[
                  styles.secRow,
                  { borderBottomColor: colors.separator },
                  idx === securityItems.length - 1 && styles.rowLast,
                ]}
              >
                <View style={[styles.secIconWrap, { backgroundColor: colors.surfaceAlt }]}>{item.icon}</View>
                <View style={styles.secTextCol}>
                  <Text style={[styles.secTitle, { color: colors.text, fontSize: theme.typeScale.bodyStrong.fontSize }]}>
                    {item.title}
                  </Text>
                  <Text style={[styles.secBody, { color: colors.secondaryText, fontSize: theme.typeScale.caption.fontSize }]}>
                    {item.body}
                  </Text>
                </View>
              </View>
            </FadeInUp>
          ))}
        </View>
      </BodhiniScreen>
    );
  }

  if (subView === "account") {
    return (
      <BodhiniScreen inTabs contentStyle={styles.page}>
        <TopBar title={t(language, "accountRow")} onBack={() => setSubView("main")} />
        <PageHeading title={t(language, "editProfileName")} subtitle={t(language, "accountSubEmpty")} />
        <View style={[styles.accountCard, { backgroundColor: colors.surface, borderColor: colors.separator }]}>
          <FieldInput
            label={t(language, "editProfileName")}
            value={draftName}
            onChangeText={setDraftName}
            placeholder={t(language, "profileNamePlaceholder")}
          />
          <View style={styles.accountActions}>
            <PrimaryButton
              title={t(language, "saveName")}
              onPress={handleSaveName}
              loading={savingName}
              hint={t(language, "saveName")}
            />
            {draftName.trim().length > 0 ? (
              <SecondaryButton
                title={t(language, "clearName")}
                onPress={() => setDraftName("")}
                hint={t(language, "clearName")}
              />
            ) : null}
          </View>
        </View>
      </BodhiniScreen>
    );
  }

  if (subView === "storage") {
    const countLabel = `${documents.length} ${documents.length === 1 ? t(language, "savedDocumentCount") : t(language, "savedDocumentsCount")}`;
    return (
      <BodhiniScreen inTabs contentStyle={styles.page}>
        <TopBar title={t(language, "dataStorageTitle")} onBack={() => setSubView("main")} />
        <PageHeading title={t(language, "dataStorageTitle")} subtitle={t(language, "localStorageNote")} />
        <View style={[styles.storageCard, { backgroundColor: colors.surface, borderColor: colors.separator }]}>
          <View style={[styles.storageStatRow, { borderBottomColor: colors.separator }]}>
            <Database size={22} color={colors.primary} />
            <View style={styles.rowTextCol}>
              <Text style={[styles.rowTitle, { color: colors.text, fontSize: theme.typeScale.bodyStrong.fontSize }]}>
                {t(language, "storedOnDevice")}
              </Text>
              <Text style={[styles.rowSub, { color: colors.secondaryText, fontSize: theme.typeScale.caption.fontSize }]}>
                {countLabel}
              </Text>
            </View>
          </View>
          <Hint hint={t(language, "deleteAllData")} label={t(language, "deleteAllData")}>
            <PressableScale
              onPress={handleDeleteAll}
              disabled={deletingAll}
              accessibilityRole="button"
              accessibilityLabel={t(language, "deleteAllData")}
              style={styles.deleteAllRow}
            >
              <Trash2 size={20} color={colors.danger} />
              <Text style={[styles.deleteAllText, { color: colors.danger, fontSize: theme.typeScale.bodyStrong.fontSize }]}>
                {t(language, "deleteAllData")}
              </Text>
            </PressableScale>
          </Hint>
        </View>
      </BodhiniScreen>
    );
  }

  if (subView === "about") {
    const [versionTapCount, setVersionTapCount] = useState(0);
    const [lastTapTime, setLastTapTime] = useState(0);

    const handleVersionPress = () => {
      const now = Date.now();
      if (now - lastTapTime < 4000) {
        setVersionTapCount((c) => c + 1);
      } else {
        setVersionTapCount(1);
      }
      setLastTapTime(now);

      if (versionTapCount + 1 >= 7) {
        setVersionTapCount(0);
        const newVal = !debugOcr;
        setDebugOcr(newVal).catch(() => undefined);
        showToast(newVal ? t(language, "debugOcrEnabled") : t(language, "debugOcrDisabled"));
      }
    };

    return (
      <BodhiniScreen inTabs contentStyle={styles.page}>
        <TopBar title={t(language, "about")} onBack={() => setSubView("main")} />
        <View style={[styles.aboutCard, { backgroundColor: colors.surface, borderColor: colors.separator }]}>
          <BodhiniLogoMark size={56} />
          <Text style={[styles.aboutTitle, { color: colors.text, fontSize: theme.typeScale.title.fontSize }]}>
            {t(language, "aboutTitle")}
          </Text>
          <Text style={[styles.aboutBody, { color: colors.secondaryText, fontSize: theme.typeScale.body.fontSize }]}>
            {t(language, "aboutBody")}
          </Text>
          <Text style={[styles.aboutVersion, { color: colors.secondaryText, fontSize: theme.typeScale.caption.fontSize }]}>
            {t(language, "versionLabel")}
          </Text>
          <PressableScale
            onPress={handleVersionPress}
            accessibilityRole="button"
            accessibilityLabel={t(language, "debugOcrLabel")}
            style={styles.versionRow}
          >
            <Text style={[styles.versionRowText, { color: colors.secondaryText, fontSize: theme.typeScale.caption.fontSize }]}>
              {t(language, "debugOcrLabel")}
            </Text>
          </PressableScale>
        </View>
      </BodhiniScreen>
    );
  }

  const mainRows = [
    {
      id: "account",
      icon: <UserRound size={20} color={colors.text} />,
      title: t(language, "accountRow"),
      sub: profileName.trim() || t(language, "accountSubEmpty"),
      onPress: () => setSubView("account"),
    },
    {
      id: "cloud",
      icon: <Cloud size={20} color={colors.text} />,
      title: t(language, "bodhiniCloudRow"),
      sub: t(language, "comingSoonBadge"),
      onPress: () => openComingSoon(t(language, "bodhiniCloudRow")),
    },
    {
      id: "backup",
      icon: <RefreshCw size={20} color={colors.text} />,
      title: t(language, "autoBackupRow"),
      sub: t(language, "comingSoonBadge"),
      onPress: () => openComingSoon(t(language, "autoBackupRow")),
    },
    {
      id: "security",
      icon: <ShieldCheck size={20} color={colors.text} />,
      title: t(language, "securityPrivacyTitle"),
      sub: t(language, "storedOnDevice"),
      onPress: () => setSubView("security"),
    },
    {
      id: "applock",
      icon: <Lock size={20} color={colors.text} />,
      title: t(language, "appLockRow"),
      sub: t(language, "comingSoonBadge"),
      onPress: () => openComingSoon(t(language, "appLockRow")),
    },
    {
      id: "storage",
      icon: <Database size={20} color={colors.text} />,
      title: t(language, "dataStorageTitle"),
      sub: `${documents.length} ${t(language, "savedCountLabel")}`,
      onPress: () => setSubView("storage"),
    },
    {
      id: "language",
      icon: <Globe size={20} color={colors.text} />,
      title: t(language, "language"),
      sub: languageLabel,
      onPress: () => router.push("/(onboarding)/language"),
    },
  ];

  return (
    <BodhiniScreen inTabs contentStyle={styles.page}>
      <Text
        style={[
          styles.pageTitle,
          {
            color: colors.text,
            fontSize: theme.typeScale.largeTitle.fontSize,
            lineHeight: theme.typeScale.largeTitle.lineHeight,
          },
        ]}
      >
        {t(language, "settingsTitle")}
      </Text>

      <FadeInUp index={0}>
        <View style={[styles.cardGroup, { backgroundColor: colors.surface, borderColor: colors.separator }]}>
          {mainRows.map((row, idx) => (
            <Hint key={row.id} hint={t(language, "hintSettingRow")} label={`${row.title}, ${row.sub}`}>
              <PressableScale
                onPress={row.onPress}
                accessibilityRole="button"
                accessibilityLabel={`${row.title}, ${row.sub}`}
                style={[
                  styles.settingRow,
                  { borderBottomColor: colors.separator },
                  idx === mainRows.length - 1 && styles.rowLast,
                ]}
              >
                <View style={styles.rowIcon}>{row.icon}</View>
                <View style={styles.rowTextCol}>
                  <Text style={[styles.rowTitle, { color: colors.text, fontSize: theme.typeScale.bodyStrong.fontSize }]}>
                    {row.title}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={[styles.rowSub, { color: colors.secondaryText, fontSize: theme.typeScale.caption.fontSize }]}
                  >
                    {row.sub}
                  </Text>
                </View>
                <ChevronRight size={20} color={colors.secondaryText} />
              </PressableScale>
            </Hint>
          ))}
        </View>
      </FadeInUp>

      <FadeInUp index={1}>
        <Text style={[styles.sectionHeader, { color: colors.secondaryText, fontSize: theme.typeScale.label.fontSize }]}>
          {t(language, "appearanceSection")}
        </Text>
        <View style={[styles.cardGroup, { backgroundColor: colors.surface, borderColor: colors.separator }]}>
          <View style={[styles.controlBlock, { borderBottomColor: colors.separator }]}>
            <View style={styles.controlLabelRow}>
              <Sun size={20} color={colors.text} />
              <Text style={[styles.rowTitle, { color: colors.text, fontSize: theme.typeScale.bodyStrong.fontSize }]}>
                {t(language, "themeRow")}
              </Text>
            </View>
            <SegmentedControl
              options={themeOptions}
              value={themeMode}
              onChange={(v: ThemeMode) => {
                setThemeMode(v).catch(() => undefined);
                setThemeModeDirect(v);
              }}
            />
          </View>

          <View style={[styles.controlBlock, { borderBottomColor: colors.separator }]}>
            <View style={styles.controlLabelRow}>
              <Type size={20} color={colors.text} />
              <Text style={[styles.rowTitle, { color: colors.text, fontSize: theme.typeScale.bodyStrong.fontSize }]}>
                {t(language, "textSizeRow")}
              </Text>
            </View>
            <SegmentedControl
              options={textSizeOptions}
              value={String(textSize)}
              onChange={(v) => setTextSize(Number(v) as TextSize).catch(() => undefined)}
            />
          </View>

          <View style={[styles.settingRow, { borderBottomColor: colors.separator }]}>
            <View style={styles.rowIcon}>
              <SlidersHorizontal size={20} color={colors.text} />
            </View>
            <View style={styles.rowTextCol}>
              <Text style={[styles.rowTitle, { color: colors.text, fontSize: theme.typeScale.bodyStrong.fontSize }]}>
                {t(language, "reduceMotionRow")}
              </Text>
              <Text style={[styles.rowSub, { color: colors.secondaryText, fontSize: theme.typeScale.caption.fontSize }]}>
                {t(language, "reduceMotionSub")}
              </Text>
            </View>
            <AnimatedSwitch
              value={userReduceMotion}
              onValueChange={(val) => setReduceMotion(val).catch(() => undefined)}
              label={t(language, "reduceMotionRow")}
              hint={t(language, "hintToggleMotion")}
            />
          </View>

          <Hint hint={t(language, "hintSettingRow")} label={t(language, "voicePreferences")}>
            <PressableScale
              onPress={handleVoiceRowPress}
              accessibilityRole="button"
              accessibilityLabel={t(language, "voicePreferences")}
              style={[styles.settingRow, { borderBottomColor: colors.separator }]}
            >
              <View style={styles.rowIcon}>
                <Mic size={20} color={colors.text} />
              </View>
              <View style={styles.rowTextCol}>
                <Text style={[styles.rowTitle, { color: colors.text, fontSize: theme.typeScale.bodyStrong.fontSize }]}>
                  {t(language, "voicePreferences")}
                </Text>
                <Text style={[styles.rowSub, { color: colors.secondaryText, fontSize: theme.typeScale.caption.fontSize }]}>
                  {interactionMode === "speak" ? t(language, "speak") : t(language, "type")}
                </Text>
              </View>
              <ChevronRight size={20} color={colors.secondaryText} />
            </PressableScale>
          </Hint>

          <Hint hint={t(language, "hintSettingRow")} label={t(language, "about")}>
            <PressableScale
              onPress={() => setSubView("about")}
              accessibilityRole="button"
              accessibilityLabel={t(language, "about")}
              style={[styles.settingRow, styles.rowLast]}
            >
              <View style={styles.rowIcon}>
                <Info size={20} color={colors.text} />
              </View>
              <View style={styles.rowTextCol}>
                <Text style={[styles.rowTitle, { color: colors.text, fontSize: theme.typeScale.bodyStrong.fontSize }]}>
                  {t(language, "about")}
                </Text>
                <Text style={[styles.rowSub, { color: colors.secondaryText, fontSize: theme.typeScale.caption.fontSize }]}>
                  {t(language, "versionLabel")}
                </Text>
              </View>
              <ChevronRight size={20} color={colors.secondaryText} />
            </PressableScale>
          </Hint>
        </View>
      </FadeInUp>
    </BodhiniScreen>
  );
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 8,
  },
  pageTitle: {
    fontWeight: "700",
    letterSpacing: -0.6,
    marginBottom: 16,
  },
  sectionHeader: {
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginTop: 8,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  cardGroup: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    marginBottom: 16,
  },
  settingRow: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowIcon: {
    width: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  rowTextCol: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontWeight: "600",
  },
  rowSub: {},
  controlBlock: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  controlLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  secRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 18,
    gap: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  secIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  secTextCol: {
    flex: 1,
    gap: 4,
  },
  secTitle: {
    fontWeight: "600",
  },
  secBody: {
    lineHeight: 19,
  },
  accountCard: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 18,
    gap: 12,
  },
  accountActions: {
    gap: 10,
    marginTop: 8,
  },
  storageCard: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  storageStatRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    gap: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  deleteAllRow: {
    minHeight: 56,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  deleteAllText: {
    fontWeight: "600",
  },
  aboutCard: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 28,
    alignItems: "center",
    gap: 14,
  },
  aboutTitle: {
    fontWeight: "700",
    textAlign: "center",
    marginTop: 4,
  },
  aboutBody: {
    textAlign: "center",
    lineHeight: 24,
  },
  aboutVersion: {
    textAlign: "center",
    marginTop: 4,
  },
  versionRow: {
    minHeight: 48,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  versionRowText: {
    fontWeight: "500",
  },
});
