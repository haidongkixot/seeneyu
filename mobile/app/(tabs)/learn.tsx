import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/lib/auth-context';
import { apiGet } from '@/lib/api';
import { Card } from '@/components/Card';
import { colors } from '@/lib/theme';

type Course = {
  id: string;
  title: string;
  description?: string;
  lessonsCount?: number;
  progress?: number;
};

export default function LearnScreen() {
  const { token } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function fetchCourses() {
    try {
      const data = await apiGet<Course[]>('/api/foundation', token);
      setCourses(Array.isArray(data) ? data : []);
    } catch {
      // API may not exist yet
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchCourses();
  }, [token]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 }}>
        <Text
          style={{
            fontSize: 24,
            fontFamily: 'PlusJakartaSans_700Bold',
            color: colors.text.primary,
          }}
        >
          Foundation Courses
        </Text>
        <Text
          style={{
            fontSize: 14,
            fontFamily: 'PlusJakartaSans_400Regular',
            color: colors.text.secondary,
            marginTop: 4,
          }}
        >
          Master body language fundamentals
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingTop: 0 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchCourses();
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
        ) : courses.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 48 }}>
            <Text
              style={{
                fontSize: 16,
                fontFamily: 'PlusJakartaSans_500Medium',
                color: colors.text.tertiary,
              }}
            >
              No courses available yet.
            </Text>
          </View>
        ) : (
          courses.map((course) => (
            <Card key={course.id} style={{ marginBottom: 12 }}>
              <Text
                style={{
                  fontSize: 17,
                  fontFamily: 'PlusJakartaSans_600SemiBold',
                  color: colors.text.primary,
                  marginBottom: 4,
                }}
              >
                {course.title}
              </Text>
              {course.description && (
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: 'PlusJakartaSans_400Regular',
                    color: colors.text.secondary,
                    marginBottom: 8,
                  }}
                  numberOfLines={2}
                >
                  {course.description}
                </Text>
              )}
              {course.lessonsCount != null && (
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: 'PlusJakartaSans_500Medium',
                    color: colors.text.tertiary,
                  }}
                >
                  {course.lessonsCount} lessons
                </Text>
              )}
              {course.progress != null && (
                <View
                  style={{
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: 'rgba(0,0,0,0.06)',
                    marginTop: 8,
                  }}
                >
                  <View
                    style={{
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: colors.accent[400],
                      width: `${Math.min(course.progress, 100)}%`,
                    }}
                  />
                </View>
              )}
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
