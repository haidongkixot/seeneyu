import React, { useState, useRef, useEffect } from 'react';
import { View, TouchableOpacity, Text, Animated } from 'react-native';
import { Audio } from 'expo-av';
import { Mic, Square } from 'lucide-react-native';
import { colors } from '@/lib/theme';

type Props = {
  onRecordingComplete: (base64Audio: string) => void;
  disabled?: boolean;
};

export function VoiceInput({ onRecordingComplete, disabled }: Props) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isRecording) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording]);

  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  async function startRecording() {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) return;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
      setIsRecording(true);
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    } catch (err) {
      console.error('Failed to start recording:', err);
    }
  }

  async function stopRecording() {
    if (!recordingRef.current) return;

    try {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setIsRecording(false);

      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      if (uri) {
        // Read file as base64
        const response = await fetch(uri);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          if (base64) {
            onRecordingComplete(base64);
          }
        };
        reader.readAsDataURL(blob);
      }
    } catch (err) {
      console.error('Failed to stop recording:', err);
    }
  }

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      {isRecording && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 4,
            gap: 6,
          }}
        >
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: colors.status.error,
            }}
          />
          <Text
            style={{
              fontSize: 12,
              fontFamily: 'PlusJakartaSans_600SemiBold',
              color: colors.status.error,
            }}
          >
            {formatTime(duration)}
          </Text>
        </View>
      )}

      <Animated.View style={{ transform: [{ scale: isRecording ? pulseAnim : 1 }] }}>
        <TouchableOpacity
          onPress={isRecording ? stopRecording : startRecording}
          disabled={disabled}
          activeOpacity={0.7}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: isRecording ? colors.status.error : colors.bg.surface,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: disabled ? 0.4 : 1,
          }}
        >
          {isRecording ? (
            <Square size={16} color="#ffffff" fill="#ffffff" />
          ) : (
            <Mic size={20} color={colors.text.secondary} />
          )}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}
