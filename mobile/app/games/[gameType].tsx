import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Award, ChevronRight, RotateCcw } from 'lucide-react-native';
import { useAuth } from '@/lib/auth-context';
import { apiGet, apiPost } from '@/lib/api';
import { Button } from '@/components/Button';
import { colors, spacing } from '@/lib/theme';

type GameRound = {
  id: string;
  orderIndex: number;
  prompt: string;
  imageUrl?: string | null;
  correctAnswer?: string | null;
  options?: string[] | null;
};

type GameData = {
  game: {
    id: string;
    type: string;
    title: string;
    description: string;
    config: {
      timePerRound?: number;
      totalRounds?: number;
      passingScore?: number;
    };
  };
  sessionId: string;
  rounds: GameRound[];
};

type RoundResponse = {
  roundId: string;
  answer: string;
  correct: boolean;
  timeMs: number;
};

export default function GameScreen() {
  const { gameType } = useLocalSearchParams<{ gameType: string }>();
  const { token } = useAuth();
  const router = useRouter();

  const [gameData, setGameData] = useState<GameData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Game state
  const [currentRound, setCurrentRound] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [responses, setResponses] = useState<RoundResponse[]>([]);
  const [roundStartTime, setRoundStartTime] = useState(Date.now());
  const [gameFinished, setGameFinished] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchGame = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // API uses underscores in type names
      const apiType = (gameType ?? '').replace(/-/g, '_');
      const data = await apiGet<GameData>(`/api/public/games/${apiType}`, token);
      setGameData(data);
      setCurrentRound(0);
      setResponses([]);
      setGameFinished(false);
      setSelectedAnswer(null);
      setShowResult(false);
      setRoundStartTime(Date.now());
    } catch (err: any) {
      // Try with the original type (dashes)
      try {
        const data = await apiGet<GameData>(`/api/public/games/${gameType}`, token);
        setGameData(data);
        setCurrentRound(0);
        setResponses([]);
        setGameFinished(false);
        setSelectedAnswer(null);
        setShowResult(false);
        setRoundStartTime(Date.now());
      } catch {
        setError('Could not load game. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  }, [gameType, token]);

  useEffect(() => {
    fetchGame();
  }, [fetchGame]);

  const rounds = gameData?.rounds ?? [];
  const totalRounds = rounds.length;
  const round = rounds[currentRound];

  const handleSelectAnswer = useCallback(
    (answer: string) => {
      if (showResult || !round) return;
      setSelectedAnswer(answer);
      setShowResult(true);

      const isCorrect =
        round.correctAnswer != null
          ? answer === round.correctAnswer
          : false;
      const timeMs = Date.now() - roundStartTime;

      setResponses((prev) => [
        ...prev,
        {
          roundId: round.id,
          answer,
          correct: isCorrect,
          timeMs,
        },
      ]);
    },
    [showResult, round, roundStartTime]
  );

  const handleNext = useCallback(() => {
    if (currentRound < totalRounds - 1) {
      setCurrentRound((c) => c + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setRoundStartTime(Date.now());
    } else {
      setGameFinished(true);
    }
  }, [currentRound, totalRounds]);

  const correctCount = responses.filter((r) => r.correct).length;
  const score =
    totalRounds > 0 ? Math.round((correctCount / totalRounds) * 100) : 0;
  const passingScore = gameData?.game?.config?.passingScore ?? 70;
  const passed = score >= passingScore;

  const handleSubmitScore = useCallback(async () => {
    if (!gameData) return;
    setSubmitting(true);
    try {
      await apiPost(
        `/api/public/games/${gameData.game.type}/submit`,
        {
          sessionId: gameData.sessionId,
          score: correctCount,
          totalRounds,
          responses,
        },
        token
      );
    } catch {
      // Score submission may fail silently
    } finally {
      setSubmitting(false);
      router.back();
    }
  }, [gameData, correctCount, totalRounds, responses, token, router]);

  const gameTitle =
    gameData?.game?.title ??
    (gameType ?? '')
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());

  if (loading) {
    return (
      <>
        <Stack.Screen
          options={{
            headerShown: true,
            title: gameTitle,
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
          style={{
            flex: 1,
            backgroundColor: '#ffffff',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ActivityIndicator color={colors.accent[400]} size="large" />
          <Text
            style={{
              marginTop: 16,
              fontSize: 14,
              fontFamily: 'PlusJakartaSans_500Medium',
              color: colors.text.secondary,
            }}
          >
            Loading game...
          </Text>
        </SafeAreaView>
      </>
    );
  }

  if (error || !gameData || rounds.length === 0) {
    return (
      <>
        <Stack.Screen
          options={{
            headerShown: true,
            title: gameTitle,
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
          style={{
            flex: 1,
            backgroundColor: '#ffffff',
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 32,
          }}
        >
          <Text
            style={{
              fontSize: 16,
              fontFamily: 'PlusJakartaSans_500Medium',
              color: colors.text.secondary,
              textAlign: 'center',
              marginBottom: 20,
            }}
          >
            {error || 'No rounds available for this game yet.'}
          </Text>
          <Button title="Go Back" onPress={() => router.back()} />
        </SafeAreaView>
      </>
    );
  }

  // Game finished — show results
  if (gameFinished) {
    return (
      <>
        <Stack.Screen
          options={{
            headerShown: true,
            title: gameTitle,
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
          <ScrollView
            contentContainerStyle={{
              alignItems: 'center',
              paddingTop: 48,
              paddingHorizontal: 32,
              paddingBottom: 40,
            }}
          >
            <Award
              size={56}
              color={passed ? '#22c55e' : colors.accent[500]}
            />
            <Text
              style={{
                fontSize: 48,
                fontFamily: 'PlusJakartaSans_700Bold',
                color: colors.text.primary,
                marginTop: 16,
              }}
            >
              {score}%
            </Text>
            <Text
              style={{
                fontSize: 16,
                fontFamily: 'PlusJakartaSans_500Medium',
                color: colors.text.secondary,
                marginTop: 4,
              }}
            >
              {correctCount} of {totalRounds} correct
            </Text>
            <Text
              style={{
                fontSize: 18,
                fontFamily: 'PlusJakartaSans_700Bold',
                color: passed ? '#15803d' : '#b91c1c',
                marginTop: 12,
              }}
            >
              {passed ? 'Great job!' : 'Keep practicing!'}
            </Text>

            <View style={{ marginTop: 32, width: '100%', gap: 12 }}>
              <Button
                title="Save & Exit"
                onPress={handleSubmitScore}
                loading={submitting}
              />
              <TouchableOpacity
                onPress={fetchGame}
                activeOpacity={0.7}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  paddingVertical: 14,
                }}
              >
                <RotateCcw size={18} color={colors.accent[500]} />
                <Text
                  style={{
                    fontSize: 15,
                    fontFamily: 'PlusJakartaSans_600SemiBold',
                    color: colors.accent[500],
                  }}
                >
                  Play Again
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </>
    );
  }

  // Active round
  const options = round?.options ?? [];
  const isCorrectAnswer = (opt: string) =>
    round?.correctAnswer != null && opt === round.correctAnswer;

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: gameTitle,
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
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: 40,
          }}
        >
          {/* Progress indicator */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: 12,
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontFamily: 'PlusJakartaSans_600SemiBold',
                color: colors.text.tertiary,
              }}
            >
              Round {currentRound + 1} of {totalRounds}
            </Text>
            <Text
              style={{
                fontSize: 13,
                fontFamily: 'PlusJakartaSans_600SemiBold',
                color: colors.accent[500],
              }}
            >
              {responses.filter((r) => r.correct).length} correct
            </Text>
          </View>

          {/* Progress bar */}
          <View
            style={{
              height: 4,
              borderRadius: 2,
              backgroundColor: 'rgba(0,0,0,0.06)',
              marginBottom: 20,
            }}
          >
            <View
              style={{
                height: 4,
                borderRadius: 2,
                backgroundColor: colors.accent[400],
                width: `${((currentRound + 1) / totalRounds) * 100}%`,
              }}
            />
          </View>

          {/* Image if available */}
          {round?.imageUrl && (
            <View
              style={{
                borderRadius: 16,
                overflow: 'hidden',
                marginBottom: 20,
                backgroundColor: 'rgba(0,0,0,0.04)',
              }}
            >
              <Image
                source={{ uri: round.imageUrl }}
                style={{ width: '100%', height: 220 }}
                resizeMode="contain"
              />
            </View>
          )}

          {/* Prompt */}
          <Text
            style={{
              fontSize: 20,
              fontFamily: 'PlusJakartaSans_700Bold',
              color: colors.text.primary,
              marginBottom: 24,
              lineHeight: 28,
            }}
          >
            {round?.prompt}
          </Text>

          {/* Options */}
          <View style={{ gap: 10 }}>
            {options.map((option, index) => {
              const isSelected = selectedAnswer === option;
              const isCorrect = isCorrectAnswer(option);
              let bgColor = 'rgba(0,0,0,0.03)';
              let borderColor = 'rgba(0,0,0,0.08)';
              let textColor = colors.text.primary;

              if (showResult) {
                if (isCorrect) {
                  bgColor = 'rgba(34,197,94,0.12)';
                  borderColor = '#22c55e';
                  textColor = '#15803d';
                } else if (isSelected && !isCorrect) {
                  bgColor = 'rgba(239,68,68,0.12)';
                  borderColor = '#ef4444';
                  textColor = '#b91c1c';
                }
              } else if (isSelected) {
                bgColor = `${colors.accent[400]}15`;
                borderColor = colors.accent[400];
              }

              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleSelectAnswer(option)}
                  activeOpacity={showResult ? 1 : 0.7}
                  style={{
                    backgroundColor: bgColor,
                    borderWidth: 1.5,
                    borderColor,
                    borderRadius: 14,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 15,
                      fontFamily: 'PlusJakartaSans_500Medium',
                      color: textColor,
                      lineHeight: 22,
                    }}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Next button */}
          {showResult && (
            <View style={{ marginTop: 24 }}>
              <TouchableOpacity
                onPress={handleNext}
                activeOpacity={0.7}
                style={{
                  backgroundColor: colors.accent[400],
                  borderRadius: 14,
                  paddingVertical: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontFamily: 'PlusJakartaSans_600SemiBold',
                    color: '#ffffff',
                  }}
                >
                  {currentRound < totalRounds - 1
                    ? 'Next Round'
                    : 'See Results'}
                </Text>
                <ChevronRight size={18} color="#ffffff" />
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
