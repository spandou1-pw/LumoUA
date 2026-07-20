import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useConversations, Conversation } from '../../api/hooks/useGrowthFeatures';
import { Avatar } from '../../components/Avatar';
import { ErrorState, EmptyState } from '../../components/StateViews';
import { PostCardSkeleton } from '../../components/Skeleton';
import { colors, spacing } from '../../theme/tokens';
import { ApiError } from '../../api/client';

/**
 * doc LAUNCH_READINESS.md: this screen shows real conversation metadata
 * (who, when, how many unread) from the backend. It cannot show message
 * *content* — that's end-to-end encrypted and this app has no Signal
 * Protocol client implementation yet. Each row is honest about that
 * rather than showing a fake message preview.
 */
export function ConversationsScreen() {
  const { data, isLoading, isError, error, refetch } = useConversations();
  const items = data?.items ?? [];

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
          message={error instanceof ApiError ? error.message : 'Не вдалося завантажити розмови.'}
          onRetry={() => refetch()}
        />
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.screen}>
        <EmptyState title="Немає розмов" message="Почніть розмову з профілю користувача." />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.screen}
      data={items}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <ConversationRow item={item} />}
    />
  );
}

function ConversationRow({ item }: { item: Conversation }) {
  return (
    <View style={styles.row}>
      <Avatar size="md" initials="??" />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.title}>{item.participantIds.length} учасник(и)</Text>
        <Text style={styles.preview}>
          {item.lastMessageAt ? `Востаннє: ${new Date(item.lastMessageAt).toLocaleString('uk-UA')}` : 'Немає повідомлень'}
        </Text>
      </View>
      {item.unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{item.unreadCount}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.stone },
  row: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.white },
  title: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  preview: { fontSize: 12.5, color: colors.textSecondary, marginTop: 2 },
  badge: { backgroundColor: colors.error, borderRadius: 999, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  badgeText: { color: colors.white, fontSize: 11, fontWeight: '700' },
});
