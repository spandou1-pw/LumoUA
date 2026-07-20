import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from './Button';
import { colors, typography } from '../theme/tokens';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

/**
 * doc 08: every error state gives the user a specific, actionable next
 * step — never a dead end. `onRetry` is optional only for errors where
 * retrying genuinely can't help (e.g. a 403 the user can't resolve
 * themselves); when omitted, the message itself must explain what to do.
 */
export function ErrorState({ title = 'Щось пішло не так', message, onRetry }: ErrorStateProps) {
  return (
    <View style={styles.container} accessibilityRole="alert">
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry && <Button label="Спробувати ще раз" variant="secondary" size="sm" onPress={onRetry} />}
    </View>
  );
}

interface EmptyStateProps {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ title, message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction && <Button label={actionLabel} variant="primary" size="sm" onPress={onAction} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  title: { ...typography.display, fontSize: 18, color: colors.textPrimary, textAlign: 'center' },
  message: { ...typography.body, fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginBottom: 4 },
});
