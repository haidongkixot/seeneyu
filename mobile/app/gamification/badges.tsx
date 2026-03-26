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
import { Medal } from 'lucide-react-native';
import { useAuth } from '@/lib/auth-context';
import { apiGet } from '@/lib/api';
import { Card } from '@/components/Card';
import { colors } from '@/lib/theme';

type Badge = {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  earnedAt?: string;
  locked?: boolean;
};

const BadgeItem = memo(function BadgeItem({ item }: { item: Badge }) {
  const locked = item.locked ?? !item.earnedAt;
  return (
    <Card
      style={{
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        opacity: locked ? 0.5 : 1,
      }}
    >
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: locked
            ? colors.bg.surface
            : 'rgba(251,191,36,0.15)',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 14,
        }}
      >
        <Medal
          size={24}
          color={locked ? colors.text.tertiary : colors.accent[500]}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 15,
            fontFamily: 'PlusJakartaSans_600SemiBold',
            color: colors.text.primary,
          }}
        >
          {item.name}
        </Text>
        {item.description && (
          <Text
            style={{
              fontSize: 13,
              fontFamily: 'PlusJakartaSans_400Regular',
              color: colors.text.tertiary,
              marginTop: 2,
            }}
          >
            {item.description}
          </Text>
        )}
        {item.earnedAt && (
          <Text
            style={{
              fontSize: 11,
              fontFamily: 'PlusJakartaSans_400Regular',
              color: colors.accent[600],
              marginTop: 4,
            }}
          >
            Earned{' '}
            {new Date(item.earnedAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </Text>
        )}
      </View>
    </Card>
  );
});

export default function BadgesScreen() {
  const { token } = useAuth();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBadges = useCallback(async () => {
    try {
      const data = await apiGet<Badge[]>('/api/gamification/badges', token);
      setBadges(data || []);
    } catch {
      setBadges([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    fetchBadges();
  }, [fetchBadges]);

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Badges',
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
            data={badges}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <BadgeItem item={item} />}
            contentContainerStyle={{ padding: 16 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  setRefreshing(true);
                  fetchBadges();
                }}
                tintColor={colors.accent[400]}
              />
            }
            ListEmptyComponent={
              <View style={{ alignItems: 'center', paddingTop: 48 }}>
                <Medal size={48} color={colors.text.tertiary} />
                <Text
                  style={{
                    fontSize: 16,
                    fontFamily: 'PlusJakartaSans_500Medium',
                    color: colors.text.tertiary,
                    marginTop: 16,
                  }}
                >
                  No badges yet
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
                  Complete lessons and challenges to earn badges.
                </Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </>
  );
}
