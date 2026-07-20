import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button } from '../../components/Button';
import { colors, spacing, typography } from '../../theme/tokens';
import { useLogin } from '../../api/hooks/useAuth';
import { ApiError } from '../../api/client';

const ERROR_MESSAGES: Record<string, string> = {
  INVALID_CREDENTIALS: 'Невірна пошта або пароль.',
  ACCOUNT_NOT_ACTIVE: 'Обліковий запис призупинено. Зверніться до підтримки.',
};

export function LoginScreen({ onNavigateRegister }: { onNavigateRegister: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const login = useLogin();

  async function handleSubmit() {
    setErrorMessage(null);
    try {
      await login.mutateAsync({ email, password });
    } catch (err) {
      // doc 08 flow 1: specific, non-generic error messaging — never a
      // vague "something went wrong" for a case we can name precisely.
      if (err instanceof ApiError) {
        setErrorMessage(ERROR_MESSAGES[err.code] ?? 'Не вдалося увійти. Спробуйте ще раз.');
      } else {
        setErrorMessage('Перевірте з’єднання з інтернетом.');
      }
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <Text style={styles.wordmark}>Lumo</Text>
      <Text style={styles.title}>З поверненням</Text>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Пошта"
          placeholderTextColor={colors.textSecondary}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          accessibilityLabel="Пошта"
        />
        <TextInput
          style={styles.input}
          placeholder="Пароль"
          placeholderTextColor={colors.textSecondary}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          accessibilityLabel="Пароль"
        />
      </View>

      {errorMessage && (
        <Text style={styles.error} accessibilityRole="alert">
          {errorMessage}
        </Text>
      )}

      <Button
        label="Увійти"
        onPress={handleSubmit}
        loading={login.isPending}
        disabled={!email || !password}
      />

      <Text style={styles.footerText} onPress={onNavigateRegister}>
        Немає акаунту? <Text style={styles.link}>Зареєструватися</Text>
      </Text>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.stone, paddingHorizontal: spacing.xxl, paddingTop: 64 },
  wordmark: { ...typography.display, fontSize: 24, color: colors.chornozem, marginBottom: 6 },
  title: { ...typography.display, fontSize: 22, color: colors.chornozem, marginBottom: 28 },
  form: { gap: spacing.md, marginBottom: 20 },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 14,
    fontSize: 15,
    color: colors.textPrimary,
    backgroundColor: colors.white,
  },
  error: { color: colors.error, fontSize: 13, marginBottom: 16 },
  footerText: { textAlign: 'center', marginTop: 24, color: colors.textSecondary, fontSize: 13.5 },
  link: { color: colors.chicory, fontWeight: '700' },
});
