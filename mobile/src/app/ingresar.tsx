import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Banner, GradientButton, Logo, Screen, TextField } from '../components/ui';
import { ApiError } from '../lib/api';
import { resetTo } from '../lib/navigation';
import { useSession } from '../lib/session';
import { colors, spacing } from '../theme';

export default function Ingresar() {
  const { login } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    if (!email.trim() || !password) {
      setError('Escribe tu correo y tu contraseña.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await login(email.trim().toLowerCase(), password);
      resetTo('/inicio');
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 400)) {
        setError('Correo o contraseña incorrectos.');
      } else {
        setError(err instanceof Error ? err.message : 'Ocurrió un error inesperado.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <Pressable
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/bienvenida'))}
        style={styles.back}
        accessibilityLabel="Volver"
        hitSlop={10}
      >
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </Pressable>

      <Logo size={30} />
      <Text style={styles.title}>Hola de nuevo</Text>
      <Text style={styles.subtitle}>Ingresa para ver lo que tus vecinos están ofreciendo.</Text>

      <View style={styles.form}>
        {error && <Banner tone="danger">{error}</Banner>}
        <TextField
          label="Correo electrónico"
          icon="mail-outline"
          placeholder="tucorreo@ejemplo.com"
          value={email}
          onChangeText={(t) => {
            setEmail(t);
            setError(null);
          }}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          testID="login-correo"
        />
        <TextField
          label="Contraseña"
          icon="lock-closed-outline"
          placeholder="Tu contraseña"
          value={password}
          onChangeText={(t) => {
            setPassword(t);
            setError(null);
          }}
          secure
          autoCapitalize="none"
          autoComplete="current-password"
          onSubmitEditing={onSubmit}
          testID="login-clave"
        />
      </View>

      <View style={{ flex: 1, minHeight: spacing.xl }} />

      <GradientButton label="Ingresar" onPress={onSubmit} loading={submitting} testID="btn-ingresar" />

      <View style={styles.footer}>
        <Text style={styles.footerText}>¿Eres nuevo? </Text>
        <Pressable onPress={() => router.replace('/registro')}>
          <Text style={styles.link}>Crea tu cuenta</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { marginBottom: spacing.lg, alignSelf: 'flex-start' },
  title: { fontSize: 28, fontWeight: '800', color: colors.text, marginTop: spacing.xl },
  subtitle: { fontSize: 15, color: colors.textMuted, marginTop: 6, lineHeight: 22 },
  form: { gap: spacing.lg, marginTop: spacing.xl },
  link: { color: colors.primary, fontWeight: '700', fontSize: 14 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.lg },
  footerText: { color: colors.textMuted, fontSize: 14 },
});
