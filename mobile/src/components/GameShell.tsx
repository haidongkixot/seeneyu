import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { TimerBar } from './TimerBar';
import { colors } from '@/lib/theme';

type GameShellProps = {
  title: string;
  round: number;
  totalRounds: number;
  timeLeft?: number;
  maxTime?: number;
  score: number;
  children: React.ReactNode;
};

function GameShellInner({
  title,
  round,
  totalRounds,
  timeLeft,
  maxTime,
  score,
  children,
}: GameShellProps) {
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: 8,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={12}
          style={{ marginRight: 12 }}
        >
          <ArrowLeft size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 16,
              fontFamily: 'PlusJakartaSans_600SemiBold',
              color: colors.text.primary,
            }}
            numberOfLines={1}
          >
            {title}
          </Text>
          <Text
            style={{
              fontSize: 12,
              fontFamily: 'PlusJakartaSans_500Medium',
              color: colors.text.secondary,
            }}
          >
            Round {round}/{totalRounds}
          </Text>
        </View>
        <View
          style={{
            backgroundColor: 'rgba(251,191,36,0.12)',
            paddingHorizontal: 14,
            paddingVertical: 6,
            borderRadius: 20,
          }}
        >
          <Text
            style={{
              fontSize: 15,
              fontFamily: 'PlusJakartaSans_700Bold',
              color: colors.accent[600],
            }}
          >
            {score}
          </Text>
        </View>
      </View>

      {/* Timer bar */}
      {timeLeft != null && maxTime != null && maxTime > 0 && (
        <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
          <TimerBar timeLeft={timeLeft} maxTime={maxTime} />
        </View>
      )}

      {/* Progress dots */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          gap: 6,
          paddingBottom: 12,
        }}
      >
        {Array.from({ length: totalRounds }, (_, i) => (
          <View
            key={i}
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor:
                i < round
                  ? colors.accent[400]
                  : i === round
                    ? colors.accent[300]
                    : 'rgba(0,0,0,0.08)',
            }}
          />
        ))}
      </View>

      {/* Content */}
      <View style={{ flex: 1 }}>{children}</View>
    </View>
  );
}

export const GameShell = React.memo(GameShellInner);
