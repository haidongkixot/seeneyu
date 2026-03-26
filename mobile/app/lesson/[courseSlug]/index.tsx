import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Check, Lock, BookOpen } from 'lucide-react-native';
import { useAuth } from '@/lib/auth-context';
import { apiGet } from '@/lib/api';
import { CourseSkeletonList } from '@/components/LoadingSkeleton';
import { colors, spacing } from '@/lib/theme';

type FoundationCourse = {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  order: number;
  lessonsCount: number;
  completedCount: number;
};

type FoundationLesson = {
  id: string;
  slug: string;
  courseId: string;
  title: string;
  theoryHtml: string;
  order: number;
  completed: boolean;
  quizPassed: boolean;
  examples: any[];
  questions: any[];
};

type LessonItemProps = {
  item: FoundationLesson;
  index: number;
  locked: boolean;
  onPress: (slug: string) => void;
};

const LessonItem = React.memo(function LessonItem({
  item,
  index,
  locked,
  onPress,
}: LessonItemProps) {
  const handlePress = useCallback(() => {
    if (!locked) onPress(item.slug);
  }, [item.slug, locked, onPress]);

  return (
    <TouchableOpacity
      activeOpacity={locked ? 1 : 0.7}
      onPress={handlePress}
      style={[styles.lessonCard, locked && styles.lessonLocked]}
    >
      <View
        style={[
          styles.lessonNumber,
          item.completed
            ? styles.lessonNumberCompleted
            : locked
            ? styles.lessonNumberLocked
            : styles.lessonNumberActive,
        ]}
      >
        {item.completed ? (
          <Check size={16} color="#ffffff" />
        ) : locked ? (
          <Lock size={14} color={colors.text.tertiary} />
        ) : (
          <Text style={styles.lessonNumberText}>{index + 1}</Text>
        )}
      </View>
      <View style={styles.lessonInfo}>
        <Text
          style={[
            styles.lessonTitle,
            locked && { color: colors.text.tertiary },
          ]}
          numberOfLines={1}
        >
          {item.title}
        </Text>
        <Text style={styles.lessonMeta}>
          {item.questions.length} quiz question
          {item.questions.length !== 1 ? 's' : ''}
          {item.completed && ' \u00b7 Completed'}
          {item.quizPassed && !item.completed && ' \u00b7 Quiz passed'}
        </Text>
      </View>
    </TouchableOpacity>
  );
});

export default function CourseDetailScreen() {
  const { courseSlug } = useLocalSearchParams<{ courseSlug: string }>();
  const { token } = useAuth();
  const router = useRouter();
  const [course, setCourse] = useState<FoundationCourse | null>(null);
  const [lessons, setLessons] = useState<FoundationLesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiGet<{
          course: FoundationCourse;
          lessons: FoundationLesson[];
        }>(`/api/foundation/${courseSlug}`, token);
        setCourse(data.course);
        setLessons(data.lessons);
      } catch {
        setCourse(null);
        setLessons([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [courseSlug, token]);

  const handleLessonPress = useCallback(
    (lessonSlug: string) => {
      router.push(`/lesson/${courseSlug}/${lessonSlug}`);
    },
    [router, courseSlug]
  );

  const completedCount = useMemo(
    () => lessons.filter((l) => l.completed).length,
    [lessons]
  );

  const progress =
    lessons.length > 0
      ? Math.round((completedCount / lessons.length) * 100)
      : 0;

  const renderLesson = useCallback(
    ({ item, index }: { item: FoundationLesson; index: number }) => {
      const firstIncomplete = lessons.findIndex((l) => !l.completed);
      const locked = firstIncomplete >= 0 && index > firstIncomplete;

      return (
        <LessonItem
          item={item}
          index={index}
          locked={locked}
          onPress={handleLessonPress}
        />
      );
    },
    [lessons, handleLessonPress]
  );

  const keyExtractor = useCallback(
    (item: FoundationLesson) => item.id,
    []
  );

  const listHeader = useMemo(
    () => (
      <View>
        {course && (
          <View style={styles.courseHeader}>
            <Text style={styles.courseTitle}>{course.title}</Text>
            <Text style={styles.courseDescription}>{course.description}</Text>

            <View style={styles.progressSection}>
              <View style={styles.progressRow}>
                <Text style={styles.progressLabel}>
                  {completedCount} of {lessons.length} completed
                </Text>
                <Text style={styles.progressPercent}>{progress}%</Text>
              </View>
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${progress}%` },
                  ]}
                />
              </View>
            </View>
          </View>
        )}

        <Text style={styles.sectionTitle}>Lessons</Text>
      </View>
    ),
    [course, completedCount, lessons.length, progress]
  );

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: course?.title ?? 'Course',
          headerTitleStyle: {
            fontFamily: 'PlusJakartaSans_600SemiBold',
            fontSize: 17,
          },
          headerTintColor: colors.text.primary,
          headerStyle: { backgroundColor: '#ffffff' },
        }}
      />
      <SafeAreaView edges={['bottom']} style={styles.safe}>
        {loading ? (
          <View style={styles.skeletonContainer}>
            <CourseSkeletonList count={3} />
          </View>
        ) : (
          <FlatList
            data={lessons}
            renderItem={renderLesson}
            keyExtractor={keyExtractor}
            ListHeaderComponent={listHeader}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.empty}>
                <BookOpen size={36} color={colors.text.tertiary} />
                <Text style={styles.emptyText}>No lessons available.</Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg.base,
  },
  courseHeader: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  courseTitle: {
    fontSize: 26,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: colors.text.primary,
  },
  courseDescription: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: colors.text.secondary,
    lineHeight: 22,
    marginTop: 8,
  },
  progressSection: {
    marginTop: 16,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: colors.text.secondary,
  },
  progressPercent: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: colors.accent[500],
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  progressBarFill: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent[400],
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: colors.text.primary,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  skeletonContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  lessonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.md,
    marginBottom: 10,
    backgroundColor: colors.bg.elevated,
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  lessonLocked: {
    opacity: 0.55,
  },
  lessonNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lessonNumberActive: {
    backgroundColor: colors.accent[400] + '20',
  },
  lessonNumberCompleted: {
    backgroundColor: '#22c55e',
  },
  lessonNumberLocked: {
    backgroundColor: '#f3f4f6',
  },
  lessonNumberText: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: colors.accent[600],
  },
  lessonInfo: {
    flex: 1,
    marginLeft: 12,
  },
  lessonTitle: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: colors.text.primary,
  },
  lessonMeta: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: colors.text.tertiary,
    marginTop: 2,
  },
  empty: {
    alignItems: 'center',
    marginTop: 48,
    gap: 10,
  },
  emptyText: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: colors.text.tertiary,
  },
});
