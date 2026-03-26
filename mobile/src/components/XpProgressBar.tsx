import React, { useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';
import { colors } from '@/lib/theme';

type Props = {
  currentXp: number;
  xpForNextLevel: number;
  level: number;
};

export function XpProgressBar({ currentXp, xpForNextLevel, level }: Props) {
  const fillAnim = useRef(new Animated.Value(0)).current;
  const progress = xpForNextLevel > 0 ? currentXp / xpForNextLevel : 0;

  useEffect(() => {
    Animated.timing(fillAnim, {
      toValue: Math.min(progress, 1),
      duration: 800,
      useNativeDriver: false, // width animation needs layout
    }).start();
  }, [progress]);

  return (
    <View style={{ width: '100%' }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 6,
        }}
      >
        <Text
          style={{
            fontSize: 14,
            fontFamily: 'PlusJakartaSans_700Bold',
            color: colors.text.primary,
          }}
        >
          Level {level}
        </Text>
        <Text
          style={{
            fontSize: 12,
            fontFamily: 'PlusJakartaSans_500Medium',
            color: colors.text.secondary,
          }}
        >
          {currentXp} / {xpForNextLevel} XP
        </Text>
      </View>

      <View
        style={{
          height: 10,
          borderRadius: 5,
          backgroundColor: colors.bg.surface,
          overflow: 'hidden',
        }}
      >
        <Animated.View
          style={{
            height: '100%',
            borderRadius: 5,
            backgroundColor: colors.accent[400],
            width: fillAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', '100%'],
            }),
          }}
        />
      </View>
    </View>
  );
}
