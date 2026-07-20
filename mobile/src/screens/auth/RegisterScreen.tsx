import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button } from '../../components/Button';
import { colors, spacing, typography } from '../../theme/tokens';
import { useRegister, useVerifyEmail, useResendVerification } from '../../api/hooks/useAuth';
import { ApiError } from '../../api/client';

type Step = 'credentials' | 'verify';

const ERROR_MESSAGES: Record<string, string> = {
  EMAIL_ALREADY_REGISTERED: 'Акаунт із такою поштою вже існує.',
  CODE_EXPIRED_OR_INVALID: 'Код недійсний або застарів. Спробуйте ще раз.',
};

export function RegisterScreen({ onVerified }: { onVerified: () => void }) {
  const [step, setStep] = useState<Step>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const register = useRegister();
  const verify = useVerifyEmail();
  const resend = useResendVerification();

  async function handleRegister() {
    setError(null);
    try {
      await register.mutateAsync({ email, password });
      setStep('verify');
    } catch (err) {
      setError(err instanceof ApiError ? (ERROR_MESSAGES[err.code] ?? err.message) : 'Перевірте з’єднання.');
    }
  }

  async function handleVerify() {
    setError(null);
    try {
      await verify.mutateAsync({ email, code });
      onVerified();
    } catch (err) {
      setError(err instanceof ApiError ? (ERROR_MESSAGES[err.code] ?? err.message) : 'Перевірте з’єднання.');
    }
  }

  if (step === 'verify') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Підтвердіть пошту</Text>
        <Text style={styles.subtitle}>Ми надіслали код на {email}</Text>
        <TextInput
          style={styles.codeInput}
          value={code}
          onChangeText={setCode}
          keyboardType="number-pad"
          maxLength={6}
          placeholder="000000"
          accessibilityLabel="Код підтвердження"
        />
        {error && <Text style={styles.error}>{error}</Text>}
        <Button label="Підтвердити" onPress={handleVerify} loading={verify.isPending} disabled={code.length !== 6} />
        <Text style={styles.resend} onPress={() => resend.mutate(email)}>
          {resend.isPending ? 'Надсилаємо...' : 'Надіслати код ще раз'}
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <Text style={styles.title}>Створити акаунт</Text>
      <Text style={styles.subtitle}>Крок 1 з 3 — обліковий запис</Text>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Пошта"
          placeholderTextColor={colors.textSecondary}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Пароль (мін. 8 символів)"
          placeholderTextColor={colors.textSecondary}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <Button
        label="Продовжити"
        onPress={handleRegister}
        loading={register.isPending}
        disabled={!email || password.length < 8}
      />

      <View style={styles.progressRow}>
        <View style={[styles.progressBar, styles.progressActive]} />
        <View style={styles.progressBar} />
        <View style={styles.progressBar} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.stone, paddingHorizontal: spacing.xxl, paddingTop: 64 },
  title: { ...typography.display, fontSize: 22, color: colors.chornozem, marginBottom: 6 },
  subtitle: { fontSize: 13.5, color: colors.textSecondary, marginBottom: 28 },
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
  codeInput: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 14,
    fontSize: 24,
    letterSpacing: 8,
    textAlign: 'center',
    color: colors.textPrimary,
    backgroundColor: colors.white,
    marginBottom: 20,
  },
  error: { color: colors.error, fontSize: 13, marginBottom: 16 },
  resend: { textAlign: 'center', marginTop: 20, color: colors.chicory, fontSize: 13.5, fontWeight: '600' },
  progressRow: { flexDirection: 'row', gap: 6, marginTop: 32 },
  progressBar: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.border },
  progressActive: { backgroundColor: colors.wheat },
});
