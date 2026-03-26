import { TouchableOpacity, Text, View } from 'react-native';
import { MessageCircle } from 'lucide-react-native';
import { colors } from '@/lib/theme';

type Props = {
  onPress: () => void;
};

export function CoachNeyFAB({ onPress }: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: colors.accent[400],
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 6,
      }}
    >
      <MessageCircle size={24} color="#1a1a2e" />
    </TouchableOpacity>
  );
}
