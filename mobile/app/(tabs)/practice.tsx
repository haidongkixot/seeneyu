import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Image,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/lib/auth-context';
import { apiGet } from '@/lib/api';
import { Card } from '@/components/Card';
import { colors } from '@/lib/theme';

type Clip = {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  duration?: string;
};

export default function PracticeScreen() {
  const { token } = useAuth();
  const [clips, setClips] = useState<Clip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function fetchClips() {
    try {
      const data = await apiGet<Clip[] | { clips: Clip[] }>(
        '/api/library',
        token
      );
      setClips(Array.isArray(data) ? data : (data as any).clips ?? []);
    } catch {
      // API may not exist yet
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchClips();
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
          Practice Library
        </Text>
        <Text
          style={{
            fontSize: 14,
            fontFamily: 'PlusJakartaSans_400Regular',
            color: colors.text.secondary,
            marginTop: 4,
          }}
        >
          Watch and analyze video clips
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingTop: 0 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchClips();
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
        ) : clips.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 48 }}>
            <Text
              style={{
                fontSize: 16,
                fontFamily: 'PlusJakartaSans_500Medium',
                color: colors.text.tertiary,
              }}
            >
              No clips available yet.
            </Text>
          </View>
        ) : (
          clips.map((clip) => (
            <Card key={clip.id} style={{ marginBottom: 12 }}>
              {clip.thumbnailUrl && (
                <Image
                  source={{ uri: clip.thumbnailUrl }}
                  style={{
                    width: '100%',
                    height: 180,
                    borderRadius: 12,
                    marginBottom: 12,
                    backgroundColor: '#f0f0f0',
                  }}
                  resizeMode="cover"
                />
              )}
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: 'PlusJakartaSans_600SemiBold',
                  color: colors.text.primary,
                }}
              >
                {clip.title}
              </Text>
              {clip.description && (
                <Text
                  style={{
                    fontSize: 13,
                    fontFamily: 'PlusJakartaSans_400Regular',
                    color: colors.text.secondary,
                    marginTop: 4,
                  }}
                  numberOfLines={2}
                >
                  {clip.description}
                </Text>
              )}
              {clip.duration && (
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: 'PlusJakartaSans_500Medium',
                    color: colors.text.tertiary,
                    marginTop: 4,
                  }}
                >
                  {clip.duration}
                </Text>
              )}
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
