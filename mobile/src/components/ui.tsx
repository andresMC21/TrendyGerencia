import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, shadow, spacing } from '../theme';

/** Contenedor de pantalla: área segura, scroll y teclado. Ancho máximo de celular en web. */
export function Screen({ children, scroll = true }: { children: ReactNode; scroll?: boolean }) {
  const content = <View style={styles.screenInner}>{children}</View>;
  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {scroll ? (
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {content}
          </ScrollView>
        ) : (
          content
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function Logo({ size = 26 }: { size?: number }) {
  return (
    <View style={styles.logoRow}>
      <MaterialCommunityIcons name="hanger" size={size + 4} color={colors.primary} />
      <Text style={[styles.logoText, { fontSize: size }]}>Trendy</Text>
    </View>
  );
}

export function GradientButton({
  label,
  onPress,
  loading,
  icon,
  testID,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  testID?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      accessibilityRole="button"
      testID={testID}
      style={({ pressed }) => [{ opacity: pressed || loading ? 0.85 : 1 }]}
    >
      <LinearGradient
        colors={colors.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradientButton}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            {icon && <Ionicons name={icon} size={20} color="#fff" />}
            <Text style={styles.gradientLabel}>{label}</Text>
          </>
        )}
      </LinearGradient>
    </Pressable>
  );
}

export function OutlineButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.outlineButton, pressed && { backgroundColor: colors.primarySoft }]}
    >
      <Text style={styles.outlineLabel}>{label}</Text>
    </Pressable>
  );
}

export function TextField({
  label,
  error,
  icon,
  secure,
  hint,
  ...props
}: TextInputProps & {
  label: string;
  error?: string;
  hint?: string;
  icon: keyof typeof Ionicons.glyphMap;
  secure?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(true);
  const borderColor = error ? colors.danger : focused ? colors.primary : colors.border;

  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputBox, { borderColor }]}>
        <Ionicons name={icon} size={20} color={error ? colors.danger : colors.textMuted} />
        <TextInput
          {...props}
          secureTextEntry={secure && hidden}
          placeholderTextColor="#A8A5C0"
          onFocus={(e) => {
            setFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            props.onBlur?.(e);
          }}
          style={styles.input}
        />
        {secure && (
          <Pressable
            onPress={() => setHidden((h) => !h)}
            hitSlop={10}
            accessibilityLabel={hidden ? 'Mostrar contraseña' : 'Ocultar contraseña'}
          >
            <Ionicons
              name={hidden ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color={colors.textMuted}
            />
          </Pressable>
        )}
      </View>
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : hint ? (
        <Text style={styles.hintText}>{hint}</Text>
      ) : null}
    </View>
  );
}

export function Banner({
  tone,
  children,
}: {
  tone: 'danger' | 'success' | 'info';
  children: ReactNode;
}) {
  const map = {
    danger: { bg: colors.dangerSoft, fg: colors.danger, icon: 'alert-circle' as const },
    success: { bg: colors.successSoft, fg: colors.success, icon: 'checkmark-circle' as const },
    info: { bg: colors.primarySoft, fg: colors.primary, icon: 'information-circle' as const },
  }[tone];
  return (
    <View style={[styles.banner, { backgroundColor: map.bg }]}>
      <Ionicons name={map.icon} size={20} color={map.fg} />
      <Text style={[styles.bannerText, { color: map.fg }]}>{children}</Text>
    </View>
  );
}

export function Chip({
  label,
  tone = 'neutral',
  style,
}: {
  label: string;
  tone?: 'neutral' | 'success' | 'warning' | 'primary';
  style?: ViewStyle;
}) {
  const map = {
    neutral: { bg: '#F1EFF8', fg: colors.textMuted },
    success: { bg: colors.successSoft, fg: colors.success },
    warning: { bg: colors.warningSoft, fg: colors.warning },
    primary: { bg: colors.primarySoft, fg: colors.primary },
  }[tone];
  return (
    <View style={[styles.chip, { backgroundColor: map.bg }, style]}>
      <Text style={[styles.chipText, { color: map.fg }]}>{label}</Text>
    </View>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  screenInner: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  logoText: { fontWeight: '800', color: colors.primary, letterSpacing: -0.5 },
  gradientButton: {
    height: 54,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  gradientLabel: { color: '#fff', fontSize: 16, fontWeight: '700' },
  outlineButton: {
    height: 54,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  outlineLabel: { color: colors.primary, fontSize: 16, fontWeight: '700' },
  label: { fontSize: 14, fontWeight: '600', color: colors.text },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 52,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: colors.text,
    // quita el borde de foco del navegador
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {}),
  },
  errorText: { color: colors.danger, fontSize: 13 },
  hintText: { color: colors.textMuted, fontSize: 13 },
  banner: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    padding: spacing.md,
    borderRadius: radius.md,
  },
  bannerText: { flex: 1, fontSize: 14, lineHeight: 20, fontWeight: '500' },
  chip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  chipText: { fontSize: 12, fontWeight: '700' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadow,
  },
});
