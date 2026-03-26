import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { BookOpen, Gamepad2, Video } from 'lucide-react-native';
import { useAuth } from '@/lib/auth-context';
import { apiGet } from '@/lib/api';
import { Card } from '@/components/Card';
import { GamificationHeader } from '@/components/GamificationHeader';
import { CoachNeyFAB } from '@/components/CoachNeyFAB';
import { colors } from '@/lib/theme';

type GamificationProfile = {
  xp?: number;
  level?: number;
  streak?: number;
  hearts?: number;
};

export default function HomeScreen() {
  const { user, token } = useAuth();
  const [stats, setStats] = useState<GamificationProfile>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function fetchStats() {
    try {
      const data = await apiGet<GamificationProfile>(
        '/api/gamification/profile',
        token
      );
      setStats(data);
    } catch {
      // Silently fail — stats are non-critical
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchStats();
  }, [token]);

  function onRefresh() {
    setRefreshing(true);
    fetchStats();
  }

  const quickActions = [
    {
      title: 'Continue Learning',
      subtitle: 'Foundation courses',
      icon: BookOpen,
      route: '/(tabs)/learn' as const,
    },
    {
      title: 'Play Games',
      subtitle: 'Mini-games & quizzes',
      icon: Gamepad2,
      route: '/(tabs)/games' as const,
    },
    {
      title: 'Practice',
      subtitle: 'Video library',
      icon: Video,
      route: '/(tabs)/practice' as const,
    },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <GamificationHeader
        streak={stats.streak}
        hearts={stats.hearts}
        xp={stats.xp}
        level={stats.level}
      />

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent[400]}
          />
        }
      >
        {/* Welcome */}
        <Text
          style={{
            fontSize: 24,
            fontFamily: 'PlusJakartaSans_700Bold',
            color: colors.text.primary,
            marginBottom: 4,
          }}
        >
          Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
        </Text>
        <Text
          style={{
            fontSize: 15,
            fontFamily: 'PlusJakartaSans_400Regular',
            color: colors.text.secondary,
            marginBottom: 24,
          }}
        >
          Ready to improve your body language?
        </Text>

        {/* Stats Summary */}
        {loading ? (
          <ActivityIndicator
            color={colors.accent[400]}
            style={{ marginVertical: 24 }}
          />
        ) : (
          <Card style={{ marginBottom: 24 }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-around',
              }}
            >
              <View style={{ alignItems: 'center' }}>
                <Text
                  style={{
                    fontSize: 24,
                    fontFamily: 'PlusJakartaSans_700Bold',
                    color: colors.accent[500],
                  }}
                >
                  {stats.xp ?? 0}
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: 'PlusJakartaSans_400Regular',
                    color: colors.text.secondary,
                  }}
                >
                  Total XP
                </Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text
                  style={{
                    fontSize: 24,
                    fontFamily: 'PlusJakartaSans_700Bold',
                    color: '#f97316',
                  }}
                >
                  {stats.streak ?? 0}
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: 'PlusJakartaSans_400Regular',
                    color: colors.text.secondary,
                  }}
                >
                  Day Streak
                </Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text
                  style={{
                    fontSize: 24,
                    fontFamily: 'PlusJakartaSans_700Bold',
                    color: colors.text.primary,
                  }}
                >
                  {stats.level ?? 1}
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: 'PlusJakartaSans_400Regular',
                    color: colors.text.secondary,
                  }}
                >
                  Level
                </Text>
              </View>
            </View>
          </Card>
        )}

        {/* Quick Actions */}
        <Text
          style={{
            fontSize: 18,
            fontFamily: 'PlusJakartaSans_600SemiBold',
            color: colors.text.primary,
            marginBottom: 12,
          }}
        >
          Quick Actions
        </Text>

        {quickActions.map((action) => (
          <TouchableOpacity
            key={action.title}
            onPress={() => router.push(action.route)}
            activeOpacity={0.7}
          >
            <Card style={{ marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 16 }}>
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
                <action.icon size={24} color={colors.accent[500]} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontFamily: 'PlusJakartaSans_600SemiBold',
                    color: colors.text.primary,
                  }}
                >
                  {action.title}
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    fontFamily: 'PlusJakartaSans_400Regular',
                    color: colors.text.secondary,
                  }}
                >
                  {action.subtitle}
                </Text>
              </View>
            </Card>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <CoachNeyFAB onPress={() => Alert.alert('Coach Ney', 'Chat coming soon!')} />
    </SafeAreaView>
  );
}
