import React, { useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';
import { Flame } from 'lucide-react-native';
import { colors } from '@/lib/theme';

type Props = {
  streak: number;
};

export function StreakDisplay({ streak }: Props) {
  const flickerAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (streak <= 0) return;

    // Flicker opacity
    const flicker = Animated.loop(
      Animated.sequence([
        Animated.timing(flickerAnim, {
          toValue: 0.7,
          duration: 400 + Math.random() * 200,
          useNativeDriver: true,
        }),
        Animated.timing(flickerAnim, {
          toValue: 1,
          duration: 400 + Math.random() * 200,
          useNativeDriver: true,
        }),
      ])
    );

    flicker.start();
    return () => flicker.stop();
  }, [streak]);

  // Scale the flame based on streak count
  const flameSize = Math.min(24 + streak * 1.5, 48);

  return (
    <View style={{ alignItems: 'center', gap: 4 }}>
      <Animated.View style={{ opacity: streak > 0 ? flickerAnim : 1 }}>
        <Flame
          size={flameSize}
          color={streak > 0 ? '#f97316' : colors.text.tertiary}
          fill={streak > 0 ? '#f97316' : 'none'}
        />
      </Animated.View>
      <Text
        style={{
          fontSize: 18,
          fontFamily: 'PlusJakartaSans_700Bold',
          color: streak > 0 ? '#f97316' : colors.text.tertiary,
        }}
      >
        {streak}
      </Text>
      <Text
        style={{
          fontSize: 11,
          fontFamily: 'PlusJakartaSans_500Medium',
          color: colors.text.secondary,
        }}
      >
        day streak
      </Text>
    </View>
  );
}
