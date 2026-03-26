import { useEffect, useState, useCallback, memo } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { Video, Calendar, Star } from 'lucide-react-native';
import { useAuth } from '@/lib/auth-context';
import { apiGet } from '@/lib/api';
import { Card } from '@/components/Card';
import { colors } from '@/lib/theme';

type Submission = {
  id: string;
  skillName?: string;
  score?: number;
  createdAt: string;
  thumbnailUrl?: string;
  status?: string;
};

const SubmissionItem = memo(function SubmissionItem({
  item,
}: {
  item: Submission;
}) {
  const date = new Date(item.createdAt);
  const dateStr = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => router.push(`/profile/submissions/${item.id}`)}
    >
      <Card style={{ marginBottom: 12, flexDirection: 'row', alignItems: 'center' }}>
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 12,
            backgroundColor: colors.bg.surface,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 14,
          }}
        >
          <Video size={24} color={colors.accent[500]} />
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
            {item.skillName || 'Practice Recording'}
          </Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginTop: 4,
              gap: 12,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Calendar size={12} color={colors.text.tertiary} />
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: 'PlusJakartaSans_400Regular',
                  color: colors.text.tertiary,
                }}
              >
                {dateStr}
              </Text>
            </View>
            {item.score != null && (
              <View
                style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
              >
                <Star size={12} color={colors.accent[500]} />
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: 'PlusJakartaSans_600SemiBold',
                    color: colors.accent[600],
                  }}
                >
                  {item.score}/100
                </Text>
              </View>
            )}
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
});

export default function SubmissionsScreen() {
  const { token } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetch = useCallback(async () => {
    try {
      const data = await apiGet<Submission[]>(
        '/api/submissions',
        token
      );
      setSubmissions(data || []);
    } catch {
      setSubmissions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'My Submissions',
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
            data={submissions}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <SubmissionItem item={item} />}
            contentContainerStyle={{ padding: 16 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  setRefreshing(true);
                  fetch();
                }}
                tintColor={colors.accent[400]}
              />
            }
            ListEmptyComponent={
              <View style={{ alignItems: 'center', paddingTop: 48 }}>
                <Video size={48} color={colors.text.tertiary} />
                <Text
                  style={{
                    fontSize: 16,
                    fontFamily: 'PlusJakartaSans_500Medium',
                    color: colors.text.tertiary,
                    marginTop: 16,
                  }}
                >
                  No submissions yet
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
                  Start a practice session to see your recordings here.
                </Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </>
  );
}
