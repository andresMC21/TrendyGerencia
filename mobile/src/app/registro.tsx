import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Banner, GradientButton, Screen, TextField } from '../components/ui';
import { ApiError } from '../lib/api';
import { resetTo } from '../lib/navigation';
import { useSession } from '../lib/session';
import {
  mapServerValidation,
  validateRegister,
  type RegisterErrors,
} from '../lib/validation';
import { colors, spacing } from '../theme';

/** HU-01 · Crear una cuenta. */
export default function Registro() {
  const { register } = useSession();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [emailTaken, setEmailTaken] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const clear = (field: keyof RegisterErrors) => {
    setErrors((e) => ({ ...e, [field]: undefined }));
    setFormError(null);
    if (field === 'email') setEmailTaken(false);
  };

  const onSubmit = async () => {
    const values = { fullName, email, password };
    const localErrors = validateRegister(values);
    setErrors(localErrors);
    setFormError(null);
    setEmailTaken(false);
    if (Object.keys(localErrors).length > 0) return;

    setSubmitting(true);
    try {
      await register({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
      });
      resetTo('/inicio');
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setEmailTaken(true);
        setErrors({ email: 'Este correo ya tiene una cuenta en Trendy.' });
      } else if (err instanceof ApiError && err.status === 400) {
        const mapped = mapServerValidation(err.messages);
        setErrors(mapped);
        if (Object.keys(mapped).length === 0) setFormError('Revisa los datos e inténtalo de nuevo.');
      } else {
        setFormError(err instanceof Error ? err.message : 'Ocurrió un error inesperado.');
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

      <Text style={styles.title}>Crea tu cuenta</Text>
      <Text style={styles.subtitle}>
        Publica, compra e intercambia con tus vecinos de forma segura.
      </Text>

      <View style={styles.form}>
        {formError && <Banner tone="danger">{formError}</Banner>}

        <TextField
          label="Nombre completo"
          icon="person-outline"
          placeholder="María Camila Pérez"
          value={fullName}
          onChangeText={(t) => {
            setFullName(t);
            clear('fullName');
          }}
          autoComplete="name"
          textContentType="name"
          error={errors.fullName}
          testID="input-nombre"
        />
        <TextField
          label="Correo electrónico"
          icon="mail-outline"
          placeholder="tucorreo@ejemplo.com"
          value={email}
          onChangeText={(t) => {
            setEmail(t);
            clear('email');
          }}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          error={errors.email}
          testID="input-correo"
        />
        {emailTaken && (
          <Pressable onPress={() => router.replace('/ingresar')}>
            <Text style={styles.link}>¿Es tuyo? Inicia sesión aquí</Text>
          </Pressable>
        )}
        <TextField
          label="Contraseña"
          icon="lock-closed-outline"
          placeholder="Entre 8 y 12 caracteres"
          value={password}
          onChangeText={(t) => {
            setPassword(t);
            clear('password');
          }}
          secure
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
          maxLength={12}
          hint={`${password.length}/12 caracteres · mínimo 8`}
          error={errors.password}
          onSubmitEditing={onSubmit}
          testID="input-clave"
        />
      </View>

      <View style={styles.safety}>
        <Ionicons name="shield-checkmark-outline" size={18} color={colors.success} />
        <Text style={styles.safetyText}>
          Tu cuenta empieza como usuario sin verificar. Luego podrás verificar tu identidad para
          generar más confianza.
        </Text>
      </View>

      <View style={{ flex: 1, minHeight: spacing.xl }} />

      <GradientButton
        label="Crear cuenta"
        onPress={onSubmit}
        loading={submitting}
        testID="btn-crear-cuenta"
      />

      <View style={styles.footer}>
        <Text style={styles.footerText}>¿Ya tienes cuenta? </Text>
        <Pressable onPress={() => router.replace('/ingresar')}>
          <Text style={styles.link}>Inicia sesión</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { marginBottom: spacing.lg, alignSelf: 'flex-start' },
  title: { fontSize: 28, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 15, color: colors.textMuted, marginTop: 6, lineHeight: 22 },
  form: { gap: spacing.lg, marginTop: spacing.xl },
  link: { color: colors.primary, fontWeight: '700', fontSize: 14 },
  safety: {
    flexDirection: 'row',
    gap: 8,
    marginTop: spacing.xl,
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.successSoft,
  },
  safetyText: { flex: 1, color: colors.success, fontSize: 13, lineHeight: 19 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  footerText: { color: colors.textMuted, fontSize: 14 },
});
