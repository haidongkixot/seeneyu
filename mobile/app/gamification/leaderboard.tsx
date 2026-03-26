import { useEffect, useState, useCallback, memo } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Trophy } from 'lucide-react-native';
import { useAuth } from '@/lib/auth-context';
import { apiGet } from '@/lib/api';
import { colors } from '@/lib/theme';

type LeaderboardEntry = {
  id: string;
  rank: number;
  name: string;
  xp: number;
  level: number;
  isCurrentUser?: boolean;
};

const RankColors: Record<number, string> = {
  1: '#FFD700',
  2: '#C0C0C0',
  3: '#CD7F32',
};

const LeaderboardItem = memo(function LeaderboardItem({
  item,
}: {
  item: LeaderboardEntry;
}) {
  const rankColor = RankColors[item.rank] || colors.text.tertiary;
  const initials = item.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: item.isCurrentUser
          ? 'rgba(251,191,36,0.08)'
          : 'transparent',
        borderBottomWidth: 1,
        borderBottomColor: colors.border.default,
      }}
    >
      <View style={{ width: 36, alignItems: 'center' }}>
        {item.rank <= 3 ? (
          <Trophy size={20} color={rankColor} />
        ) : (
          <Text
            style={{
              fontSize: 15,
              fontFamily: 'PlusJakartaSans_600SemiBold',
              color: colors.text.tertiary,
            }}
          >
            {item.rank}
          </Text>
        )}
      </View>
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: item.isCurrentUser
            ? colors.accent[400]
            : colors.bg.surface,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
        }}
      >
        <Text
          style={{
            fontSize: 13,
            fontFamily: 'PlusJakartaSans_700Bold',
            color: item.isCurrentUser ? '#1a1a2e' : colors.text.secondary,
          }}
        >
          {initials}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 14,
            fontFamily: item.isCurrentUser
              ? 'PlusJakartaSans_700Bold'
              : 'PlusJakartaSans_500Medium',
            color: colors.text.primary,
          }}
        >
          {item.name}
          {item.isCurrentUser ? ' (You)' : ''}
        </Text>
        <Text
          style={{
            fontSize: 12,
            fontFamily: 'PlusJakartaSans_400Regular',
            color: colors.text.tertiary,
          }}
        >
          Level {item.level}
        </Text>
      </View>
      <Text
        style={{
          fontSize: 14,
          fontFamily: 'PlusJakartaSans_700Bold',
          color: colors.accent[600],
        }}
      >
        {item.xp.toLocaleString()} XP
      </Text>
    </View>
  );
});

export default function LeaderboardScreen() {
  const { token } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const data = await apiGet<LeaderboardEntry[]>(
        '/api/gamification/leaderboard',
        token
      );
      setEntries(data || []);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Leaderboard',
          headerTitleStyle: {
            fontFamily: 'PlusJakartaSans_600SemiBold',
            fontSize: 17,
          },
          headerTintColor: colors.text.primary,
          headerStyle: { backgroundColor: '#ffffff' },
        }}
      />
      <SafeAreaView
        edges={['bottom']}
        style={{ flex: 1, backgroundColor: '#ffffff' }}
      >
        {loading ? (
          <ActivityIndicator
            color={colors.accent[400]}
            style={{ marginTop: 48 }}
          />
        ) : (
          <FlatList
            data={entries}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <LeaderboardItem item={item} />}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  setRefreshing(true);
                  fetchLeaderboard();
                }}
                tintColor={colors.accent[400]}
              />
            }
            ListEmptyComponent={
              <View style={{ alignItems: 'center', paddingTop: 48 }}>
                <Trophy size={48} color={colors.text.tertiary} />
                <Text
                  style={{
                    fontSize: 16,
                    fontFamily: 'PlusJakartaSans_500Medium',
                    color: colors.text.tertiary,
                    marginTop: 16,
                  }}
                >
                  Leaderboard is empty
                </Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </>
  );
}
