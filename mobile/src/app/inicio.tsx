import { Ionicons } from '@expo/vector-icons';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Banner, Card, Chip, Logo, Screen } from '../components/ui';
import { productApi, type Product, type UserProfile } from '../lib/api';
import { resetTo } from '../lib/navigation';
import { useSession } from '../lib/session';
import { colors, radius, spacing } from '../theme';

const CATEGORY_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  hogar: 'home-outline',
  deportes: 'bicycle-outline',
  libros: 'book-outline',
  tecnologia: 'phone-portrait-outline',
  ropa: 'shirt-outline',
};

const VERIFICATION: Record<
  UserProfile['verificationStatus'],
  { label: string; tone: 'success' | 'warning' | 'neutral' | 'primary' }
> = {
  VERIFIED: { label: '✓ Identidad verificada', tone: 'success' },
  PENDING: { label: 'Verificación en revisión', tone: 'primary' },
  UNVERIFIED: { label: 'Sin verificar', tone: 'warning' },
  REJECTED: { label: 'Verificación rechazada', tone: 'neutral' },
};

const ROLE_LABEL: Record<string, string> = {
  USER: 'Usuario',
  ADMIN: 'Administrador',
  MODERATOR: 'Moderador',
};

const formatPrice = (value: number) =>
  value === 0 ? 'Gratis' : `$${Math.round(value).toLocaleString('es-CO')}`;

const prettyNeighborhood = (id: string) =>
  id
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
}

export default function Inicio() {
  const { user, isNewAccount, dismissWelcome, logout } = useSession();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [feedError, setFeedError] = useState(false);

  useEffect(() => {
    productApi
      .feed()
      .then((r) => setProducts(r.items))
      .catch(() => setFeedError(true));
  }, []);

  if (!user) return <Redirect href="/bienvenida" />;

  const firstName = user.fullName.split(' ')[0];
  const verification = VERIFICATION[user.verificationStatus];

  return (
    <Screen>
      <View style={styles.header}>
        <Logo />
        <View style={styles.city}>
          <Ionicons name="location-sharp" size={12} color={colors.success} />
          <Text style={styles.cityText}>Cali, CO</Text>
        </View>
      </View>

      {isNewAccount && (
        <Pressable onPress={dismissWelcome} style={{ marginBottom: spacing.lg }}>
          <Banner tone="success">
            ¡Tu cuenta quedó creada, {firstName}! Ya puedes participar en Trendy.
          </Banner>
        </Pressable>
      )}

      <Text style={styles.greeting}>Hola, {firstName} 👋</Text>

      <Card style={{ marginTop: spacing.lg }}>
        <View style={styles.profileRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials(user.fullName)}</Text>
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.name}>{user.fullName}</Text>
            <Text style={styles.email}>{user.email}</Text>
          </View>
        </View>
        <View style={styles.chips}>
          <Chip label={user.role.map((r) => ROLE_LABEL[r] ?? r).join(', ')} tone="primary" />
          <Chip label={verification.label} tone={verification.tone} />
          {user.isActive && <Chip label="Cuenta activa" tone="success" />}
        </View>
        <Pressable
          onPress={async () => {
            await logout();
            resetTo('/bienvenida');
          }}
          style={styles.logout}
          testID="btn-salir"
        >
          <Ionicons name="log-out-outline" size={18} color={colors.textMuted} />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </Pressable>
      </Card>

      <Text style={styles.section}>CERCA DE TI</Text>

      {products === null && !feedError && (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />
      )}
      {feedError && <Banner tone="info">No pudimos cargar las publicaciones por ahora.</Banner>}
      {products?.length === 0 && (
        <Banner tone="info">Aún no hay publicaciones en tu zona.</Banner>
      )}

      <View style={styles.grid}>
        {products?.map((p) => (
          <View key={p.id} style={styles.product}>
            <View style={styles.productImage}>
              <Ionicons
                name={CATEGORY_ICON[p.category] ?? 'cube-outline'}
                size={34}
                color={colors.primary}
              />
              {p.acceptsBarter && (
                <View style={styles.barter}>
                  <Text style={styles.barterText}>Acepta trueque</Text>
                </View>
              )}
            </View>
            <View style={{ padding: spacing.md, gap: 2 }}>
              <Text style={styles.productTitle} numberOfLines={2}>
                {p.title}
              </Text>
              <Text style={styles.productPrice}>{formatPrice(Number(p.price))}</Text>
              <Text style={styles.productHood}>Barrio {prettyNeighborhood(p.neighborhoodId)}</Text>
            </View>
          </View>
        ))}
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
  greeting: { fontSize: 26, fontWeight: '800', color: colors.text },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 18 },
  name: { fontSize: 17, fontWeight: '700', color: colors.text },
  email: { fontSize: 14, color: colors.textMuted },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: spacing.md },
  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  logoutText: { color: colors.textMuted, fontWeight: '600' },
  section: {
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
    color: colors.textMuted,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  product: {
    width: '47.5%',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  productImage: {
    height: 110,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barter: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.pink,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  barterText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  productTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  productPrice: { fontSize: 15, fontWeight: '800', color: colors.success },
  productHood: { fontSize: 12, color: colors.textMuted },
});
