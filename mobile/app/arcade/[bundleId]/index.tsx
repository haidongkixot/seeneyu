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
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Target, Zap, Camera, Mic, MessageSquare, ChevronRight } from 'lucide-react-native';
import { useAuth } from '@/lib/auth-context';
import { apiGet } from '@/lib/api';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { colors } from '@/lib/theme';
import React from 'react';

type Challenge = {
  id: string;
  type: string;
  title: string;
  description?: string;
  difficulty?: string;
  xpReward?: number;
  orderIndex?: number;
};

type BundleDetail = {
  id: string;
  title: string;
  description?: string;
  theme?: string;
  difficulty?: string;
  xpReward?: number;
  challengeCount?: number;
  challenges: Challenge[];
};

const TYPE_ICONS: Record<string, typeof Camera> = {
  facial: Camera,
  expression: Camera,
  vocal: Mic,
  scenario: MessageSquare,
};

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: '#22c55e',
  intermediate: '#f59e0b',
  advanced: '#ef4444',
};

const ChallengeItem = React.memo(function ChallengeItem({
  challenge,
  index,
  onPress,
}: {
  challenge: Challenge;
  index: number;
  onPress: () => void;
}) {
  const Icon = TYPE_ICONS[challenge.type] || Target;
  const diffColor = DIFFICULTY_COLORS[challenge.difficulty ?? ''] ?? colors.text.tertiary;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card style={{ marginBottom: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              backgroundColor: `${colors.accent[400]}15`,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon size={22} color={colors.accent[500]} />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 15,
                fontFamily: 'PlusJakartaSans_600SemiBold',
                color: colors.text.primary,
              }}
              numberOfLines={1}
            >
              {index + 1}. {challenge.title}
            </Text>
            {challenge.description ? (
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: 'PlusJakartaSans_400Regular',
                  color: colors.text.secondary,
                  marginTop: 2,
                }}
                numberOfLines={2}
              >
                {challenge.description}
              </Text>
            ) : null}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 }}>
              {challenge.xpReward ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <Zap size={12} color={colors.accent[500]} />
                  <Text style={{ fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.accent[600] }}>
                    {challenge.xpReward} XP
                  </Text>
                </View>
              ) : null}
              <Text
                style={{
                  fontSize: 11,
                  fontFamily: 'PlusJakartaSans_500Medium',
                  color: diffColor,
                  textTransform: 'capitalize',
                }}
              >
                {challenge.difficulty ?? challenge.type}
              </Text>
            </View>
          </View>
          <ChevronRight size={18} color={colors.text.tertiary} />
        </View>
      </Card>
    </TouchableOpacity>
  );
});

export default function BundleDetailScreen() {
  const { bundleId } = useLocalSearchParams<{ bundleId: string }>();
  const { token } = useAuth();
  const router = useRouter();
  const [bundle, setBundle] = useState<BundleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBundle = useCallback(async () => {
    try {
      // The /api/arcade returns all bundles, find the one we need
      const data = await apiGet<{ bundles: BundleDetail[] }>('/api/arcade', token);
      const bundles = data?.bundles ?? [];
      const found = bundles.find((b) => b.id === bundleId);
      setBundle(found ?? null);
    } catch (err: any) {
      console.error('[BundleDetail] Error:', err?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [bundleId, token]);

  useEffect(() => {
    fetchBundle();
  }, [fetchBundle]);

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: true, title: 'Loading...', headerTitleStyle: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 17 }, headerTintColor: colors.text.primary, headerStyle: { backgroundColor: '#fff' } }} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
          <ActivityIndicator size="large" color={colors.accent[400]} />
        </View>
      </>
    );
  }

  if (!bundle) {
    return (
      <>
        <Stack.Screen options={{ headerShown: true, title: 'Not Found', headerTitleStyle: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 17 }, headerTintColor: colors.text.primary, headerStyle: { backgroundColor: '#fff' } }} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
          <Text style={{ fontSize: 16, color: colors.text.secondary, fontFamily: 'PlusJakartaSans_500Medium' }}>Bundle not found</Text>
        </View>
      </>
    );
  }

  const diffColor = DIFFICULTY_COLORS[bundle.difficulty ?? ''] ?? colors.text.tertiary;

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: bundle.title,
          headerTitleStyle: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 17 },
          headerTintColor: colors.text.primary,
          headerStyle: { backgroundColor: '#ffffff' },
        }}
      />
      <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: '#ffffff' }}>
        <FlatList
          data={bundle.challenges}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchBundle(); }} tintColor={colors.accent[400]} />}
          ListHeaderComponent={
            <View style={{ marginBottom: 20 }}>
              {/* Bundle info */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                {bundle.difficulty ? (
                  <View style={{ backgroundColor: `${diffColor}18`, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                    <Text style={{ fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', color: diffColor, textTransform: 'capitalize' }}>
                      {bundle.difficulty}
                    </Text>
                  </View>
                ) : null}
                {bundle.xpReward ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Zap size={14} color={colors.accent[500]} />
                    <Text style={{ fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.accent[600] }}>
                      {bundle.xpReward} XP
                    </Text>
                  </View>
                ) : null}
              </View>

              {bundle.description ? (
                <Text style={{ fontSize: 14, fontFamily: 'PlusJakartaSans_400Regular', color: colors.text.secondary, lineHeight: 20, marginBottom: 16 }}>
                  {bundle.description}
                </Text>
              ) : null}

              <Text style={{ fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.text.tertiary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {bundle.challenges.length} Challenges
              </Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <ChallengeItem
              challenge={item}
              index={index}
              onPress={() =>
                router.push({
                  pathname: '/arcade/[bundleId]/challenge/[challengeId]',
                  params: { bundleId: bundle.id, challengeId: item.id },
                })
              }
            />
          )}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingTop: 40 }}>
              <Text style={{ fontSize: 15, color: colors.text.secondary, fontFamily: 'PlusJakartaSans_500Medium' }}>
                No challenges in this bundle
              </Text>
            </View>
          }
        />
      </SafeAreaView>
    </>
  );
}
