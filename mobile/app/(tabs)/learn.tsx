import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Eye,
  User,
  Hand,
  Smile,
  Mic,
  BookOpen,
} from 'lucide-react-native';
import { useAuth } from '@/lib/auth-context';
import { apiGet } from '@/lib/api';
import { CourseSkeletonList } from '@/components/LoadingSkeleton';
import { colors, spacing } from '@/lib/theme';
import { MOCK_COURSES, type FoundationCourse } from '@/lib/mock-data';

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  eye: Eye,
  user: User,
  hand: Hand,
  smile: Smile,
  mic: Mic,
};

type CourseItemProps = {
  item: FoundationCourse;
  onPress: (slug: string) => void;
};

const CourseItem = React.memo(function CourseItem({
  item,
  onPress,
}: CourseItemProps) {
  const handlePress = useCallback(() => onPress(item.slug), [item.slug, onPress]);
  const IconComponent = ICON_MAP[item.icon] ?? BookOpen;
  const progress =
    item.lessonsCount > 0
      ? Math.round((item.completedCount / item.lessonsCount) * 100)
      : 0;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={handlePress}
      style={styles.courseCard}
    >
      <View style={styles.courseHeader}>
        <View
          style={[styles.iconContainer, { backgroundColor: item.color + '18' }]}
        >
          <IconComponent size={22} color={item.color} />
        </View>
        <View style={styles.courseInfo}>
          <Text style={styles.courseTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.courseMeta}>
            {item.lessonsCount} lesson{item.lessonsCount !== 1 ? 's' : ''}
            {item.completedCount > 0 &&
              ` · ${item.completedCount} completed`}
          </Text>
        </View>
        <Text style={styles.progressPercent}>{progress}%</Text>
      </View>

      <Text style={styles.courseDescription} numberOfLines={2}>
        {item.description}
      </Text>

      <View style={styles.progressBarBg}>
        <View
          style={[
            styles.progressBarFill,
            { width: `${progress}%`, backgroundColor: item.color },
          ]}
        />
      </View>
    </TouchableOpacity>
  );
});

export default function LearnScreen() {
  const { token } = useAuth();
  const router = useRouter();
  const [courses, setCourses] = useState<FoundationCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCourses = useCallback(async () => {
    try {
      const data = await apiGet<FoundationCourse[]>('/api/foundation', token);
      setCourses(Array.isArray(data) ? data : []);
    } catch {
      // API not available — use mock data
      setCourses(MOCK_COURSES);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCourses();
  }, [fetchCourses]);

  const handleCoursePress = useCallback(
    (slug: string) => {
      router.push(`/lesson/${slug}`);
    },
    [router]
  );

  const renderCourse = useCallback(
    ({ item }: { item: FoundationCourse }) => (
      <CourseItem item={item} onPress={handleCoursePress} />
    ),
    [handleCoursePress]
  );

  const keyExtractor = useCallback((item: FoundationCourse) => item.id, []);

  const listHeader = useMemo(
    () => (
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Foundation Courses</Text>
        <Text style={styles.headerSubtitle}>
          Master body language fundamentals
        </Text>
      </View>
    ),
    []
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        {listHeader}
        <View style={styles.skeletonContainer}>
          <CourseSkeletonList count={4} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={courses}
        renderItem={renderCourse}
        keyExtractor={keyExtractor}
        ListHeaderComponent={listHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent[400]}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <BookOpen size={40} color={colors.text.tertiary} />
            <Text style={styles.emptyText}>No courses available yet.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg.base,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  headerTitle: {
    fontSize: 26,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: colors.text.primary,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: colors.text.secondary,
    marginTop: 4,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  skeletonContainer: {
    paddingHorizontal: spacing.md,
  },
  courseCard: {
    backgroundColor: colors.bg.elevated,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  courseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  courseInfo: {
    flex: 1,
    marginLeft: 12,
  },
  courseTitle: {
    fontSize: 17,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: colors.text.primary,
  },
  courseMeta: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: colors.text.tertiary,
    marginTop: 2,
  },
  progressPercent: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: colors.accent[500],
    marginLeft: 8,
  },
  courseDescription: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  progressBarFill: {
    height: 6,
    borderRadius: 3,
  },
  empty: {
    alignItems: 'center',
    marginTop: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: colors.text.tertiary,
  },
});
