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
import { Target, CheckCircle2 } from 'lucide-react-native';
import { useAuth } from '@/lib/auth-context';
import { apiGet } from '@/lib/api';
import { Card } from '@/components/Card';
import { colors } from '@/lib/theme';

type Quest = {
  id: string;
  title: string;
  description?: string;
  xpReward: number;
  progress: number;
  target: number;
  completed: boolean;
};

const QuestItem = memo(function QuestItem({ item }: { item: Quest }) {
  const progressPct = Math.min((item.progress / item.target) * 100, 100);

  return (
    <Card style={{ marginBottom: 12, opacity: item.completed ? 0.7 : 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: item.completed
              ? 'rgba(34,197,94,0.12)'
              : 'rgba(251,191,36,0.12)',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
          }}
        >
          {item.completed ? (
            <CheckCircle2 size={22} color={colors.status.success} />
          ) : (
            <Target size={22} color={colors.accent[500]} />
          )}
        </View>
        <View style={{ flex: 1 }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                fontSize: 15,
                fontFamily: 'PlusJakartaSans_600SemiBold',
                color: colors.text.primary,
                flex: 1,
              }}
              numberOfLines={1}
            >
              {item.title}
            </Text>
            <View
              style={{
                backgroundColor: 'rgba(251,191,36,0.12)',
                borderRadius: 8,
                paddingHorizontal: 8,
                paddingVertical: 2,
                marginLeft: 8,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontFamily: 'PlusJakartaSans_700Bold',
                  color: colors.accent[600],
                }}
              >
                +{item.xpReward} XP
              </Text>
            </View>
          </View>
          {item.description && (
            <Text
              style={{
                fontSize: 13,
                fontFamily: 'PlusJakartaSans_400Regular',
                color: colors.text.tertiary,
                marginTop: 4,
              }}
            >
              {item.description}
            </Text>
          )}
          <View
            style={{
              marginTop: 10,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <View
              style={{
                flex: 1,
                height: 6,
                backgroundColor: colors.bg.surface,
                borderRadius: 3,
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  width: `${progressPct}%`,
                  height: '100%',
                  backgroundColor: item.completed
                    ? colors.status.success
                    : colors.accent[400],
                  borderRadius: 3,
                }}
              />
            </View>
            <Text
              style={{
                fontSize: 11,
                fontFamily: 'PlusJakartaSans_600SemiBold',
                color: colors.text.tertiary,
                minWidth: 36,
                textAlign: 'right',
              }}
            >
              {item.progress}/{item.target}
            </Text>
          </View>
        </View>
      </View>
    </Card>
  );
});

export default function QuestsScreen() {
  const { token } = useAuth();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchQuests = useCallback(async () => {
    try {
      const data = await apiGet<Quest[]>(
        '/api/gamification/daily-quests',
        token
      );
      setQuests(data || []);
    } catch {
      setQuests([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    fetchQuests();
  }, [fetchQuests]);

  const completed = quests.filter((q) => q.completed).length;

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Daily Quests',
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
            data={quests}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <QuestItem item={item} />}
            contentContainerStyle={{ padding: 16 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  setRefreshing(true);
                  fetchQuests();
                }}
                tintColor={colors.accent[400]}
              />
            }
            ListHeaderComponent={
              quests.length > 0 ? (
                <View style={{ marginBottom: 16 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontFamily: 'PlusJakartaSans_500Medium',
                      color: colors.text.secondary,
                    }}
                  >
                    {completed}/{quests.length} completed today
                  </Text>
                </View>
              ) : null
            }
            ListEmptyComponent={
              <View style={{ alignItems: 'center', paddingTop: 48 }}>
                <Target size={48} color={colors.text.tertiary} />
                <Text
                  style={{
                    fontSize: 16,
                    fontFamily: 'PlusJakartaSans_500Medium',
                    color: colors.text.tertiary,
                    marginTop: 16,
                  }}
                >
                  No quests available
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: 'PlusJakartaSans_400Regular',
                    color: colors.text.tertiary,
                    marginTop: 4,
                    textAlign: 'center',
                  }}
                >
                  Check back tomorrow for new daily quests.
                </Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </>
  );
}
