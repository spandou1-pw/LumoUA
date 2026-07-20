import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { usePremiumStatus, useCosmeticCatalog, useSelectCosmetic, CosmeticItem } from '../../api/hooks/useGrowthFeatures';
import { Button } from '../../components/Button';
import { ErrorState, EmptyState } from '../../components/StateViews';
import { Skeleton } from '../../components/Skeleton';
import { colors, spacing } from '../../theme/tokens';
import { ApiError } from '../../api/client';

const CATEGORIES = ['badge', 'frame', 'theme', 'banner', 'username_color'] as const;

export function PremiumScreen() {
  const status = usePremiumStatus();
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('badge');
  const catalog = useCosmeticCatalog(category);
  const select = useSelectCosmetic();

  if (status.isLoading) {
    return (
      <View style={styles.screen}>
        <Skeleton style={{ height: 120, marginTop: 20 }} />
      </View>
    );
  }

  if (status.isError) {
    return (
      <View style={styles.screen}>
        <ErrorState
          message={status.error instanceof ApiError ? status.error.message : 'Не вдалося завантажити статус Premium.'}
          onRetry={() => status.refetch()}
        />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.statusCard, status.data?.isPremium && styles.statusCardActive]}>
        <Text style={styles.statusTitle}>{status.data?.isPremium ? '✦ Ви Premium' : 'Спробуйте Premium'}</Text>
        {status.data?.isPremium ? (
          <Text style={styles.statusBody}>
            {status.data.renewsAt
              ? `Поновлення ${new Date(status.data.renewsAt).toLocaleDateString('uk-UA')}`
              : 'Активна підписка'}
          </Text>
        ) : (
          <Text style={styles.statusBody}>Анімовані бейджі, рамки, банери та більше лімітів.</Text>
        )}
      </View>

      <View style={styles.tabs}>
        {CATEGORIES.map((c) => (
          <Text
            key={c}
            onPress={() => setCategory(c)}
            style={[styles.tab, category === c && styles.tabActive]}
            accessibilityRole="button"
          >
            {c}
          </Text>
        ))}
      </View>

      {catalog.isLoading && <Skeleton style={{ height: 200, marginTop: 12 }} />}

      {catalog.isError && (
        <ErrorState
          message={catalog.error instanceof ApiError ? catalog.error.message : 'Не вдалося завантажити каталог.'}
          onRetry={() => catalog.refetch()}
        />
      )}

      {catalog.data && catalog.data.length === 0 && (
        <EmptyState title="Порожньо" message="У цій категорії поки немає елементів." />
      )}

      {catalog.data && catalog.data.length > 0 && (
        <FlatList
          data={catalog.data}
          keyExtractor={(item) => item.id}
          numColumns={2}
          renderItem={({ item }) => (
            <CosmeticCard
              item={item}
              locked={item.requiresPremium && !status.data?.isPremium}
              onSelect={() => select.mutate(item.id)}
            />
          )}
        />
      )}
    </View>
  );
}

function CosmeticCard({ item, locked, onSelect }: { item: CosmeticItem; locked: boolean; onSelect: () => void }) {
  return (
    <View style={styles.card}>
      <View style={[styles.cardPreview, locked && styles.cardPreviewLocked]}>
        {item.isAnimated && <Text style={styles.animatedBadge}>✨</Text>}
      </View>
      <Text style={styles.cardName} numberOfLines={1}>
        {item.name}
      </Text>
      <Button label={locked ? 'Premium' : 'Обрати'} variant={locked ? 'secondary' : 'primary'} size="sm" onPress={onSelect} disabled={locked} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.stone, padding: spacing.lg },
  statusCard: { backgroundColor: colors.wheatSoft, borderRadius: 16, padding: 20, marginBottom: spacing.lg },
  statusCardActive: { backgroundColor: colors.chornozem },
  statusTitle: { fontSize: 17, fontWeight: '800', color: colors.chornozem, marginBottom: 4 },
  statusBody: { fontSize: 13, color: colors.textSecondary },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.md },
  tab: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999, backgroundColor: colors.white },
  tabActive: { backgroundColor: colors.wheat, color: colors.chornozem },
  card: { flex: 1, margin: 6, backgroundColor: colors.white, borderRadius: 12, padding: 10, alignItems: 'center', gap: 8 },
  cardPreview: { width: '100%', height: 70, borderRadius: 8, backgroundColor: colors.chicorySoft, alignItems: 'center', justifyContent: 'center' },
  cardPreviewLocked: { opacity: 0.5 },
  animatedBadge: { fontSize: 20 },
  cardName: { fontSize: 12, fontWeight: '600', color: colors.textPrimary },
});
