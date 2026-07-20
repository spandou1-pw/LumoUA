import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Avatar } from '../../components/Avatar';
import { Button } from '../../components/Button';
import { colors, spacing } from '../../theme/tokens';

/**
 * doc API_PLATFORM.md: Calls (WebRTC signaling) is listed as "Not started"
 * on the backend — there is no `/calls` endpoint, no signaling gateway,
 * nothing for this screen to connect to. Building a UI that *looks*
 * functional here would be actively misleading (a call button that does
 * nothing when tapped, in an app that otherwise works, reads as a bug, not
 * an intentional limitation). This screen is an honest placeholder: it
 * shows what the call UI will look like and says plainly that calling
 * isn't live yet, rather than pretending to place a call.
 */
export function CallScreenPlaceholder({ calleeName }: { calleeName: string }) {
  return (
    <View style={styles.container}>
      <Avatar size="xl" initials={calleeName.slice(0, 2).toUpperCase()} />
      <Text style={styles.name}>{calleeName}</Text>
      <Text style={styles.notice}>
        Дзвінки ще не доступні — бекенд для WebRTC-сигналізації (doc CALLS, Stage 11+) ще не реалізовано.
      </Text>
      <Button label="Закрити" variant="secondary" onPress={() => {}} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.night,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    padding: spacing.xxl,
  },
  name: { color: colors.textPrimaryDark, fontSize: 20, fontWeight: '700' },
  notice: { color: colors.textSecondaryDark, fontSize: 13.5, textAlign: 'center', lineHeight: 20 },
});
