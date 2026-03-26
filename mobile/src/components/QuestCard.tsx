import React, { useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';
import { Check, Zap } from 'lucide-react-native';
import { colors } from '@/lib/theme';

export type Quest = {
  id: string;
  description: string;
  progress: number;
  target: number;
  xpReward: number;
  completed: boolean;
};

type Props = {
  quest: Quest;
};

export function QuestCard({ quest }: Props) {
  const fillAnim = useRef(new Animated.Value(0)).current;
  const progress = quest.target > 0 ? quest.progress / quest.target : 0;

  useEffect(() => {
    Animated.timing(fillAnim, {
      toValue: Math.min(progress, 1),
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  return (
    <View
      style={{
        backgroundColor: '#ffffff',
        borderRadius: 14,
        padding: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: quest.completed
          ? colors.status.success + '30'
          : 'rgba(0,0,0,0.06)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
        elevation: 1,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 10,
        }}
      >
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          {quest.completed ? (
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: colors.status.success,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Check size={16} color="#ffffff" />
            </View>
          ) : (
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: colors.bg.surface,
                borderWidth: 2,
                borderColor: colors.border.default,
              }}
            />
          )}
          <Text
            style={{
              flex: 1,
              fontSize: 14,
              fontFamily: 'PlusJakartaSans_500Medium',
              color: quest.completed
                ? colors.text.tertiary
                : colors.text.primary,
              textDecorationLine: quest.completed ? 'line-through' : 'none',
            }}
          >
            {quest.description}
          </Text>
        </View>

        {/* XP Chip */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: 'rgba(251,191,36,0.12)',
            borderRadius: 12,
            paddingHorizontal: 8,
            paddingVertical: 4,
            gap: 3,
            marginLeft: 8,
          }}
        >
          <Zap size={12} color={colors.accent[500]} />
          <Text
            style={{
              fontSize: 12,
              fontFamily: 'PlusJakartaSans_700Bold',
              color: colors.accent[600],
            }}
          >
            {quest.xpReward}
          </Text>
        </View>
      </View>

      {/* Progress bar */}
      <View
        style={{
          height: 6,
          borderRadius: 3,
          backgroundColor: colors.bg.surface,
          overflow: 'hidden',
        }}
      >
        <Animated.View
          style={{
            height: '100%',
            borderRadius: 3,
            backgroundColor: quest.completed
              ? colors.status.success
              : colors.accent[400],
            width: fillAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', '100%'],
            }),
          }}
        />
      </View>

      <Text
        style={{
          fontSize: 11,
          fontFamily: 'PlusJakartaSans_400Regular',
          color: colors.text.tertiary,
          marginTop: 4,
          textAlign: 'right',
        }}
      >
        {quest.progress}/{quest.target}
      </Text>
    </View>
  );
}
