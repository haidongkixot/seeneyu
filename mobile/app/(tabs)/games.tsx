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
  roundCount?: number;
  totalPlays?: number;
};

const ICON_FOR_TYPE: Record<string, React.ComponentType<any>> = {
  'guess-expression': Eye,
  'guess_expression': Eye,
  'match-expression': Shuffle,
  'match_expression': Shuffle,
  'expression-king': Crown,
  'expression_king': Crown,
  'emotion-timeline': Clock,
  'emotion_timeline': Clock,
  'spot-the-signal': Search,
  'spot_the_signal': Search,
};

const COLOR_FOR_TYPE: Record<string, { color: string; bgColor: string }> = {
  'guess-expression': { color: '#8b5cf6', bgColor: 'rgba(139,92,246,0.12)' },
  'guess_expression': { color: '#8b5cf6', bgColor: 'rgba(139,92,246,0.12)' },
  'match-expression': { color: '#06b6d4', bgColor: 'rgba(6,182,212,0.12)' },
  'match_expression': { color: '#06b6d4', bgColor: 'rgba(6,182,212,0.12)' },
  'expression-king': { color: '#f59e0b', bgColor: 'rgba(245,158,11,0.12)' },
  'expression_king': { color: '#f59e0b', bgColor: 'rgba(245,158,11,0.12)' },
  'emotion-timeline': { color: '#ec4899', bgColor: 'rgba(236,72,153,0.12)' },
  'emotion_timeline': { color: '#ec4899', bgColor: 'rgba(236,72,153,0.12)' },
  'spot-the-signal': { color: '#22c55e', bgColor: 'rgba(34,197,94,0.12)' },
  'spot_the_signal': { color: '#22c55e', bgColor: 'rgba(34,197,94,0.12)' },
};

const DEFAULT_GAMES: GameDef[] = [
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

type ApiGame = {
  id: string;
  type: string;
  title: string;
  description: string;
  config?: any;
  roundCount?: number;
  totalPlays?: number;
};

function apiGameToGameDef(g: ApiGame): GameDef {
  const typeKey = g.type.replace(/_/g, '-');
  const colors = COLOR_FOR_TYPE[g.type] || COLOR_FOR_TYPE[typeKey] || { color: '#8b5cf6', bgColor: 'rgba(139,92,246,0.12)' };
  const icon = ICON_FOR_TYPE[g.type] || ICON_FOR_TYPE[typeKey] || Eye;
  return {
    type: typeKey,
    title: g.title,
    description: g.description,
    icon,
    color: colors.color,
    bgColor: colors.bgColor,
    roundCount: g.roundCount,
    totalPlays: g.totalPlays,
  };
}

export default function GamesScreen() {
  const { token } = useAuth();
  const router = useRouter();
  const [games, setGames] = useState<GameDef[]>([]);
  const [topPlayers, setTopPlayers] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [gamesData, leaderData] = await Promise.allSettled([
        apiGet<ApiGame[]>('/api/public/games', token),
        apiGet<LeaderboardEntry[] | { entries: LeaderboardEntry[] }>(
          '/api/public/games/leaderboard',
          token
        ),
      ]);

      if (gamesData.status === 'fulfilled' && gamesData.value) {
        const arr = Array.isArray(gamesData.value) ? gamesData.value : [];
        if (arr.length > 0) {
          setGames(arr.map(apiGameToGameDef));
        } else {
          setGames(DEFAULT_GAMES);
        }
      } else {
        setGames(DEFAULT_GAMES);
      }

      if (leaderData.status === 'fulfilled' && leaderData.value) {
        const arr = Array.isArray(leaderData.value)
          ? leaderData.value
          : (leaderData.value as any).entries ?? [];
        setTopPlayers(arr.slice(0, 5));
      }
    } catch {
      setGames(DEFAULT_GAMES);
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
        playCount={item.totalPlays}
        onPress={() => router.push(`/games/${item.type}`)}
      />
    ),
    [router]
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
          data={games}
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
