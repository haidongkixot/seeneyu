import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  BookOpen,
  Gamepad2,
  Video,
  Award,
  Trophy,
  ChevronRight,
} from 'lucide-react-native';
import { useAuth } from '@/lib/auth-context';
import { apiGet } from '@/lib/api';
import { Card } from '@/components/Card';
import { GamificationHeader } from '@/components/GamificationHeader';
import { CoachNeyFAB } from '@/components/CoachNeyFAB';
import { CoachNeyChat } from '@/components/CoachNeyChat';
import { StreakDisplay } from '@/components/StreakDisplay';
import { XpProgressBar } from '@/components/XpProgressBar';
import { QuestCard, Quest } from '@/components/QuestCard';
import { colors } from '@/lib/theme';

type GamificationProfile = {
  xp?: number;
  xpForNextLevel?: number;
  level?: number;
  streak?: number;
  hearts?: number;
  tier?: string;
};

export default function HomeScreen() {
  const { user, token } = useAuth();
  const [stats, setStats] = useState<GamificationProfile>({});
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [chatVisible, setChatVisible] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [profileData, questsData] = await Promise.all([
        apiGet<GamificationProfile>('/api/gamification/profile', token).catch(
          () => ({} as GamificationProfile)
        ),
        apiGet<Quest[]>('/api/gamification/quests', token).catch(
          () => [] as Quest[]
        ),
      ]);
      setStats(profileData);
      setQuests(questsData);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function onRefresh() {
    setRefreshing(true);
    fetchData();
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

  // Show first 2 quests as preview
  const questPreview = quests.slice(0, 2);

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

        {/* Stats + XP Progress */}
        {loading ? (
          <ActivityIndicator
            color={colors.accent[400]}
            style={{ marginVertical: 24 }}
          />
        ) : (
          <>
            {/* Stats row */}
            <Card style={{ marginBottom: 16 }}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-around',
                  alignItems: 'center',
                }}
              >
                <StreakDisplay streak={stats.streak ?? 0} />

                <View
                  style={{
                    width: 1,
                    height: 40,
                    backgroundColor: colors.border.default,
                  }}
                />

                <View style={{ alignItems: 'center' }}>
                  <Text
                    style={{
                      fontSize: 22,
                      fontFamily: 'PlusJakartaSans_700Bold',
                      color: '#ef4444',
                    }}
                  >
                    {stats.hearts ?? 5}
                  </Text>
                  <Text
                    style={{
                      fontSize: 11,
                      fontFamily: 'PlusJakartaSans_500Medium',
                      color: colors.text.secondary,
                    }}
                  >
                    hearts
                  </Text>
                </View>

                <View
                  style={{
                    width: 1,
                    height: 40,
                    backgroundColor: colors.border.default,
                  }}
                />

                <View style={{ alignItems: 'center' }}>
                  <Text
                    style={{
                      fontSize: 22,
                      fontFamily: 'PlusJakartaSans_700Bold',
                      color: colors.accent[500],
                    }}
                  >
                    {stats.xp ?? 0}
                  </Text>
                  <Text
                    style={{
                      fontSize: 11,
                      fontFamily: 'PlusJakartaSans_500Medium',
                      color: colors.text.secondary,
                    }}
                  >
                    total XP
                  </Text>
                </View>

                {stats.tier && (
                  <>
                    <View
                      style={{
                        width: 1,
                        height: 40,
                        backgroundColor: colors.border.default,
                      }}
                    />
                    <View
                      style={{
                        backgroundColor: colors.accent[400],
                        borderRadius: 12,
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontFamily: 'PlusJakartaSans_700Bold',
                          color: '#1a1a2e',
                        }}
                      >
                        {stats.tier}
                      </Text>
                    </View>
                  </>
                )}
              </View>
            </Card>

            {/* XP Progress */}
            <Card style={{ marginBottom: 24 }}>
              <XpProgressBar
                currentXp={stats.xp ?? 0}
                xpForNextLevel={stats.xpForNextLevel ?? 100}
                level={stats.level ?? 1}
              />
            </Card>
          </>
        )}

        {/* Daily Quests Preview */}
        {questPreview.length > 0 && (
          <View style={{ marginBottom: 24 }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12,
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontFamily: 'PlusJakartaSans_600SemiBold',
                  color: colors.text.primary,
                }}
              >
                Daily Quests
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/gamification/quests')}
                activeOpacity={0.7}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontFamily: 'PlusJakartaSans_600SemiBold',
                    color: colors.accent[500],
                  }}
                >
                  View All
                </Text>
                <ChevronRight size={16} color={colors.accent[500]} />
              </TouchableOpacity>
            </View>
            {questPreview.map((quest) => (
              <QuestCard key={quest.id} quest={quest} />
            ))}
          </View>
        )}

        {/* Gamification Links */}
        <View
          style={{
            flexDirection: 'row',
            gap: 12,
            marginBottom: 24,
          }}
        >
          <TouchableOpacity
            onPress={() => router.push('/gamification/badges')}
            activeOpacity={0.7}
            style={{ flex: 1 }}
          >
            <Card
              style={{
                alignItems: 'center',
                gap: 8,
                paddingVertical: 20,
              }}
            >
              <Award size={28} color={colors.accent[500]} />
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: 'PlusJakartaSans_600SemiBold',
                  color: colors.text.primary,
                }}
              >
                Badges
              </Text>
            </Card>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/gamification/leaderboard')}
            activeOpacity={0.7}
            style={{ flex: 1 }}
          >
            <Card
              style={{
                alignItems: 'center',
                gap: 8,
                paddingVertical: 20,
              }}
            >
              <Trophy size={28} color={colors.accent[500]} />
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: 'PlusJakartaSans_600SemiBold',
                  color: colors.text.primary,
                }}
              >
                Leaderboard
              </Text>
            </Card>
          </TouchableOpacity>
        </View>

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

      {/* Coach Ney */}
      <CoachNeyFAB onPress={() => setChatVisible(true)} />
      <CoachNeyChat
        visible={chatVisible}
        onClose={() => setChatVisible(false)}
        context="home"
      />
    </SafeAreaView>
  );
}
