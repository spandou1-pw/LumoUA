import React, { useEffect } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { colors, radius } from '../theme/tokens';

/**
 * doc 11: skeletons used for feed/chat-list loading where content shape is
 * predictable — spinners reserved for indeterminate actions only (doc 16).
 */
export function Skeleton({ style }: { style?: ViewStyle }) {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.9, { duration: 800, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return <Animated.View style={[styles.base, style, animatedStyle]} />;
}

export function PostCardSkeleton() {
  return (
    <View style={styles.postCard}>
      <View style={styles.row}>
        <Skeleton style={{ width: 32, height: 32, borderRadius: 16 }} />
        <View style={{ marginLeft: 10, flex: 1 }}>
          <Skeleton style={{ width: '40%', height: 12, marginBottom: 6 }} />
          <Skeleton style={{ width: '25%', height: 10 }} />
        </View>
      </View>
      <Skeleton style={{ width: '90%', height: 14, marginTop: 12 }} />
      <Skeleton style={{ width: '60%', height: 14, marginTop: 6 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  base: { backgroundColor: colors.border, borderRadius: radius.small },
  postCard: { padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  row: { flexDirection: 'row', alignItems: 'center' },
});
