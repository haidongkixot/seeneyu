import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const DIFFICULTY_COLORS: Record<string, { bg: string; text: string }> = {
  beginner: { bg: '#dcfce7', text: '#15803d' },
  intermediate: { bg: '#fef3c7', text: '#b45309' },
  advanced: { bg: '#fee2e2', text: '#b91c1c' },
};

const DEFAULT_COLOR = { bg: '#f3f4f6', text: '#374151' };

type DifficultyPillProps = {
  difficulty: string;
};

function DifficultyPillInner({ difficulty }: DifficultyPillProps) {
  const color =
    DIFFICULTY_COLORS[difficulty.toLowerCase()] ?? DEFAULT_COLOR;
  const label = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);

  return (
    <View style={[styles.pill, { backgroundColor: color.bg }]}>
      <Text style={[styles.text, { color: color.text }]}>{label}</Text>
    </View>
  );
}

export const DifficultyPill = React.memo(DifficultyPillInner);

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 10,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
});
