import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLogout } from '../../api/hooks/useAuth';
import { colors, spacing } from '../../theme/tokens';

const SECTIONS: { title: string; rows: string[] }[] = [
  { title: 'Акаунт', rows: ['Обліковий запис', 'Приватність', 'Сповіщення'] },
  { title: 'Дані та безпека', rows: ['Пристрої та сесії', 'Мова — Українська'] },
  { title: 'Premium', rows: ['Керування підпискою', 'Історія платежів'] },
];

export function SettingsScreen() {
  const logout = useLogout();

  return (
    <ScrollView style={styles.screen}>
      {SECTIONS.map((section) => (
        <View key={section.title}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          {section.rows.map((row) => (
            <View key={row} style={styles.row}>
              <Text style={styles.rowLabel}>{row}</Text>
              <Text style={styles.chevron}>›</Text>
            </View>
          ))}
        </View>
      ))}

      <Text
        style={styles.logout}
        onPress={() => logout.mutate()}
        accessibilityRole="button"
        accessibilityLabel="Вийти з облікового запису"
      >
        {logout.isPending ? 'Виходимо...' : 'Вийти'}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.stone },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
  },
  rowLabel: { fontSize: 14.5, color: colors.textPrimary },
  chevron: { color: colors.textSecondary, fontSize: 18 },
  logout: {
    textAlign: 'center',
    color: colors.error,
    fontWeight: '700',
    fontSize: 14,
    padding: spacing.xl,
    marginTop: spacing.xl,
  },
});
