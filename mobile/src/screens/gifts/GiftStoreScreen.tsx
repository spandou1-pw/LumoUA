import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useGiftStore, useSendGift, GiftCatalogItem } from '../../api/hooks/useGrowthFeatures';
import { ErrorState, EmptyState } from '../../components/StateViews';
import { Skeleton } from '../../components/Skeleton';
import { colors, spacing } from '../../theme/tokens';
import { ApiError } from '../../api/client';

const RARITY_LABELS: Record<string, string> = { common: 'Звичайні', rare: 'Рідкісні', legendary: 'Легендарні' };

export function GiftStoreScreen({ recipientId }: { recipientId: string }) {
  const [rarity, setRarity] = useState<string | undefined>(undefined);
  const store = useGiftStore(rarity ? { rarity } : undefined);
  const sendGift = useSendGift();

  return (
    <View style={styles.screen}>
      <View style={styles.filterRow}>
        <Text onPress={() => setRarity(undefined)} style={[styles.filter, !rarity && styles.filterActive]}>
          Усі
        </Text>
        {Object.entries(RARITY_LABELS).map(([key, label]) => (
          <Text key={key} onPress={() => setRarity(key)} style={[styles.filter, rarity === key && styles.filterActive]}>
            {label}
          </Text>
        ))}
      </View>

      {store.isLoading && (
        <View style={{ gap: 10 }}>
          <Skeleton style={{ height: 90 }} />
          <Skeleton style={{ height: 90 }} />
        </View>
      )}

      {store.isError && (
        <ErrorState
          message={store.error instanceof ApiError ? store.error.message : 'Не вдалося завантажити магазин подарунків.'}
          onRetry={() => store.refetch()}
        />
      )}

      {store.data && store.data.length === 0 && (
        <EmptyState title="Порожньо" message="У цій категорії поки немає подарунків." />
      )}

      {store.data && store.data.length > 0 && (
        <FlatList
          data={store.data}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <GiftRow
              item={item}
              sending={sendGift.isPending}
              onSend={() => sendGift.mutate({ recipientId, giftCatalogItemId: item.id })}
            />
          )}
        />
      )}

      {sendGift.isError && (
        <Text style={styles.sendError}>
          {sendGift.error instanceof ApiError ? sendGift.error.message : 'Не вдалося надіслати подарунок.'}
        </Text>
      )}
    </View>
  );
}

function GiftRow({ item, sending, onSend }: { item: GiftCatalogItem; sending: boolean; onSend: () => void }) {
  return (
    <View style={styles.row}>
      <View style={styles.iconPlaceholder}>{item.isAnimated && <Text>✨</Text>}</View>
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.rarity}>{RARITY_LABELS[item.rarity] ?? item.rarity}</Text>
      </View>
      <Text onPress={sending ? undefined : onSend} style={styles.priceButton}>
        {Number(item.coinCost).toLocaleString('uk-UA')} 🪙
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.stone, padding: spacing.lg },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: spacing.md, flexWrap: 'wrap' },
  filter: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999, backgroundColor: colors.white },
  filterActive: { backgroundColor: colors.wheat, color: colors.chornozem },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: 12, padding: 12, marginBottom: 8, gap: 12 },
  iconPlaceholder: { width: 44, height: 44, borderRadius: 8, backgroundColor: colors.chicorySoft, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  rarity: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  priceButton: { fontSize: 13, fontWeight: '700', color: colors.chornozem, backgroundColor: colors.wheatSoft, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8 },
  sendError: { color: colors.error, fontSize: 12, marginTop: 8, textAlign: 'center' },
});
