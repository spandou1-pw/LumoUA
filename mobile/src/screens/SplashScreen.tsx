import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '../theme/tokens';
import { api } from '../api/client';
import { useAuthStore } from '../store/authStore';

/**
 * doc 16 Splash: the ring rotates continuously while the app checks for a
 * valid session (SecureStore refresh token) — a real loading state doing
 * real work, not a fixed-duration decorative delay.
 */
export function SplashScreen() {
  const rotation = useSharedValue(0);
  const setUnauthenticated = useAuthStore((s) => s.setUnauthenticated);
  const setAuthenticated = useAuthStore((s) => s.setAuthenticated);

  useEffect(() => {
    rotation.value = withRepeat(withTiming(360, { duration: 1400, easing: Easing.linear }), -1, false);
  }, []);

  useEffect(() => {
    checkSession();
  }, []);

  async function checkSession() {
    // doc 17: the access token itself isn't persisted, but a valid refresh
    // token means apiRequest's built-in 401->refresh flow will silently
    // re-establish a session on the first authenticated call this session
    // makes. A lightweight GET /users/me here both verifies that refresh
    // path works and hydrates the store in one round trip.
    try {
      const me = await api.get<{ id: string; username: string }>('/users/me');
      setAuthenticated(me.id, me.username);
    } catch {
      setUnauthenticated();
    }
  }

  const ringStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotation.value}deg` }] }));

  return (
    <View style={styles.container}>
      <Animated.View style={ringStyle}>
        <Svg width={88} height={88} viewBox="0 0 88 88">
          <Circle
            cx={44}
            cy={44}
            r={36}
            fill="none"
            stroke={colors.wheat}
            strokeWidth={5}
            strokeDasharray="180 226"
            strokeLinecap="round"
          />
        </Svg>
      </Animated.View>
      <Text style={styles.wordmark}>Lumo</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.night, alignItems: 'center', justifyContent: 'center', gap: 18 },
  wordmark: { color: colors.textPrimaryDark, fontSize: 28, fontWeight: '800' },
});
