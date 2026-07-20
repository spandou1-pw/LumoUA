import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useNotifications, NotificationItem } from '../../api/hooks/useGrowthFeatures';
import { ErrorState, EmptyState } from '../../components/StateViews';
import { PostCardSkeleton } from '../../components/Skeleton';
import { colors, spacing } from '../../theme/tokens';
import { ApiError } from '../../api/client';

export function NotificationsScreen() {
  const { data, isLoading, isError, error, refetch, fetchNextPage, hasNextPage } = useNotifications();
  const items = data?.pages.flatMap((p) => p.items) ?? [];

  if (isLoading) {
    return (
      <View style={styles.screen}>
        <PostCardSkeleton />
        <PostCardSkeleton />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.screen}>
        <ErrorState
          message={error instanceof ApiError ? error.message : 'Не вдалося завантажити сповіщення.'}
          onRetry={() => refetch()}
        />
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.screen}>
        <EmptyState title="Тут порожньо" message="Сповіщення про лайки, коментарі та подарунки з'являться тут." />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.screen}
      data={items}
      keyExtractor={(item) => item.id}
      onEndReached={() => hasNextPage && fetchNextPage()}
      renderItem={({ item }) => <NotificationRow item={item} />}
    />
  );
}

function NotificationRow({ item }: { item: NotificationItem }) {
  return (
    <View style={[styles.row, !item.readAt && styles.rowUnread]}>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.body}>{item.body}</Text>
      <Text style={styles.time}>{new Date(item.createdAt).toLocaleString('uk-UA')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.stone },
  row: { padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.white },
  rowUnread: { backgroundColor: colors.wheatSoft },
  title: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  body: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  time: { fontSize: 11, color: colors.textSecondary, marginTop: 6 },
});
