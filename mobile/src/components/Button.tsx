import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { colors, motion, radius, typography } from '../theme/tokens';

type Variant = 'primary' | 'secondary' | 'tertiary' | 'destructive';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
}

const SIZE_HEIGHT: Record<Size, number> = { sm: 32, md: 44, lg: 52 };
const SIZE_FONT: Record<Size, number> = { sm: 13, md: 15, lg: 16 };

/**
 * doc 11: no fixed width — sized to content + padding (Ukrainian labels
 * run ~15-20% longer than English, doc 13's localization note).
 * doc 16: press feedback via `motion.instant` scale, not a color-only cue.
 */
export function Button({ label, onPress, variant = 'primary', size = 'md', disabled, loading }: ButtonProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const isDisabled = disabled || loading;

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        onPressIn={() => (scale.value = withTiming(0.97, { duration: motion.instant }))}
        onPressOut={() => (scale.value = withTiming(1, { duration: motion.instant }))}
        style={[
          styles.base,
          { height: SIZE_HEIGHT[size] },
          variantStyle(variant, isDisabled),
          isDisabled && styles.disabled,
        ]}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: isDisabled, busy: loading }}
      >
        {loading ? (
          <ActivityIndicator color={variant === 'primary' ? colors.chornozem : colors.wheat} />
        ) : (
          <Text style={[styles.label, { fontSize: SIZE_FONT[size] }, textColorStyle(variant, isDisabled)]}>
            {label}
          </Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

function variantStyle(variant: Variant, disabled?: boolean) {
  if (disabled) return { backgroundColor: colors.border };
  switch (variant) {
    case 'primary':
      return { backgroundColor: colors.wheat };
    case 'secondary':
      return { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.chicory };
    case 'tertiary':
      return { backgroundColor: 'transparent' };
    case 'destructive':
      return { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.error };
  }
}

function textColorStyle(variant: Variant, disabled?: boolean) {
  if (disabled) return { color: colors.textSecondary };
  switch (variant) {
    case 'primary':
      return { color: colors.chornozem };
    case 'secondary':
      return { color: colors.chicory };
    case 'tertiary':
      return { color: colors.chicory };
    case 'destructive':
      return { color: colors.error };
  }
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.small,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  disabled: {},
  label: { ...typography.body, fontWeight: '600' },
});
