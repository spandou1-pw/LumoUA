import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useWalletBalance, useWalletTransactions } from '../../api/hooks/useWallet';
import { ErrorState, EmptyState } from '../../components/StateViews';
import { Skeleton } from '../../components/Skeleton';
import { colors, spacing } from '../../theme/tokens';
import { ApiError } from '../../api/client';

const TX_TYPE_LABELS: Record<string, string> = {
  coin_purchase: 'Покупка монет',
  gift_sent: 'Надіслано подарунок',
  gift_received_notional: 'Отримано подарунок',
  transfer_sent: 'Переказ надіслано',
  transfer_received: 'Переказ отримано',
  refund_reversal: 'Повернення коштів',
  admin_adjustment: 'Коригування',
  premium_grant: 'Бонус Premium',
};

export function WalletScreen() {
  const balance = useWalletBalance();
  const transactions = useWalletTransactions();

  if (balance.isLoading) {
    return (
      <View style={styles.screen}>
        <Skeleton style={{ width: 180, height: 40, alignSelf: 'center', marginTop: 40 }} />
      </View>
    );
  }

  if (balance.isError) {
    return (
      <View style={styles.screen}>
        <ErrorState
          message={balance.error instanceof ApiError ? balance.error.message : 'Не вдалося завантажити баланс.'}
          onRetry={() => balance.refetch()}
        />
      </View>
    );
  }

  const txItems = transactions.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <View style={styles.screen}>
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Баланс монет</Text>
        <Text style={styles.balanceValue}>{Number(balance.data?.coinBalance ?? 0).toLocaleString('uk-UA')}</Text>
        {balance.data?.locked && (
          <Text style={styles.lockedNotice}>🔒 Гаманець тимчасово заблоковано на перевірку</Text>
        )}
      </View>

      <Text style={styles.sectionTitle}>Історія</Text>

      {transactions.isLoading ? (
        <View style={{ gap: 10 }}>
          <Skeleton style={{ height: 52 }} />
          <Skeleton style={{ height: 52 }} />
        </View>
      ) : txItems.length === 0 ? (
        <EmptyState title="Історія порожня" message="Тут з'являться ваші покупки, перекази та подарунки." />
      ) : (
        <FlatList
          data={txItems}
          keyExtractor={(item) => item.id}
          onEndReached={() => transactions.hasNextPage && transactions.fetchNextPage()}
          renderItem={({ item }) => {
            const amount = Number(item.amount);
            return (
              <View style={styles.txRow}>
                <Text style={styles.txLabel}>{TX_TYPE_LABELS[item.type] ?? item.type}</Text>
                <Text style={[styles.txAmount, amount >= 0 ? styles.txPositive : styles.txNegative]}>
                  {amount >= 0 ? '+' : ''}
                  {amount.toLocaleString('uk-UA')}
                </Text>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.stone, padding: spacing.xl },
  balanceCard: {
    backgroundColor: colors.chornozem,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  balanceLabel: { color: colors.textSecondaryDark, fontSize: 13, marginBottom: 6 },
  balanceValue: { color: colors.wheat, fontSize: 36, fontWeight: '800' },
  lockedNotice: { color: colors.error, fontSize: 12, marginTop: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 10 },
  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  txLabel: { fontSize: 14, color: colors.textPrimary },
  txAmount: { fontSize: 14, fontWeight: '700' },
  txPositive: { color: colors.success },
  txNegative: { color: colors.error },
});
