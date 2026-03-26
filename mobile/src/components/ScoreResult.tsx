import React from 'react';
import { View, Text } from 'react-native';
import { Trophy } from 'lucide-react-native';
import { Button } from './Button';
import { colors } from '@/lib/theme';

type ScoreResultProps = {
  score: number;
  correct: number;
  wrong: number;
  accuracy: number;
  onPlayAgain: () => void;
  onGoBack: () => void;
};

function ScoreResultInner({
  score,
  correct,
  wrong,
  accuracy,
  onPlayAgain,
  onGoBack,
}: ScoreResultProps) {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
      }}
    >
      <View
        style={{
          width: 96,
          height: 96,
          borderRadius: 48,
          backgroundColor: 'rgba(251,191,36,0.15)',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 24,
        }}
      >
        <Trophy size={48} color={colors.accent[500]} />
      </View>

      <Text
        style={{
          fontSize: 14,
          fontFamily: 'PlusJakartaSans_500Medium',
          color: colors.text.secondary,
          textTransform: 'uppercase',
          letterSpacing: 1.5,
          marginBottom: 4,
        }}
      >
        Final Score
      </Text>
      <Text
        style={{
          fontSize: 48,
          fontFamily: 'PlusJakartaSans_700Bold',
          color: colors.accent[500],
          marginBottom: 24,
        }}
      >
        {score}
      </Text>

      {/* Stats row */}
      <View
        style={{
          flexDirection: 'row',
          gap: 24,
          marginBottom: 40,
        }}
      >
        <StatItem label="Correct" value={String(correct)} color="#22c55e" />
        <StatItem label="Wrong" value={String(wrong)} color="#ef4444" />
        <StatItem label="Accuracy" value={`${accuracy}%`} color={colors.accent[500]} />
      </View>

      <View style={{ width: '100%', gap: 12 }}>
        <Button title="Play Again" onPress={onPlayAgain} variant="primary" />
        <Button title="Back to Games" onPress={onGoBack} variant="ghost" />
      </View>
    </View>
  );
}

function StatItem({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text
        style={{
          fontSize: 24,
          fontFamily: 'PlusJakartaSans_700Bold',
          color,
        }}
      >
        {value}
      </Text>
      <Text
        style={{
          fontSize: 12,
          fontFamily: 'PlusJakartaSans_500Medium',
          color: colors.text.tertiary,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

export const ScoreResult = React.memo(ScoreResultInner);
