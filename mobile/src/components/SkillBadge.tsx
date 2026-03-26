import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const SKILL_COLORS: Record<string, { bg: string; text: string }> = {
  'eye-contact': { bg: '#dbeafe', text: '#1d4ed8' },
  'posture': { bg: '#dcfce7', text: '#15803d' },
  'gestures': { bg: '#fef3c7', text: '#b45309' },
  'facial-expressions': { bg: '#fce7f3', text: '#be185d' },
  'vocal-pacing': { bg: '#e0e7ff', text: '#4338ca' },
  'proxemics': { bg: '#f3e8ff', text: '#7c3aed' },
  'mirroring': { bg: '#ccfbf1', text: '#0f766e' },
  'power-dynamics': { bg: '#fee2e2', text: '#b91c1c' },
};

const DEFAULT_COLOR = { bg: '#f3f4f6', text: '#374151' };

type SkillBadgeProps = {
  skill: string;
};

function SkillBadgeInner({ skill }: SkillBadgeProps) {
  const color = SKILL_COLORS[skill] ?? DEFAULT_COLOR;
  const label = skill
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <View style={[styles.badge, { backgroundColor: color.bg }]}>
      <Text style={[styles.text, { color: color.text }]}>{label}</Text>
    </View>
  );
}

export const SkillBadge = React.memo(SkillBadgeInner);

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
});
