import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Trophy,
  Zap,
  Target,
  Star,
  ChevronRight,
} from 'lucide-react-native';
import { useAuth } from '@/lib/auth-context';
import { apiGet } from '@/lib/api';
import { Card } from '@/components/Card';
import { colors } from '@/lib/theme';

type ArcadeBundle = {
  id: string;
  title: string;
  description?: string;
  challengeCount?: number;
  xpReward?: number;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  gamesCount?: number;
};

const DIFFICULTY_CONFIG = {
  beginner: { label: 'Beginner', color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
  intermediate: { label: 'Intermediate', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  advanced: { label: 'Advanced', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
} as const;

const GRADIENT_ACCENTS = [
  '#f59e0b',
  '#8b5cf6',
  '#06b6d4',
  '#ec4899',
  '#22c55e',
  '#3b82f6',
];

function BundleCard({
  bundle,
  index,
  onPress,
}: {
  bundle: ArcadeBundle;
  index: number;
  onPress: () => void;
}) {
  const accent = GRADIENT_ACCENTS[index % GRADIENT_ACCENTS.length];
  const diff = bundle.difficulty
    ? DIFFICULTY_CONFIG[bundle.difficulty]
    : null;
  const challengeCount = bundle.challengeCount ?? bundle.gamesCount ?? 0;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card style={{ marginBottom: 14, overflow: 'hidden' }}>
        {/* Accent strip */}
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            backgroundColor: accent,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
          }}
        />
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 14, paddingTop: 4 }}>
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              backgroundColor: `${accent}1A`,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Trophy size={24} color={accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 17,
                fontFamily: 'PlusJakartaSans_700Bold',
                color: colors.text.primary,
                marginBottom: 4,
              }}
            >
              {bundle.title}
            </Text>
            {bundle.description ? (
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: 'PlusJakartaSans_400Regular',
                  color: colors.text.secondary,
                  lineHeight: 18,
                }}
                numberOfLines={2}
              >
                {bundle.description}
              </Text>
            ) : null}

            {/* Meta row */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
                marginTop: 10,
              }}
            >
              {challengeCount > 0 && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Target size={14} color={colors.text.tertiary} />
                  <Text
                    style={{
                      fontSize: 12,
                      fontFamily: 'PlusJakartaSans_500Medium',
                      color: colors.text.tertiary,
                    }}
                  >
                    {challengeCount} challenges
                  </Text>
                </View>
              )}
              {bundle.xpReward != null && bundle.xpReward > 0 && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Zap size={14} color={colors.accent[500]} />
                  <Text
                    style={{
                      fontSize: 12,
                      fontFamily: 'PlusJakartaSans_600SemiBold',
                      color: colors.accent[600],
                    }}
                  >
                    {bundle.xpReward} XP
                  </Text>
                </View>
              )}
              {diff && (
                <View
                  style={{
                    backgroundColor: diff.bg,
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 8,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontFamily: 'PlusJakartaSans_600SemiBold',
                      color: diff.color,
                    }}
                  >
                    {diff.label}
                  </Text>
                </View>
              )}
            </View>
          </View>
          <ChevronRight size={20} color={colors.text.tertiary} style={{ marginTop: 14 }} />
        </View>
      </Card>
    </TouchableOpacity>
  );
}

export default function ArcadeScreen() {
  const { token } = useAuth();
  const router = useRouter();
  const [bundles, setBundles] = useState<ArcadeBundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBundles = useCallback(async () => {
    try {
      const data = await apiGet<ArcadeBundle[] | { bundles: ArcadeBundle[] }>(
        '/api/arcade',
        token
      );
      setBundles(
        Array.isArray(data) ? data : (data as any).bundles ?? []
      );
    } catch (err: any) {
      console.error('[Arcade] Fetch error:', err?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    fetchBundles();
  }, [fetchBundles]);

  const renderItem = useCallback(
    ({ item, index }: { item: ArcadeBundle; index: number }) => (
      <BundleCard
        bundle={item}
        index={index}
        onPress={() => router.push(`/arcade/${item.id}`)}
      />
    ),
    [router]
  );

  const keyExtractor = useCallback((item: ArcadeBundle) => item.id, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: 'rgba(251,191,36,0.15)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Star size={20} color={colors.accent[500]} />
          </View>
          <View>
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
                fontSize: 13,
                fontFamily: 'PlusJakartaSans_400Regular',
                color: colors.text.secondary,
              }}
            >
              Tackle bundles and earn XP
            </Text>
          </View>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator
          color={colors.accent[400]}
          style={{ marginTop: 48 }}
        />
      ) : bundles.length === 0 ? (
        <View style={{ alignItems: 'center', marginTop: 48, paddingHorizontal: 32 }}>
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: 'rgba(0,0,0,0.04)',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}
          >
            <Trophy size={36} color={colors.text.tertiary} />
          </View>
          <Text
            style={{
              fontSize: 16,
              fontFamily: 'PlusJakartaSans_600SemiBold',
              color: colors.text.secondary,
              textAlign: 'center',
              marginBottom: 4,
            }}
          >
            No bundles yet
          </Text>
          <Text
            style={{
              fontSize: 14,
              fontFamily: 'PlusJakartaSans_400Regular',
              color: colors.text.tertiary,
              textAlign: 'center',
            }}
          >
            Arcade bundles will appear here once available.
          </Text>
        </View>
      ) : (
        <FlatList
          data={bundles}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={{ padding: 16, paddingTop: 4 }}
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
        />
      )}
    </SafeAreaView>
  );
}
