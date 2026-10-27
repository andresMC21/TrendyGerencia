import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { GradientButton, Logo, OutlineButton, Screen } from '../components/ui';
import { useSession } from '../lib/session';
import { colors, radius, spacing } from '../theme';

const BENEFITS: { icon: keyof typeof Ionicons.glyphMap; text: string }[] = [
  { icon: 'shield-checkmark', text: 'Puntos de encuentro seguros según el riesgo de la zona' },
  { icon: 'location', text: 'Objetos de tu mismo barrio, cerca de ti' },
  { icon: 'leaf', text: 'Menos desorden en casa y más vida útil para tus cosas' },
];

export default function Bienvenida() {
  const { user } = useSession();
  if (user) return <Redirect href="/inicio" />;

  return (
    <Screen>
      <View style={styles.header}>
        <Logo />
        <View style={styles.city}>
          <Ionicons name="location-sharp" size={12} color={colors.success} />
          <Text style={styles.cityText}>Cali, CO</Text>
        </View>
      </View>

      <LinearGradient
        colors={colors.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.heroIcon}>
          <Ionicons name="swap-horizontal" size={34} color="#fff" />
        </View>
        <Text style={styles.heroTitle}>Dale una segunda vida a lo que ya no usas</Text>
        <Text style={styles.heroSubtitle}>
          Vende o intercambia con vecinos de Cali, sin miedo a estafas.
        </Text>
      </LinearGradient>

      <View style={styles.benefits}>
        {BENEFITS.map((b) => (
          <View key={b.text} style={styles.benefit}>
            <View style={styles.benefitDot}>
              <Ionicons name={b.icon} size={18} color={colors.accent} />
            </View>
            <Text style={styles.benefitText}>{b.text}</Text>
          </View>
        ))}
      </View>

      <View style={{ flex: 1 }} />

      <View style={{ gap: spacing.md }}>
        <GradientButton
          label="Crear cuenta"
          icon="person-add"
          onPress={() => router.push('/registro')}
        />
        <OutlineButton label="Ya tengo cuenta" onPress={() => router.push('/ingresar')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  city: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.successSoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  cityText: { color: colors.success, fontWeight: '700', fontSize: 12 },
  hero: { borderRadius: radius.lg, padding: spacing.xl, gap: spacing.md },
  heroIcon: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: { color: '#fff', fontSize: 26, fontWeight: '800', lineHeight: 32 },
  heroSubtitle: { color: 'rgba(255,255,255,0.9)', fontSize: 15, lineHeight: 22 },
  benefits: { gap: spacing.lg, marginTop: spacing.xl, marginBottom: spacing.xl },
  benefit: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  benefitDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF1E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitText: { flex: 1, color: colors.text, fontSize: 15, fontWeight: '600', lineHeight: 21 },
});
