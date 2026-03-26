import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Play } from 'lucide-react-native';
import { useAuth } from '@/lib/auth-context';
import { apiGet } from '@/lib/api';
import { Card } from '@/components/Card';
import { colors } from '@/lib/theme';

type Game = {
  id: string;
  title: string;
  description?: string;
  slug?: string;
  difficulty?: string;
};

export default function GamesScreen() {
  const { token } = useAuth();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function fetchGames() {
    try {
      const data = await apiGet<Game[] | { games: Game[] }>(
        '/api/public/games',
        token
      );
      setGames(Array.isArray(data) ? data : (data as any).games ?? []);
    } catch {
      // API may not exist yet
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchGames();
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
          Mini-Games
        </Text>
        <Text
          style={{
            fontSize: 14,
            fontFamily: 'PlusJakartaSans_400Regular',
            color: colors.text.secondary,
            marginTop: 4,
          }}
        >
          Learn through interactive games
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingTop: 0 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchGames();
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
        ) : games.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 48 }}>
            <Text
              style={{
                fontSize: 16,
                fontFamily: 'PlusJakartaSans_500Medium',
                color: colors.text.tertiary,
              }}
            >
              No games available yet.
            </Text>
          </View>
        ) : (
          games.map((game) => (
            <TouchableOpacity key={game.id} activeOpacity={0.7}>
              <Card
                style={{
                  marginBottom: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 16,
                }}
              >
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    backgroundColor: 'rgba(251,191,36,0.12)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Play size={24} color={colors.accent[500]} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 16,
                      fontFamily: 'PlusJakartaSans_600SemiBold',
                      color: colors.text.primary,
                    }}
                  >
                    {game.title}
                  </Text>
                  {game.description && (
                    <Text
                      style={{
                        fontSize: 13,
                        fontFamily: 'PlusJakartaSans_400Regular',
                        color: colors.text.secondary,
                        marginTop: 2,
                      }}
                      numberOfLines={2}
                    >
                      {game.description}
                    </Text>
                  )}
                  {game.difficulty && (
                    <Text
                      style={{
                        fontSize: 11,
                        fontFamily: 'PlusJakartaSans_500Medium',
                        color: colors.accent[600],
                        marginTop: 4,
                      }}
                    >
                      {game.difficulty}
                    </Text>
                  )}
                </View>
              </Card>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
