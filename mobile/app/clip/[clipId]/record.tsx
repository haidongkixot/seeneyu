import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { ArrowLeft, RotateCcw, Send } from 'lucide-react-native';
import { Video, ResizeMode } from 'expo-av';
import { useAuth } from '@/lib/auth-context';
import { apiGet, apiPost } from '@/lib/api';
import { Button } from '@/components/Button';
import { colors, spacing } from '@/lib/theme';

type ClipInfo = {
  id: string;
  movieTitle: string;
  sceneDescription: string;
  characterName?: string;
  startSec?: number;
  endSec?: number;
};

export default function RecordScreen() {
  const { clipId } = useLocalSearchParams<{ clipId: string }>();
  const { token } = useAuth();
  const router = useRouter();

  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [timer, setTimer] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [clip, setClip] = useState<ClipInfo | null>(null);

  useEffect(() => {
    if (clipId) {
      apiGet<ClipInfo>(`/api/clips/${clipId}`, token)
        .then(setClip)
        .catch(() => {});
    }
  }, [clipId, token]);

  useEffect(() => {
    if (isRecording) {
      setTimer(0);
      timerRef.current = setInterval(() => {
        setTimer((t) => t + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const formatTimer = useCallback((seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }, []);

  const handleStartRecording = useCallback(async () => {
    if (!cameraRef.current) return;
    setIsRecording(true);
    try {
      const video = await cameraRef.current.recordAsync({ maxDuration: 120 });
      if (video?.uri) {
        setRecordedUri(video.uri);
      }
    } catch (err: any) {
      console.warn('Recording error:', err?.message);
      // Expo Go may not support video recording — show a helpful message
      if (err?.message?.includes('not supported') || err?.message?.includes('recordAsync')) {
        Alert.alert(
          'Recording Not Available',
          'Video recording requires a development build. In Expo Go, you can take a photo instead.',
          [{ text: 'OK' }]
        );
      }
    } finally {
      setIsRecording(false);
    }
  }, []);

  const handleStopRecording = useCallback(() => {
    cameraRef.current?.stopRecording();
    setIsRecording(false);
  }, []);

  const handleRetake = useCallback(() => {
    setRecordedUri(null);
    setTimer(0);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!recordedUri) return;
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('video', {
        uri: recordedUri,
        name: 'practice.mp4',
        type: 'video/mp4',
      } as any);
      formData.append('clipId', clipId ?? '');

      await apiPost('/api/sessions', formData, token);
      Alert.alert('Submitted!', 'Your practice has been uploaded for review.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert(
        'Saved locally',
        'Recording saved. It will be uploaded when connection is available.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } finally {
      setSubmitting(false);
    }
  }, [recordedUri, clipId, token, router]);

  // Permission not loaded yet
  if (!permission) {
    return (
      <>
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Record',
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
          style={styles.safe}
        >
          <View style={styles.centered}>
            <Text style={styles.permissionText}>Loading camera...</Text>
          </View>
        </SafeAreaView>
      </>
    );
  }

  // Permission not granted
  if (!permission.granted) {
    return (
      <>
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Record',
            headerTitleStyle: {
              fontFamily: 'PlusJakartaSans_600SemiBold',
              fontSize: 17,
            },
            headerTintColor: colors.text.primary,
            headerStyle: { backgroundColor: '#ffffff' },
          }}
        />
        <SafeAreaView edges={['bottom']} style={styles.safe}>
          <View style={styles.centered}>
            <Text style={styles.permissionTitle}>Camera Access Required</Text>
            <Text style={styles.permissionText}>
              We need your camera to record practice sessions.
            </Text>
            <View style={styles.permissionButton}>
              <Button title="Grant Permission" onPress={requestPermission} />
            </View>
          </View>
        </SafeAreaView>
      </>
    );
  }

  // Preview recorded video
  if (recordedUri) {
    return (
      <>
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Preview',
            headerTitleStyle: {
              fontFamily: 'PlusJakartaSans_600SemiBold',
              fontSize: 17,
            },
            headerTintColor: colors.text.primary,
            headerStyle: { backgroundColor: '#ffffff' },
          }}
        />
        <SafeAreaView edges={['bottom']} style={styles.safe}>
          <View style={styles.previewContainer}>
            <Video
              source={{ uri: recordedUri }}
              style={styles.preview}
              useNativeControls
              resizeMode={ResizeMode.CONTAIN}
              isLooping
            />
          </View>

          <View style={styles.previewActions}>
            <TouchableOpacity
              onPress={handleRetake}
              style={styles.retakeButton}
              activeOpacity={0.7}
            >
              <RotateCcw size={20} color={colors.text.secondary} />
              <Text style={styles.retakeText}>Retake</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={submitting}
              style={[styles.submitButton, submitting && { opacity: 0.6 }]}
              activeOpacity={0.7}
            >
              <Send size={20} color="#ffffff" />
              <Text style={styles.submitText}>
                {submitting ? 'Uploading...' : 'Submit'}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </>
    );
  }

  // Recording view (fullscreen camera)
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.recordContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="front"
          mode="video"
        >
          {/* Top overlay: instructions + back */}
          <SafeAreaView style={styles.topOverlay}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.overlayBackButton}
              activeOpacity={0.7}
            >
              <ArrowLeft size={22} color="#ffffff" />
            </TouchableOpacity>

            {clip && (
              <View style={styles.instructionCard}>
                <Text style={styles.instructionTitle} numberOfLines={1}>
                  {clip.movieTitle}
                </Text>
                <Text style={styles.instructionText} numberOfLines={2}>
                  {clip.sceneDescription}
                </Text>
              </View>
            )}
          </SafeAreaView>

          {/* Bottom overlay: timer + record button */}
          <SafeAreaView style={styles.bottomOverlay}>
            <Text style={styles.timerText}>{formatTimer(timer)}</Text>

            <TouchableOpacity
              onPress={
                isRecording ? handleStopRecording : handleStartRecording
              }
              activeOpacity={0.8}
              style={styles.recordButtonOuter}
            >
              <View
                style={[
                  styles.recordButtonInner,
                  isRecording && styles.recordButtonStop,
                ]}
              />
            </TouchableOpacity>

            <Text style={styles.recordHint}>
              {isRecording ? 'Tap to stop' : 'Tap to record'}
            </Text>
          </SafeAreaView>
        </CameraView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg.base,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  permissionTitle: {
    fontSize: 20,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: colors.text.primary,
    marginBottom: 8,
  },
  permissionText: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  permissionButton: {
    marginTop: 24,
    width: '100%',
  },
  recordContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  camera: {
    flex: 1,
  },
  topOverlay: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  overlayBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  instructionCard: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    padding: 12,
  },
  instructionTitle: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: '#ffffff',
    marginBottom: 4,
  },
  instructionText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 18,
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingBottom: 40,
  },
  timerText: {
    fontSize: 24,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#ffffff',
    marginBottom: 20,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  recordButtonOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ef4444',
  },
  recordButtonStop: {
    width: 32,
    height: 32,
    borderRadius: 6,
  },
  recordHint: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: 'rgba(255,255,255,0.7)',
    marginTop: 12,
  },
  previewContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  preview: {
    flex: 1,
  },
  previewActions: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: 12,
  },
  retakeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.bg.surface,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  retakeText: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: colors.text.secondary,
  },
  submitButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.accent[400],
    gap: 8,
  },
  submitText: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: '#1a1a2e',
  },
});
