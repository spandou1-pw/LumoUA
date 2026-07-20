import React from 'react';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useFeed, useLikePost, Post } from '../../api/hooks/useFeed';
import { PostCardSkeleton } from '../../components/Skeleton';
import { ErrorState, EmptyState } from '../../components/StateViews';
import { Avatar } from '../../components/Avatar';
import { colors, spacing } from '../../theme/tokens';
import { ApiError } from '../../api/client';

export function FeedScreen() {
  const { data, isLoading, isError, error, refetch, isRefetching, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useFeed('following');
  const like = useLikePost();

  const posts = data?.pages.flatMap((p) => p.items) ?? [];

  // --- Loading state ---
  if (isLoading) {
    return (
      <View style={styles.screen}>
        {[1, 2, 3].map((i) => (
          <PostCardSkeleton key={i} />
        ))}
      </View>
    );
  }

  // --- Error state ---
  if (isError) {
    return (
      <View style={styles.screen}>
        <ErrorState
          message={error instanceof ApiError ? error.message : 'Не вдалося завантажити стрічку.'}
          onRetry={() => refetch()}
        />
      </View>
    );
  }

  // --- Empty state ---
  if (posts.length === 0) {
    return (
      <View style={styles.screen}>
        <EmptyState
          title="Тут поки що порожньо"
          message="Підпишіться на когось, щоб побачити пости у своїй стрічці."
          actionLabel="Знайти людей"
          onAction={() => {}}
        />
      </View>
    );
  }

  return (
    <FlashList
      data={posts}
      keyExtractor={(item) => item.id}
      estimatedItemSize={180}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.wheat} />}
      onEndReached={() => hasNextPage && fetchNextPage()}
      onEndReachedThreshold={0.5}
      renderItem={({ item }) => <PostCard post={item} onLike={() => like.mutate(item.id)} />}
      ListFooterComponent={isFetchingNextPage ? <PostCardSkeleton /> : null}
    />
  );
}

function PostCard({ post, onLike }: { post: Post; onLike: () => void }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Avatar size="sm" initials="ІК" />
        <View style={{ marginLeft: 10 }}>
          <Text style={styles.author}>Автор</Text>
          <Text style={styles.meta}>{new Date(post.createdAt).toLocaleDateString('uk-UA')}</Text>
        </View>
      </View>
      {post.body && <Text style={styles.body}>{post.body}</Text>}
      <View style={styles.engagementRow}>
        <Text
          style={[styles.engagementItem, post.viewerHasLiked && styles.liked]}
          onPress={onLike}
          accessibilityRole="button"
          accessibilityLabel={post.viewerHasLiked ? 'Прибрати вподобання' : 'Вподобати'}
        >
          {post.viewerHasLiked ? '♥' : '♡'} {post.likeCount}
        </Text>
        <Text style={styles.engagementItem}>💬 {post.commentCount}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.stone, paddingTop: spacing.md },
  card: { backgroundColor: colors.white, padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  author: { fontWeight: '700', fontSize: 14, color: colors.textPrimary },
  meta: { fontSize: 12, color: colors.textSecondary },
  body: { fontSize: 15, lineHeight: 21, color: colors.textPrimary, marginBottom: 12 },
  engagementRow: { flexDirection: 'row', gap: 20 },
  engagementItem: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
  liked: { color: colors.error },
});
