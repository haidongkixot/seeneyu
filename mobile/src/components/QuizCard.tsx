import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Check, X } from 'lucide-react-native';
import { colors } from '@/lib/theme';

type QuizOption = string;

type QuizCardProps = {
  questionNumber: number;
  totalQuestions: number;
  question: string;
  options: QuizOption[];
  correctIndex: number;
  explanation: string;
  onAnswer: (isCorrect: boolean) => void;
};

function QuizCardInner({
  questionNumber,
  totalQuestions,
  question,
  options,
  correctIndex,
  explanation,
  onAnswer,
}: QuizCardProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const answered = selectedIndex !== null;
  const isCorrect = selectedIndex === correctIndex;

  const handleSelect = useCallback(
    (index: number) => {
      if (answered) return;
      setSelectedIndex(index);
      onAnswer(index === correctIndex);
    },
    [answered, correctIndex, onAnswer]
  );

  return (
    <View style={styles.container}>
      <Text style={styles.counter}>
        Question {questionNumber} of {totalQuestions}
      </Text>
      <Text style={styles.question}>{question}</Text>

      <View style={styles.optionsContainer}>
        {options.map((option, index) => {
          const isSelected = selectedIndex === index;
          const isCorrectOption = index === correctIndex;
          let optionStyle = styles.option;
          let textColor = colors.text.primary;

          if (answered) {
            if (isCorrectOption) {
              optionStyle = { ...styles.option, ...styles.correctOption };
              textColor = '#15803d';
            } else if (isSelected && !isCorrectOption) {
              optionStyle = { ...styles.option, ...styles.wrongOption };
              textColor = '#b91c1c';
            } else {
              optionStyle = { ...styles.option, ...styles.dimmedOption };
              textColor = colors.text.tertiary;
            }
          }

          return (
            <TouchableOpacity
              key={index}
              onPress={() => handleSelect(index)}
              disabled={answered}
              activeOpacity={0.7}
              style={optionStyle}
            >
              <Text
                style={[styles.optionText, { color: textColor }]}
                numberOfLines={3}
              >
                {option}
              </Text>
              {answered && isCorrectOption && (
                <Check size={18} color="#15803d" />
              )}
              {answered && isSelected && !isCorrectOption && (
                <X size={18} color="#b91c1c" />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {answered && (
        <View
          style={[
            styles.feedback,
            isCorrect ? styles.correctFeedback : styles.wrongFeedback,
          ]}
        >
          <Text
            style={[
              styles.feedbackTitle,
              { color: isCorrect ? '#15803d' : '#b91c1c' },
            ]}
          >
            {isCorrect ? 'Correct!' : 'Not quite'}
          </Text>
          <Text style={styles.explanation}>{explanation}</Text>
        </View>
      )}
    </View>
  );
}

export const QuizCard = React.memo(QuizCardInner);

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  counter: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: colors.text.tertiary,
    marginBottom: 8,
  },
  question: {
    fontSize: 17,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: colors.text.primary,
    lineHeight: 24,
    marginBottom: 16,
  },
  optionsContainer: {
    gap: 10,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.08)',
    backgroundColor: '#ffffff',
  },
  correctOption: {
    borderColor: '#22c55e',
    backgroundColor: '#f0fdf4',
  },
  wrongOption: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  dimmedOption: {
    opacity: 0.5,
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_500Medium',
    lineHeight: 21,
    marginRight: 8,
  },
  feedback: {
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
  },
  correctFeedback: {
    backgroundColor: '#f0fdf4',
  },
  wrongFeedback: {
    backgroundColor: '#fef2f2',
  },
  feedbackTitle: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_700Bold',
    marginBottom: 4,
  },
  explanation: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: colors.text.secondary,
    lineHeight: 20,
  },
});
