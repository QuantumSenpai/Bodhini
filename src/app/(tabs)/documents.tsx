import React, { useCallback } from "react";
import { FlatList, type ListRenderItemInfo, Platform, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { CreditCard, Plus } from "lucide-react-native";
import type { DocumentRecord } from "../../domain/document/document.types";
import { BodhiniScreen, EmptyState, WalletCardRow } from "../../components/ui/BodhiniUI";
import { useBodhini } from "../../state/AppContext";
import { t } from "../../i18n/translations";
import { FadeInUp, Hint, PressableScale, Shimmer } from "../../components/motion";
import { useTheme } from "../../theme/ThemeProvider";

const ITEM_STRIDE = 104;

function keyExtractor(item: DocumentRecord): string {
  return item.id;
}

function getItemLayout(_data: ArrayLike<DocumentRecord> | null | undefined, index: number) {
  return {
    length: ITEM_STRIDE,
    offset: ITEM_STRIDE * index,
    index,
  };
}

export default function DocumentsScreen() {
  const router = useRouter();
  const { documents, documentsLoading, refreshDocuments, language } = useBodhini();
  const { colors, theme } = useTheme();

  useFocusEffect(
    useCallback(() => {
      refreshDocuments().catch(() => undefined);
    }, [refreshDocuments]),
  );

  const handleOpenDocument = useCallback((id: string) => {
    router.push({ pathname: "/documents/[id]", params: { id } });
  }, [router]);

  const handleAddDocument = useCallback(() => {
    router.push("/scan/camera");
  }, [router]);

  const renderItem = useCallback(({ item, index }: ListRenderItemInfo<DocumentRecord>) => (
    <FadeInUp index={index} maxAnimated={8}>
      <WalletCardRow doc={item} onPress={handleOpenDocument} />
    </FadeInUp>
  ), [handleOpenDocument]);

  return (
    <BodhiniScreen scroll={false} inTabs contentStyle={styles.page}>
      <View style={styles.headerRow}>
        <Text
          style={[
            styles.title,
            {
              color: colors.text,
              fontSize: theme.typeScale.largeTitle.fontSize,
              lineHeight: theme.typeScale.largeTitle.lineHeight,
            },
          ]}
        >
          {t(language, "walletTitle")}
        </Text>
        <Hint hint={t(language, "hintAddDoc")} label={t(language, "addDocument")}>
          <PressableScale
            onPress={handleAddDocument}
            accessibilityRole="button"
            accessibilityLabel={t(language, "addDocument")}
            style={styles.addHit}
          >
            <Plus color={colors.text} size={26} strokeWidth={2.2} />
          </PressableScale>
        </Hint>
      </View>

      {documentsLoading && documents.length === 0 ? (
        <View style={styles.shimmerList}>
          <Shimmer height={92} borderRadius={20} />
          <Shimmer height={92} borderRadius={20} />
          <Shimmer height={92} borderRadius={20} />
        </View>
      ) : null}

      {!documentsLoading && documents.length === 0 ? (
        <View style={styles.emptyWrap}>
          <EmptyState
            icon={<CreditCard color={colors.primary} size={30} />}
            title={t(language, "noDocumentsTitle")}
            subtitle={t(language, "noDocumentsHint")}
            actionTitle={t(language, "scan")}
            onAction={handleAddDocument}
          />
        </View>
      ) : null}

      {documents.length > 0 ? (
        <FlatList
          data={documents}
          keyExtractor={keyExtractor}
          getItemLayout={getItemLayout}
          renderItem={renderItem}
          windowSize={5}
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          removeClippedSubviews={Platform.OS === "android"}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      ) : null}
    </BodhiniScreen>
  );
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 8,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  title: {
    fontWeight: "700",
    letterSpacing: -0.6,
  },
  addHit: {
    width: 48,
    height: 48,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  shimmerList: {
    gap: 12,
    marginTop: 4,
  },
  emptyWrap: {
    marginTop: 12,
  },
  listContent: {
    paddingBottom: 28,
  },
});
