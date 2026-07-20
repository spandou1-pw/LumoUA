import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useMe } from '../../api/hooks/useProfile';
import { useProfileCustomization } from '../../api/hooks/useProfile';
import { Avatar } from '../../components/Avatar';
import { Skeleton } from '../../components/Skeleton';
import { ErrorState } from '../../components/StateViews';
import { colors, spacing } from '../../theme/tokens';
import { ApiError } from '../../api/client';

export function ProfileScreen() {
  const me = useMe();
  const customization = useProfileCustomization(me.data?.id);

  if (me.isLoading) {
    return (
      <View style={styles.screen}>
        <Skeleton style={{ width: 96, height: 96, borderRadius: 48, alignSelf: 'center', marginTop: 40 }} />
        <Skeleton style={{ width: 160, height: 20, alignSelf: 'center', marginTop: 16 }} />
      </View>
    );
  }

  if (me.isError || !me.data) {
    return (
      <View style={styles.screen}>
        <ErrorState
          message={me.error instanceof ApiError ? me.error.message : 'Не вдалося завантажити профіль.'}
          onRetry={() => me.refetch()}
        />
      </View>
    );
  }

  const isPremium = customization.data?.isPremium ?? false;
  const status = customization.data?.status;

  return (
    <ScrollView style={styles.screen}>
      <View style={styles.header}>
        <Avatar size="xl" uri={me.data.avatarUrl} initials={me.data.displayName.slice(0, 2).toUpperCase()} />
        <View style={styles.nameRow}>
          <Text style={styles.displayName}>{me.data.displayName}</Text>
          {isPremium && <Text style={styles.premiumBadge}>✦</Text>}
        </View>
        <Text style={styles.username}>@{me.data.username}</Text>

        {status?.text && (
          <Text style={styles.status}>
            {status.emoji ? `${status.emoji} ` : ''}
            {status.text}
          </Text>
        )}

        {me.data.bio && <Text style={styles.bio}>{me.data.bio}</Text>}
      </View>

      {!isPremium && (
        <View style={styles.upsell}>
          <Text style={styles.upsellTitle}>Спробуйте Premium</Text>
          <Text style={styles.upsellBody}>Анімовані бейджі, рамки, банери та більше лімітів.</Text>
        </View>
      )}

      {customization.data && (
        <View style={styles.showcaseSection}>
          <Text style={styles.sectionTitle}>Досягнення</Text>
          {customization.data.showcases.achievements.length === 0 ? (
            <Text style={styles.emptyShowcase}>Ще немає показаних досягнень</Text>
          ) : (
            <Text style={styles.emptyShowcase}>{customization.data.showcases.achievements.length} показано</Text>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.stone },
  header: { alignItems: 'center', padding: spacing.xxl },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  displayName: { fontSize: 19, fontWeight: '800', color: colors.chornozem },
  premiumBadge: { color: colors.wheat, fontSize: 16 },
  username: { fontSize: 12.5, color: colors.textSecondary, marginTop: 2 },
  status: { fontSize: 13.5, color: colors.chicory, marginTop: 10, fontWeight: '600' },
  bio: { fontSize: 14, color: colors.textPrimary, textAlign: 'center', marginTop: 12, lineHeight: 20 },
  upsell: {
    marginHorizontal: spacing.xl,
    backgroundColor: colors.wheatSoft,
    borderRadius: 16,
    padding: 16,
    marginBottom: spacing.xl,
  },
  upsellTitle: { fontWeight: '700', fontSize: 14, color: colors.chornozem, marginBottom: 4 },
  upsellBody: { fontSize: 12.5, color: colors.textSecondary },
  showcaseSection: { paddingHorizontal: spacing.xl, marginBottom: spacing.xl },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginBottom: 8 },
  emptyShowcase: { fontSize: 12.5, color: colors.textSecondary },
});
