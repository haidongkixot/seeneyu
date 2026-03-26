import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Gamepad2,
  Eye,
  Shuffle,
  Crown,
  Clock,
  Search,
  Trophy,
  ChevronRight,
  Users,
} from 'lucide-react-native';
import { useAuth } from '@/lib/auth-context';
import { apiGet } from '@/lib/api';
import { Card } from '@/components/Card';
import { colors } from '@/lib/theme';

type GameDef = {
  type: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ size: number; color: string }>;
  color: string;
  bgColor: string;
};

const GAME_DEFS: GameDef[] = [
  {
    type: 'guess-expression',
    title: 'Guess Expression',
    description: 'Identify the emotion shown in each expression.',
    icon: Eye,
    color: '#8b5cf6',
    bgColor: 'rgba(139,92,246,0.12)',
  },
  {
    type: 'match-expression',
    title: 'Match Expression',
    description: 'Match the description to the correct expression image.',
    icon: Shuffle,
    color: '#06b6d4',
    bgColor: 'rgba(6,182,212,0.12)',
  },
  {
    type: 'expression-king',
    title: 'Expression King',
    description: 'Mimic the expression and get scored by AI.',
    icon: Crown,
    color: '#f59e0b',
    bgColor: 'rgba(245,158,11,0.12)',
  },
  {
    type: 'emotion-timeline',
    title: 'Emotion Timeline',
    description: 'Put the emotion cards in the correct order.',
    icon: Clock,
    color: '#ec4899',
    bgColor: 'rgba(236,72,153,0.12)',
  },
  {
    type: 'spot-the-signal',
    title: 'Spot the Signal',
    description: 'Identify the body language signal in each scenario.',
    icon: Search,
    color: '#22c55e',
    bgColor: 'rgba(34,197,94,0.12)',
  },
];

type LeaderboardEntry = {
  userId: string;
  name: string;
  score: number;
  rank: number;
};

type GameStats = {
  type: string;
  playCount?: number;
};

function GameCard({
  game,
  playCount,
  onPress,
}: {
  game: GameDef;
  playCount?: number;
  onPress: () => void;
}) {
  const Icon = game.icon;
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card style={{ marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              backgroundColor: game.bgColor,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon size={26} color={game.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 16,
                fontFamily: 'PlusJakartaSans_700Bold',
                color: colors.text.primary,
                marginBottom: 2,
              }}
            >
              {game.title}
            </Text>
            <Text
              style={{
                fontSize: 13,
                fontFamily: 'PlusJakartaSans_400Regular',
                color: colors.text.secondary,
                lineHeight: 18,
              }}
              numberOfLines={2}
            >
              {game.description}
            </Text>
            {playCount != null && playCount > 0 && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  marginTop: 6,
                }}
              >
                <Users size={12} color={colors.text.tertiary} />
                <Text
                  style={{
                    fontSize: 11,
                    fontFamily: 'PlusJakartaSans_500Medium',
                    color: colors.text.tertiary,
                  }}
                >
                  {playCount.toLocaleString()} plays
                </Text>
              </View>
            )}
          </View>
          <ChevronRight size={20} color={colors.text.tertiary} />
        </View>
      </Card>
    </TouchableOpacity>
  );
}

export default function GamesScreen() {
  const { token } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<Record<string, number>>({});
  const [topPlayers, setTopPlayers] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [statsData, leaderData] = await Promise.allSettled([
        apiGet<GameStats[] | { games: GameStats[] }>('/api/public/games', token),
        apiGet<LeaderboardEntry[] | { entries: LeaderboardEntry[] }>(
          '/api/public/games/leaderboard',
          token
        ),
      ]);

      if (statsData.status === 'fulfilled' && statsData.value) {
        const arr = Array.isArray(statsData.value)
          ? statsData.value
          : (statsData.value as any).games ?? [];
        const map: Record<string, number> = {};
        arr.forEach((g: GameStats) => {
          if (g.playCount) map[g.type] = g.playCount;
        });
        setStats(map);
      }

      if (leaderData.status === 'fulfilled' && leaderData.value) {
        const arr = Array.isArray(leaderData.value)
          ? leaderData.value
          : (leaderData.value as any).entries ?? [];
        setTopPlayers(arr.slice(0, 5));
      }
    } catch {
      // APIs may not exist yet
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const renderGame = useCallback(
    ({ item }: { item: GameDef }) => (
      <GameCard
        game={item}
        playCount={stats[item.type]}
        onPress={() => router.push(`/games/${item.type}`)}
      />
    ),
    [stats, router]
  );

  const keyExtractor = useCallback((item: GameDef) => item.type, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: 'rgba(139,92,246,0.12)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Gamepad2 size={20} color="#8b5cf6" />
          </View>
          <View>
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
                fontSize: 13,
                fontFamily: 'PlusJakartaSans_400Regular',
                color: colors.text.secondary,
              }}
            >
              Learn through interactive games
            </Text>
          </View>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator
          color={colors.accent[400]}
          style={{ marginTop: 48 }}
        />
      ) : (
        <FlatList
          data={GAME_DEFS}
          renderItem={renderGame}
          keyExtractor={keyExtractor}
          contentContainerStyle={{ padding: 16, paddingTop: 4 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchData();
              }}
              tintColor={colors.accent[400]}
            />
          }
          ListFooterComponent={
            <LeaderboardPreview
              entries={topPlayers}
              onViewAll={() => router.push('/games/leaderboard')}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

function LeaderboardPreview({
  entries,
  onViewAll,
}: {
  entries: LeaderboardEntry[];
  onViewAll: () => void;
}) {
  if (entries.length === 0) return null;

  return (
    <View style={{ marginTop: 16, marginBottom: 24 }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Trophy size={18} color={colors.accent[500]} />
          <Text
            style={{
              fontSize: 16,
              fontFamily: 'PlusJakartaSans_700Bold',
              color: colors.text.primary,
            }}
          >
            Leaderboard
          </Text>
        </View>
        <TouchableOpacity onPress={onViewAll} activeOpacity={0.7}>
          <Text
            style={{
              fontSize: 13,
              fontFamily: 'PlusJakartaSans_600SemiBold',
              color: colors.accent[500],
            }}
          >
            View All
          </Text>
        </TouchableOpacity>
      </View>
      <Card>
        {entries.map((entry, i) => (
          <View
            key={entry.userId}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              paddingVertical: 8,
              borderBottomWidth: i < entries.length - 1 ? 1 : 0,
              borderBottomColor: 'rgba(0,0,0,0.04)',
            }}
          >
            <Text
              style={{
                width: 24,
                fontSize: 14,
                fontFamily: 'PlusJakartaSans_700Bold',
                color:
                  entry.rank === 1
                    ? '#f59e0b'
                    : entry.rank === 2
                      ? '#9ca3af'
                      : entry.rank === 3
                        ? '#cd7f32'
                        : colors.text.tertiary,
                textAlign: 'center',
              }}
            >
              #{entry.rank}
            </Text>
            <Text
              style={{
                flex: 1,
                fontSize: 14,
                fontFamily: 'PlusJakartaSans_500Medium',
                color: colors.text.primary,
              }}
              numberOfLines={1}
            >
              {entry.name}
            </Text>
            <Text
              style={{
                fontSize: 14,
                fontFamily: 'PlusJakartaSans_700Bold',
                color: colors.accent[600],
              }}
            >
              {entry.score.toLocaleString()}
            </Text>
          </View>
        ))}
      </Card>
    </View>
  );
}
