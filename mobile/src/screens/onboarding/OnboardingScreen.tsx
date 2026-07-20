import React, { useRef, useState } from 'react';
import { Dimensions, NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Button } from '../../components/Button';
import { colors, spacing } from '../../theme/tokens';

const { width } = Dimensions.get('window');

const SLIDES = [
  { title: 'Одна стрічка. Один месенджер. Одне коло.', body: 'Спілкування та стрічка — в одному застосунку.' },
  { title: 'Шифрування за замовчуванням', body: 'Приватні повідомлення захищені наскрізним шифруванням.' },
  { title: 'Ваш простір, ваші правила', body: 'Тонке налаштування приватності для кожного поста.' },
];

export function OnboardingScreen({ onDone }: { onDone: () => void }) {
  const [index, setIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  function handleScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
    if (newIndex !== index) setIndex(newIndex);
  }

  function next() {
    if (index < SLIDES.length - 1) {
      scrollRef.current?.scrollTo({ x: (index + 1) * width, animated: true });
    } else {
      onDone();
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {SLIDES.map((slide, i) => (
          <View key={i} style={[styles.slide, { width }]}>
            <View style={styles.illustration} />
            <Text style={styles.title}>{slide.title}</Text>
            <Text style={styles.body}>{slide.body}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <Dot key={i} active={i === index} />
          ))}
        </View>
        <Button label={index === SLIDES.length - 1 ? 'Розпочати' : 'Далі'} onPress={next} />
      </View>
    </View>
  );
}

function Dot({ active }: { active: boolean }) {
  const widthValue = useSharedValue(active ? 22 : 6);
  widthValue.value = withTiming(active ? 22 : 6, { duration: 180 });
  const style = useAnimatedStyle(() => ({ width: widthValue.value }));
  return <Animated.View style={[styles.dot, style, active && { backgroundColor: colors.wheat }]} />;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.stone },
  slide: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xxl },
  illustration: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: colors.wheatSoft,
    marginBottom: spacing.xxl,
  },
  title: { fontSize: 24, fontWeight: '700', color: colors.chornozem, textAlign: 'center', marginBottom: 10 },
  body: { fontSize: 15, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  footer: { paddingHorizontal: spacing.xxl, paddingBottom: spacing.xxxl, gap: spacing.xl },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { height: 6, borderRadius: 3, backgroundColor: colors.border },
});
