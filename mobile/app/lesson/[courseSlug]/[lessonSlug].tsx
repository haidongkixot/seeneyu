import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Award } from 'lucide-react-native';
import { useAuth } from '@/lib/auth-context';
import { apiGet, apiPost } from '@/lib/api';
import { YouTubeThumbnail } from '@/components/YouTubeThumbnail';
import { QuizCard } from '@/components/QuizCard';
import { CourseSkeletonList } from '@/components/LoadingSkeleton';
import { Button } from '@/components/Button';
import { colors, spacing } from '@/lib/theme';
import { MOCK_LESSONS, type FoundationLesson } from '@/lib/mock-data';

function parseTheoryHtml(html: string): string[] {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?(p|div|h[1-6]|li|ul|ol)[^>]*>/gi, '\n---SPLIT---\n')
    .replace(/<strong>(.*?)<\/strong>/gi, '$1')
    .replace(/<em>(.*?)<\/em>/gi, '$1')
    .replace(/<[^>]+>/g, '')
    .split('---SPLIT---')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export default function LessonViewerScreen() {
  const { courseSlug, lessonSlug } = useLocalSearchParams<{
    courseSlug: string;
    lessonSlug: string;
  }>();
  const { token } = useAuth();
  const router = useRouter();

  const [lesson, setLesson] = useState<FoundationLesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiGet<FoundationLesson>(
          `/api/foundation/${courseSlug}/${lessonSlug}`,
          token
        );
        setLesson(data);
      } catch {
        const lessons = MOCK_LESSONS[courseSlug ?? ''] ?? [];
        setLesson(lessons.find((l) => l.slug === lessonSlug) ?? null);
      } finally {
        setLoading(false);
      }
    })();
  }, [courseSlug, lessonSlug, token]);

  const paragraphs = useMemo(
    () => (lesson ? parseTheoryHtml(lesson.theoryHtml) : []),
    [lesson]
  );

  const questions = lesson?.questions ?? [];
  const totalQuestions = questions.length;

  const handleQuizAnswer = useCallback((isCorrect: boolean) => {
    if (isCorrect) setCorrectCount((c) => c + 1);
  }, []);

  const handleNextQuestion = useCallback(() => {
    if (currentQuestion < totalQuestions - 1) {
      setCurrentQuestion((c) => c + 1);
    } else {
      setQuizFinished(true);
    }
  }, [currentQuestion, totalQuestions]);

  const quizScore =
    totalQuestions > 0
      ? Math.round((correctCount / totalQuestions) * 100)
      : 0;
  const quizPassed = quizScore >= 70;

  const handleSubmitProgress = useCallback(async () => {
    if (!lesson) return;
    setSubmitting(true);
    try {
      await apiPost(
        '/api/foundation/progress',
        { lessonId: lesson.id, quizScore, quizPassed },
        token
      );
      Alert.alert(
        quizPassed ? 'Lesson Complete!' : 'Quiz Submitted',
        quizPassed
          ? `You scored ${quizScore}%. Great work!`
          : `You scored ${quizScore}%. You need 70% to pass. Try again!`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch {
      Alert.alert('Saved locally', `Score: ${quizScore}%`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } finally {
      setSubmitting(false);
    }
  }, [lesson, quizScore, quizPassed, token, router]);

  const handleRetryQuiz = useCallback(() => {
    setQuizStarted(false);
    setCurrentQuestion(0);
    setCorrectCount(0);
    setQuizFinished(false);
  }, []);

  if (loading) {
    return (
      <>
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Lesson',
            headerTitleStyle: {
              fontFamily: 'PlusJakartaSans_600SemiBold',
              fontSize: 17,
            },
            headerTintColor: colors.text.primary,
            headerStyle: { backgroundColor: '#ffffff' },
          }}
        />
        <SafeAreaView edges={['bottom']} style={styles.safe}>
          <View style={styles.skeletonContainer}>
            <CourseSkeletonList count={2} />
          </View>
        </SafeAreaView>
      </>
    );
  }

  if (!lesson) {
    return (
      <>
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Lesson',
            headerTitleStyle: {
              fontFamily: 'PlusJakartaSans_600SemiBold',
              fontSize: 17,
            },
            headerTintColor: colors.text.primary,
            headerStyle: { backgroundColor: '#ffffff' },
          }}
        />
        <SafeAreaView edges={['bottom']} style={styles.safe}>
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Lesson not found.</Text>
          </View>
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: lesson.title,
          headerTitleStyle: {
            fontFamily: 'PlusJakartaSans_600SemiBold',
            fontSize: 17,
          },
          headerTintColor: colors.text.primary,
          headerStyle: { backgroundColor: '#ffffff' },
        }}
      />
      <SafeAreaView edges={['bottom']} style={styles.safe}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Title */}
          <Text style={styles.lessonTitle}>{lesson.title}</Text>

          {/* Theory */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Theory</Text>
            {paragraphs.map((p, i) => (
              <Text key={i} style={styles.paragraph}>
                {p}
              </Text>
            ))}
          </View>

          {/* Video Examples */}
          {lesson.examples.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Video Examples</Text>
              {lesson.examples.map((ex) => (
                <View key={ex.id} style={styles.exampleCard}>
                  <YouTubeThumbnail
                    videoId={ex.youtubeId}
                    startTime={ex.startTime}
                    height={180}
                  />
                  <Text style={styles.exampleTitle}>{ex.title}</Text>
                  <Text style={styles.exampleDescription}>
                    {ex.description}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Quiz */}
          {totalQuestions > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quiz</Text>

              {!quizStarted ? (
                <View style={styles.quizIntro}>
                  <Text style={styles.quizIntroText}>
                    Test your understanding with {totalQuestions} question
                    {totalQuestions !== 1 ? 's' : ''}. You need 70% to pass.
                  </Text>
                  <Button
                    title="Start Quiz"
                    onPress={() => setQuizStarted(true)}
                  />
                </View>
              ) : quizFinished ? (
                <View style={styles.quizResult}>
                  <Award
                    size={48}
                    color={quizPassed ? '#22c55e' : colors.accent[500]}
                  />
                  <Text style={styles.quizScoreText}>{quizScore}%</Text>
                  <Text style={styles.quizResultLabel}>
                    {correctCount} of {totalQuestions} correct
                  </Text>
                  <Text
                    style={[
                      styles.quizResultStatus,
                      { color: quizPassed ? '#15803d' : '#b91c1c' },
                    ]}
                  >
                    {quizPassed ? 'Passed!' : 'Not passed \u2014 try again'}
                  </Text>
                  <View style={styles.quizActions}>
                    <Button
                      title="Save & Continue"
                      onPress={handleSubmitProgress}
                      loading={submitting}
                    />
                    {!quizPassed && (
                      <Button
                        title="Retry Quiz"
                        variant="secondary"
                        onPress={handleRetryQuiz}
                      />
                    )}
                  </View>
                </View>
              ) : (
                <View>
                  <QuizCard
                    key={questions[currentQuestion].id}
                    questionNumber={currentQuestion + 1}
                    totalQuestions={totalQuestions}
                    question={questions[currentQuestion].question}
                    options={questions[currentQuestion].options}
                    correctIndex={questions[currentQuestion].correctIndex}
                    explanation={questions[currentQuestion].explanation}
                    onAnswer={handleQuizAnswer}
                  />
                  <View style={styles.nextButtonContainer}>
                    <Button
                      title={
                        currentQuestion < totalQuestions - 1
                          ? 'Next Question'
                          : 'Finish Quiz'
                      }
                      onPress={handleNextQuestion}
                    />
                  </View>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg.base,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: 40,
  },
  lessonTitle: {
    fontSize: 24,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: colors.text.primary,
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: colors.text.primary,
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: colors.text.secondary,
    lineHeight: 23,
    marginBottom: 12,
  },
  exampleCard: {
    marginBottom: 16,
    gap: 8,
  },
  exampleTitle: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: colors.text.primary,
  },
  exampleDescription: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: colors.text.secondary,
    lineHeight: 20,
  },
  quizIntro: {
    backgroundColor: colors.bg.surface,
    borderRadius: 16,
    padding: 20,
    gap: 16,
    alignItems: 'center',
  },
  quizIntroText: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  quizResult: {
    backgroundColor: colors.bg.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  quizScoreText: {
    fontSize: 40,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: colors.text.primary,
  },
  quizResultLabel: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: colors.text.secondary,
  },
  quizResultStatus: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_700Bold',
    marginTop: 4,
  },
  quizActions: {
    marginTop: 16,
    gap: 10,
    width: '100%',
  },
  nextButtonContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: 8,
  },
  skeletonContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  empty: {
    alignItems: 'center',
    marginTop: 48,
  },
  emptyText: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: colors.text.tertiary,
  },
});
