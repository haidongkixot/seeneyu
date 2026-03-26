import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Star, Calendar, MessageSquare } from 'lucide-react-native';
import { useAuth } from '@/lib/auth-context';
import { apiGet } from '@/lib/api';
import { Card } from '@/components/Card';
import { colors } from '@/lib/theme';

type SubmissionDetail = {
  id: string;
  skillName?: string;
  score?: number;
  createdAt: string;
  videoUrl?: string;
  feedback?: string;
  metrics?: Record<string, number>;
};

export default function SubmissionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const [submission, setSubmission] = useState<SubmissionDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDetail = useCallback(async () => {
    try {
      const data = await apiGet<SubmissionDetail>(
        `/api/submissions/${id}`,
        token
      );
      setSubmission(data);
    } catch {
      Alert.alert('Error', 'Failed to load submission.');
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const dateStr = submission
    ? new Date(submission.createdAt).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Submission Detail',
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
        ) : submission ? (
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
            {/* Video Player Placeholder */}
            <View
              style={{
                width: '100%',
                aspectRatio: 16 / 9,
                backgroundColor: '#1a1a2e',
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
                overflow: 'hidden',
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: 'PlusJakartaSans_500Medium',
                  color: '#ffffff',
                  opacity: 0.7,
                }}
              >
                {submission.videoUrl
                  ? 'Video Playback'
                  : 'Video not available'}
              </Text>
            </View>

            {/* Title + Meta */}
            <Text
              style={{
                fontSize: 20,
                fontFamily: 'PlusJakartaSans_700Bold',
                color: colors.text.primary,
                marginBottom: 8,
              }}
            >
              {submission.skillName || 'Practice Recording'}
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 16,
                marginBottom: 16,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Calendar size={14} color={colors.text.tertiary} />
                <Text
                  style={{
                    fontSize: 13,
                    fontFamily: 'PlusJakartaSans_400Regular',
                    color: colors.text.tertiary,
                  }}
                >
                  {dateStr}
                </Text>
              </View>
            </View>

            {/* Score Card */}
            {submission.score != null && (
              <Card style={{ marginBottom: 16, alignItems: 'center' }}>
                <Star size={28} color={colors.accent[500]} />
                <Text
                  style={{
                    fontSize: 36,
                    fontFamily: 'PlusJakartaSans_700Bold',
                    color: colors.text.primary,
                    marginTop: 4,
                  }}
                >
                  {submission.score}
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: 'PlusJakartaSans_400Regular',
                    color: colors.text.tertiary,
                  }}
                >
                  out of 100
                </Text>
              </Card>
            )}

            {/* Metrics */}
            {submission.metrics && Object.keys(submission.metrics).length > 0 && (
              <Card style={{ marginBottom: 16 }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontFamily: 'PlusJakartaSans_600SemiBold',
                    color: colors.text.primary,
                    marginBottom: 12,
                  }}
                >
                  Breakdown
                </Text>
                {Object.entries(submission.metrics).map(([key, val]) => (
                  <View
                    key={key}
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      paddingVertical: 8,
                      borderBottomWidth: 1,
                      borderBottomColor: colors.border.default,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontFamily: 'PlusJakartaSans_500Medium',
                        color: colors.text.secondary,
                        textTransform: 'capitalize',
                      }}
                    >
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </Text>
                    <Text
                      style={{
                        fontSize: 14,
                        fontFamily: 'PlusJakartaSans_600SemiBold',
                        color: colors.text.primary,
                      }}
                    >
                      {val}
                    </Text>
                  </View>
                ))}
              </Card>
            )}

            {/* AI Feedback */}
            {submission.feedback && (
              <Card style={{ marginBottom: 16 }}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 10,
                  }}
                >
                  <MessageSquare size={18} color={colors.accent[500]} />
                  <Text
                    style={{
                      fontSize: 16,
                      fontFamily: 'PlusJakartaSans_600SemiBold',
                      color: colors.text.primary,
                    }}
                  >
                    AI Feedback
                  </Text>
                </View>
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: 'PlusJakartaSans_400Regular',
                    color: colors.text.secondary,
                    lineHeight: 22,
                  }}
                >
                  {submission.feedback}
                </Text>
              </Card>
            )}

            {/* Side-by-side Comparison Placeholder */}
            <Card style={{ marginBottom: 16, alignItems: 'center' }}>
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: 'PlusJakartaSans_500Medium',
                  color: colors.text.tertiary,
                  textAlign: 'center',
                }}
              >
                Side-by-side comparison coming soon
              </Text>
            </Card>
          </ScrollView>
        ) : (
          <View style={{ alignItems: 'center', paddingTop: 48 }}>
            <Text
              style={{
                fontSize: 16,
                fontFamily: 'PlusJakartaSans_500Medium',
                color: colors.text.tertiary,
              }}
            >
              Submission not found
            </Text>
          </View>
        )}
      </SafeAreaView>
    </>
  );
}
