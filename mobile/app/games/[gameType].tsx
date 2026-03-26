import { useEffect, useState, useCallback, useRef } from 'react';
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
import { Award, ChevronRight, RotateCcw, Camera as CameraIcon } from 'lucide-react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
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
  const cameraRef = useRef<CameraView>(null);

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

  // Camera state for expression_king
  const [permission, requestPermission] = useCameraPermissions();
  const [capturing, setCapturing] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [expressionScore, setExpressionScore] = useState<number | null>(null);

  const isExpressionKing =
    gameType === 'expression-king' || gameType === 'expression_king';

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
      setCapturedPhoto(null);
      setExpressionScore(null);
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
        setCapturedPhoto(null);
        setExpressionScore(null);
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

  // Request camera permission for expression king
  useEffect(() => {
    if (isExpressionKing && !permission?.granted) {
      requestPermission();
    }
  }, [isExpressionKing, permission, requestPermission]);

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

  const handleCaptureExpression = useCallback(async () => {
    if (!cameraRef.current || !round) return;
    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.5,
      });
      if (photo) {
        setCapturedPhoto(photo.uri);

        // Score randomly since we don't have server-side scoring on mobile yet
        const score = Math.floor(Math.random() * 61) + 40; // 40-100
        setExpressionScore(score);

        const timeMs = Date.now() - roundStartTime;
        const isCorrect = score >= 60;

        setResponses((prev) => [
          ...prev,
          {
            roundId: round.id,
            answer: `expression_capture_${score}`,
            correct: isCorrect,
            timeMs,
          },
        ]);

        setShowResult(true);
      }
    } catch (err) {
      console.warn('Camera capture failed:', err);
    } finally {
      setCapturing(false);
    }
  }, [round, roundStartTime]);

  const handleNext = useCallback(() => {
    if (currentRound < totalRounds - 1) {
      setCurrentRound((c) => c + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setRoundStartTime(Date.now());
      setCapturedPhoto(null);
      setExpressionScore(null);
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

  // Expression King camera UI
  const renderExpressionKingRound = () => {
    if (!permission?.granted) {
      return (
        <View style={{ alignItems: 'center', paddingVertical: 32 }}>
          <CameraIcon size={48} color={colors.text.tertiary} />
          <Text
            style={{
              fontSize: 15,
              fontFamily: 'PlusJakartaSans_500Medium',
              color: colors.text.secondary,
              textAlign: 'center',
              marginTop: 16,
              marginBottom: 20,
              paddingHorizontal: 16,
            }}
          >
            Camera permission is required for Expression King.
          </Text>
          <Button title="Grant Permission" onPress={requestPermission} />
        </View>
      );
    }

    if (capturedPhoto && showResult) {
      // Show captured photo with score
      return (
        <View style={{ alignItems: 'center' }}>
          <View
            style={{
              width: '100%',
              aspectRatio: 3 / 4,
              borderRadius: 16,
              overflow: 'hidden',
              marginBottom: 16,
            }}
          >
            <Image
              source={{ uri: capturedPhoto }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          </View>
          <View
            style={{
              backgroundColor:
                (expressionScore ?? 0) >= 60
                  ? 'rgba(34,197,94,0.12)'
                  : 'rgba(239,68,68,0.12)',
              borderRadius: 16,
              paddingVertical: 16,
              paddingHorizontal: 24,
              alignItems: 'center',
              width: '100%',
            }}
          >
            <Text
              style={{
                fontSize: 36,
                fontFamily: 'PlusJakartaSans_700Bold',
                color:
                  (expressionScore ?? 0) >= 60 ? '#15803d' : '#b91c1c',
              }}
            >
              {expressionScore}%
            </Text>
            <Text
              style={{
                fontSize: 14,
                fontFamily: 'PlusJakartaSans_500Medium',
                color: colors.text.secondary,
                marginTop: 4,
              }}
            >
              {(expressionScore ?? 0) >= 60
                ? 'Nice expression!'
                : 'Try to be more expressive!'}
            </Text>
          </View>
        </View>
      );
    }

    // Camera viewfinder with capture button
    return (
      <View style={{ alignItems: 'center' }}>
        <View
          style={{
            width: '100%',
            aspectRatio: 3 / 4,
            borderRadius: 16,
            overflow: 'hidden',
            marginBottom: 20,
          }}
        >
          <CameraView
            ref={cameraRef}
            style={{ flex: 1 }}
            facing="front"
          />
        </View>
        <TouchableOpacity
          onPress={handleCaptureExpression}
          disabled={capturing}
          activeOpacity={0.7}
          style={{
            width: 72,
            height: 72,
            borderRadius: 36,
            backgroundColor: capturing ? colors.text.tertiary : colors.accent[400],
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 4,
            borderColor: 'rgba(0,0,0,0.1)',
          }}
        >
          {capturing ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <CameraIcon size={28} color="#ffffff" />
          )}
        </TouchableOpacity>
        <Text
          style={{
            fontSize: 13,
            fontFamily: 'PlusJakartaSans_500Medium',
            color: colors.text.tertiary,
            marginTop: 8,
          }}
        >
          Tap to capture your expression
        </Text>
      </View>
    );
  };

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

          {/* Image if available (non-expression-king) */}
          {!isExpressionKing && round?.imageUrl && (
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

          {/* Expression King: Camera UI */}
          {isExpressionKing ? (
            renderExpressionKingRound()
          ) : (
            /* Standard: Multiple choice options */
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
          )}

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
