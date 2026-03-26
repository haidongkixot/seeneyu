import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Camera, Mic, CheckCircle, XCircle, Award, ArrowRight } from 'lucide-react-native';
import { useAuth } from '@/lib/auth-context';
import { apiGet } from '@/lib/api';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { colors } from '@/lib/theme';

type Challenge = {
  id: string;
  type: string;
  title: string;
  description?: string;
  context?: string;
  difficulty?: string;
  xpReward?: number;
};

type ChallengeState = 'intro' | 'active' | 'scoring' | 'result';

export default function ChallengeScreen() {
  const { bundleId, challengeId } = useLocalSearchParams<{
    bundleId: string;
    challengeId: string;
  }>();
  const { token } = useAuth();
  const router = useRouter();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<ChallengeState>('intro');
  const [score, setScore] = useState(0);
  const [captured, setCaptured] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const cameraRef = { current: null as any };

  const fetchChallenge = useCallback(async () => {
    try {
      const data = await apiGet<{ bundles: any[] }>('/api/arcade', token);
      const bundles = data?.bundles ?? [];
      const bundle = bundles.find((b: any) => b.id === bundleId);
      const found = bundle?.challenges?.find((c: any) => c.id === challengeId);
      setChallenge(found ?? null);
    } catch (err: any) {
      console.error('[Challenge] Error:', err?.message);
    } finally {
      setLoading(false);
    }
  }, [bundleId, challengeId, token]);

  useEffect(() => {
    fetchChallenge();
  }, [fetchChallenge]);

  const handleStart = useCallback(async () => {
    if (challenge?.type === 'facial' || challenge?.type === 'expression') {
      if (!cameraPermission?.granted) {
        const result = await requestCameraPermission();
        if (!result.granted) {
          Alert.alert('Camera Required', 'This challenge needs camera access to capture your expression.');
          return;
        }
      }
    }
    setState('active');
  }, [challenge, cameraPermission, requestCameraPermission]);

  const handleCapture = useCallback(() => {
    setCaptured(true);
    setState('scoring');
    // Simulate AI scoring
    setTimeout(() => {
      const randomScore = Math.floor(Math.random() * 40) + 60;
      setScore(randomScore);
      setState('result');
    }, 2000);
  }, []);

  const handleSubmitScenario = useCallback((optionIndex: number) => {
    setState('scoring');
    setTimeout(() => {
      const randomScore = optionIndex === 0 ? 85 : optionIndex === 1 ? 70 : 55;
      setScore(randomScore);
      setState('result');
    }, 1500);
  }, []);

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: true, title: 'Loading...', headerTitleStyle: { fontFamily: 'PlusJakartaSans_600SemiBold' }, headerTintColor: colors.text.primary, headerStyle: { backgroundColor: '#fff' } }} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
          <ActivityIndicator size="large" color={colors.accent[400]} />
        </View>
      </>
    );
  }

  if (!challenge) {
    return (
      <>
        <Stack.Screen options={{ headerShown: true, title: 'Not Found', headerTitleStyle: { fontFamily: 'PlusJakartaSans_600SemiBold' }, headerTintColor: colors.text.primary, headerStyle: { backgroundColor: '#fff' } }} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
          <Text style={{ fontSize: 16, color: colors.text.secondary, fontFamily: 'PlusJakartaSans_500Medium' }}>Challenge not found</Text>
        </View>
      </>
    );
  }

  const isExpression = challenge.type === 'facial' || challenge.type === 'expression';
  const isVocal = challenge.type === 'vocal';

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: challenge.title,
          headerTitleStyle: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 17 },
          headerTintColor: colors.text.primary,
          headerStyle: { backgroundColor: '#ffffff' },
        }}
      />
      <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: '#ffffff' }}>

        {/* INTRO STATE */}
        {state === 'intro' && (
          <ScrollView contentContainerStyle={{ padding: 20, flex: 1 }}>
            <View style={{ alignItems: 'center', marginTop: 20, marginBottom: 30 }}>
              <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: `${colors.accent[400]}15`, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                {isExpression ? <Camera size={36} color={colors.accent[500]} /> : isVocal ? <Mic size={36} color={colors.accent[500]} /> : <Award size={36} color={colors.accent[500]} />}
              </View>
              <Text style={{ fontSize: 22, fontFamily: 'PlusJakartaSans_700Bold', color: colors.text.primary, textAlign: 'center' }}>
                {challenge.title}
              </Text>
              {challenge.xpReward ? (
                <Text style={{ fontSize: 14, fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.accent[500], marginTop: 6 }}>
                  +{challenge.xpReward} XP
                </Text>
              ) : null}
            </View>

            {challenge.description ? (
              <Card style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 15, fontFamily: 'PlusJakartaSans_400Regular', color: colors.text.secondary, lineHeight: 22 }}>
                  {challenge.description}
                </Text>
              </Card>
            ) : null}

            {challenge.context ? (
              <Card style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.accent[500], textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Context</Text>
                <Text style={{ fontSize: 14, fontFamily: 'PlusJakartaSans_400Regular', color: colors.text.secondary, lineHeight: 20 }}>
                  {challenge.context}
                </Text>
              </Card>
            ) : null}

            <View style={{ flex: 1 }} />
            <Button title="Start Challenge" onPress={handleStart} style={{ marginTop: 20 }} />
          </ScrollView>
        )}

        {/* ACTIVE STATE — Expression/Facial */}
        {state === 'active' && isExpression && (
          <View style={{ flex: 1 }}>
            <View style={{ padding: 16, backgroundColor: '#f9f9f9', borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.06)' }}>
              <Text style={{ fontSize: 16, fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.text.primary, textAlign: 'center' }}>
                {challenge.description || challenge.title}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <CameraView style={{ flex: 1 }} facing="front" ref={(ref: any) => { cameraRef.current = ref; }} />
            </View>
            <View style={{ padding: 20, alignItems: 'center' }}>
              <TouchableOpacity
                onPress={handleCapture}
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 36,
                  borderWidth: 4,
                  borderColor: '#ef4444',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#ef4444' }} />
              </TouchableOpacity>
              <Text style={{ fontSize: 13, color: colors.text.tertiary, marginTop: 8, fontFamily: 'PlusJakartaSans_500Medium' }}>
                Tap to capture your expression
              </Text>
            </View>
          </View>
        )}

        {/* ACTIVE STATE — Vocal */}
        {state === 'active' && isVocal && (
          <View style={{ flex: 1, padding: 20 }}>
            <Card style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 16, fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.text.primary, textAlign: 'center' }}>
                {challenge.description || challenge.title}
              </Text>
            </Card>
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <TouchableOpacity
                onPress={handleCapture}
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 50,
                  backgroundColor: '#ef444420',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Mic size={40} color="#ef4444" />
              </TouchableOpacity>
              <Text style={{ fontSize: 14, color: colors.text.secondary, marginTop: 12, fontFamily: 'PlusJakartaSans_500Medium' }}>
                Tap to record your voice
              </Text>
            </View>
          </View>
        )}

        {/* ACTIVE STATE — Scenario */}
        {state === 'active' && !isExpression && !isVocal && (
          <ScrollView contentContainerStyle={{ padding: 20 }}>
            <Card style={{ marginBottom: 24 }}>
              <Text style={{ fontSize: 16, fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.text.primary, marginBottom: 8 }}>
                Scenario
              </Text>
              <Text style={{ fontSize: 15, fontFamily: 'PlusJakartaSans_400Regular', color: colors.text.secondary, lineHeight: 22 }}>
                {challenge.context || challenge.description || 'How would you handle this situation?'}
              </Text>
            </Card>
            <Text style={{ fontSize: 14, fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.text.tertiary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
              Choose your approach:
            </Text>
            {['Confident and direct approach', 'Empathetic and supportive approach', 'Analytical and measured approach'].map((option, i) => (
              <TouchableOpacity key={i} onPress={() => handleSubmitScenario(i)} activeOpacity={0.7} style={{ marginBottom: 10 }}>
                <Card>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: `${colors.accent[400]}15`, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', color: colors.accent[500] }}>{String.fromCharCode(65 + i)}</Text>
                    </View>
                    <Text style={{ flex: 1, fontSize: 15, fontFamily: 'PlusJakartaSans_500Medium', color: colors.text.primary }}>
                      {option}
                    </Text>
                    <ArrowRight size={16} color={colors.text.tertiary} />
                  </View>
                </Card>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* SCORING STATE */}
        {state === 'scoring' && (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color={colors.accent[400]} />
            <Text style={{ fontSize: 16, fontFamily: 'PlusJakartaSans_500Medium', color: colors.text.secondary, marginTop: 16 }}>
              Evaluating your performance...
            </Text>
          </View>
        )}

        {/* RESULT STATE */}
        {state === 'result' && (
          <ScrollView contentContainerStyle={{ padding: 20, alignItems: 'center' }}>
            <View style={{ marginTop: 30, marginBottom: 30, alignItems: 'center' }}>
              {score >= 70 ? (
                <CheckCircle size={64} color="#22c55e" />
              ) : (
                <XCircle size={64} color="#f59e0b" />
              )}
              <Text style={{ fontSize: 48, fontFamily: 'PlusJakartaSans_700Bold', color: colors.text.primary, marginTop: 16 }}>
                {score}
              </Text>
              <Text style={{ fontSize: 16, fontFamily: 'PlusJakartaSans_500Medium', color: colors.text.secondary }}>
                out of 100
              </Text>
              <Text style={{ fontSize: 18, fontFamily: 'PlusJakartaSans_600SemiBold', color: score >= 70 ? '#22c55e' : '#f59e0b', marginTop: 8 }}>
                {score >= 85 ? 'Excellent!' : score >= 70 ? 'Great job!' : score >= 55 ? 'Good effort!' : 'Keep practicing!'}
              </Text>
              {challenge.xpReward ? (
                <Text style={{ fontSize: 14, fontFamily: 'PlusJakartaSans_600SemiBold', color: colors.accent[500], marginTop: 8 }}>
                  +{Math.round(challenge.xpReward * score / 100)} XP earned
                </Text>
              ) : null}
            </View>

            <View style={{ width: '100%', gap: 12 }}>
              <Button
                title="Try Again"
                onPress={() => { setState('intro'); setScore(0); setCaptured(false); }}
              />
              <Button
                title="Back to Bundle"
                variant="secondary"
                onPress={() => router.back()}
              />
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </>
  );
}
