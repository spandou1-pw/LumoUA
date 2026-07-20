import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { colors } from '../theme/tokens';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
const SIZES: Record<AvatarSize, number> = { xs: 24, sm: 32, md: 40, lg: 64, xl: 96 };

interface AvatarProps {
  size?: AvatarSize;
  uri?: string | null;
  initials: string;
}

export function Avatar({ size = 'md', uri, initials }: AvatarProps) {
  const dimension = SIZES[size];
  return (
    <View style={[styles.avatar, { width: dimension, height: dimension, borderRadius: dimension / 2 }]}>
      {uri ? (
        <Image source={{ uri }} style={{ width: dimension, height: dimension, borderRadius: dimension / 2 }} />
      ) : (
        <Text style={[styles.initials, { fontSize: dimension * 0.35 }]}>{initials}</Text>
      )}
    </View>
  );
}

type RingState = 'none' | 'unseen' | 'seen' | 'live';

interface StoryRingProps {
  size?: AvatarSize;
  uri?: string | null;
  initials: string;
  state: RingState;
}

/**
 * doc 10 signature element: the ring motif. `live` gets a continuous pulse
 * (doc 16 `motion.ambient`, 1200ms) — the one place in the avatar family
 * that spends the system's "boldness" budget on an ambient animation,
 * matching the design system's restraint everywhere else.
 */
export function StoryRing({ size = 'md', uri, initials, state }: StoryRingProps) {
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (state === 'live') {
      pulse.value = withRepeat(withTiming(1.15, { duration: 1200, easing: Easing.inOut(Easing.ease) }), -1, true);
    }
  }, [state]);

  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  if (state === 'none') return <Avatar size={size} uri={uri} initials={initials} />;

  const ringColor = state === 'unseen' ? colors.wheat : state === 'live' ? colors.error : colors.chicorySoft;

  return (
    <Animated.View
      style={[
        styles.ringWrap,
        { borderColor: ringColor, borderWidth: state === 'seen' ? 2 : 2.5 },
        state === 'live' && pulseStyle,
      ]}
    >
      <Avatar size={size} uri={uri} initials={initials} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: colors.chicory,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  initials: { color: colors.white, fontWeight: '700' },
  ringWrap: { borderRadius: 999, padding: 2 },
});
