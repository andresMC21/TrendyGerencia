import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useSession } from '../lib/session';
import { colors } from '../theme';

/** Punto de entrada: decide si mostrar la bienvenida o el inicio. */
export default function Index() {
  const { loading, user } = useSession();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return <Redirect href={user ? '/inicio' : '/bienvenida'} />;
}
