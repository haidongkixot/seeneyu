import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/lib/auth-context';
import { apiGet } from '@/lib/api';
import { Card } from '@/components/Card';
import { colors } from '@/lib/theme';

type ArcadeBundle = {
  id: string;
  title: string;
  description?: string;
  gamesCount?: number;
};

export default function ArcadeScreen() {
  const { token } = useAuth();
  const [bundles, setBundles] = useState<ArcadeBundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function fetchBundles() {
    try {
      const data = await apiGet<ArcadeBundle[] | { bundles: ArcadeBundle[] }>(
        '/api/arcade',
        token
      );
      setBundles(
        Array.isArray(data) ? data : (data as any).bundles ?? []
      );
    } catch {
      // API may not exist yet
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchBundles();
  }, [token]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 }}>
        <Text
          style={{
            fontSize: 24,
            fontFamily: 'PlusJakartaSans_700Bold',
            color: colors.text.primary,
          }}
        >
          Arcade
        </Text>
        <Text
          style={{
            fontSize: 14,
            fontFamily: 'PlusJakartaSans_400Regular',
            color: colors.text.secondary,
            marginTop: 4,
          }}
        >
          Game bundles and challenges
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingTop: 0 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchBundles();
            }}
            tintColor={colors.accent[400]}
          />
        }
      >
        {loading ? (
          <ActivityIndicator
            color={colors.accent[400]}
            style={{ marginTop: 48 }}
          />
        ) : bundles.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 48 }}>
            <Text
              style={{
                fontSize: 16,
                fontFamily: 'PlusJakartaSans_500Medium',
                color: colors.text.tertiary,
              }}
            >
              No arcade bundles available yet.
            </Text>
          </View>
        ) : (
          bundles.map((bundle) => (
            <Card key={bundle.id} style={{ marginBottom: 12 }}>
              <Text
                style={{
                  fontSize: 17,
                  fontFamily: 'PlusJakartaSans_600SemiBold',
                  color: colors.text.primary,
                  marginBottom: 4,
                }}
              >
                {bundle.title}
              </Text>
              {bundle.description && (
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: 'PlusJakartaSans_400Regular',
                    color: colors.text.secondary,
                  }}
                  numberOfLines={2}
                >
                  {bundle.description}
                </Text>
              )}
              {bundle.gamesCount != null && (
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: 'PlusJakartaSans_500Medium',
                    color: colors.text.tertiary,
                    marginTop: 4,
                  }}
                >
                  {bundle.gamesCount} games
                </Text>
              )}
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
