import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
  Modal,
} from 'react-native';
import { X, Send, ChevronDown } from 'lucide-react-native';
import { useAuth } from '@/lib/auth-context';
import { apiPost } from '@/lib/api';
import { VoiceInput } from './VoiceInput';
import { colors, spacing } from '@/lib/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type Message = {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  suggestions?: string[];
};

type Props = {
  visible: boolean;
  onClose: () => void;
  context?: string;
};

function BouncingDots() {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    function animateDot(dot: Animated.Value, delay: number) {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: -6,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ])
      );
    }
    const a1 = animateDot(dot1, 0);
    const a2 = animateDot(dot2, 150);
    const a3 = animateDot(dot3, 300);
    a1.start();
    a2.start();
    a3.start();
    return () => {
      a1.stop();
      a2.stop();
      a3.stop();
    };
  }, []);

  return (
    <View style={{ flexDirection: 'row', gap: 4, padding: 12 }}>
      {[dot1, dot2, dot3].map((dot, i) => (
        <Animated.View
          key={i}
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: colors.text.tertiary,
            transform: [{ translateY: dot }],
          }}
        />
      ))}
    </View>
  );
}

export function CoachNeyChat({ visible, onClose, context }: Props) {
  const { token } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        "Hi! I'm Coach Ney, your body language mentor. How can I help you today?",
      suggestions: [
        'How do I improve eye contact?',
        'Tips for confident posture',
        'Help me with my lesson',
      ],
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 20,
        stiffness: 150,
      }).start();
    } else {
      slideAnim.setValue(SCREEN_HEIGHT);
    }
  }, [visible]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      const userMsg: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: text.trim(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput('');
      setIsLoading(true);

      try {
        const history = messages
          .filter((m) => m.id !== 'welcome')
          .map((m) => ({ role: m.role, content: m.content }));

        const res = await apiPost<{
          reply: string;
          suggestions?: string[];
        }>(
          '/api/assistant/chat',
          {
            message: text.trim(),
            history,
            context: context || 'general',
          },
          token
        );

        const assistantMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: res.reply,
          suggestions: res.suggestions,
        };

        setMessages((prev) => [...prev, assistantMsg]);
      } catch (err) {
        const errorMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content:
            "Sorry, I'm having trouble connecting right now. Please try again in a moment.",
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, isLoading, token, context]
  );

  function handleVoiceComplete(base64Audio: string) {
    // Send audio as a special message format
    sendMessage(`[voice:${base64Audio.substring(0, 50)}...]`);
  }

  function handleSuggestionPress(suggestion: string) {
    sendMessage(suggestion);
  }

  function handleDismiss() {
    Animated.timing(slideAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start(() => onClose());
  }

  const renderMessage = useCallback(
    ({ item }: { item: Message }) => {
      const isAssistant = item.role === 'assistant';

      return (
        <View
          style={{
            alignSelf: isAssistant ? 'flex-start' : 'flex-end',
            maxWidth: '82%',
            marginBottom: 12,
          }}
        >
          {isAssistant && (
            <Text
              style={{
                fontSize: 10,
                fontFamily: 'PlusJakartaSans_700Bold',
                color: colors.accent[600],
                letterSpacing: 1,
                marginBottom: 4,
                textTransform: 'uppercase',
              }}
            >
              Coach Ney
            </Text>
          )}
          <View
            style={{
              backgroundColor: isAssistant
                ? colors.bg.surface
                : 'rgba(251,191,36,0.15)',
              borderRadius: 16,
              borderTopLeftRadius: isAssistant ? 4 : 16,
              borderTopRightRadius: isAssistant ? 16 : 4,
              paddingHorizontal: 14,
              paddingVertical: 10,
            }}
          >
            <Text
              style={{
                fontSize: 15,
                fontFamily: 'PlusJakartaSans_400Regular',
                color: colors.text.primary,
                lineHeight: 22,
              }}
            >
              {item.content}
            </Text>
          </View>

          {/* Suggestion chips */}
          {isAssistant && item.suggestions && item.suggestions.length > 0 && (
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: 8,
                marginTop: 8,
              }}
            >
              {item.suggestions.map((s, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => handleSuggestionPress(s)}
                  activeOpacity={0.7}
                  style={{
                    backgroundColor: '#ffffff',
                    borderWidth: 1,
                    borderColor: colors.accent[400],
                    borderRadius: 20,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontFamily: 'PlusJakartaSans_500Medium',
                      color: colors.accent[600],
                    }}
                  >
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      );
    },
    [handleSuggestionPress]
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleDismiss}
    >
      <Animated.View
        style={{
          flex: 1,
          backgroundColor: '#ffffff',
          transform: [{ translateY: slideAnim }],
          paddingTop: Platform.OS === 'ios' ? 50 : 30,
        }}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingBottom: 12,
            borderBottomWidth: 1,
            borderBottomColor: colors.border.default,
          }}
        >
          {/* Avatar */}
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.accent[400],
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
            }}
          >
            <Text style={{ fontSize: 20 }}>🤖</Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 17,
                fontFamily: 'PlusJakartaSans_700Bold',
                color: colors.text.primary,
              }}
            >
              Coach Ney
            </Text>
            <Text
              style={{
                fontSize: 12,
                fontFamily: 'PlusJakartaSans_400Regular',
                color: colors.text.secondary,
              }}
            >
              Your body language mentor
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleDismiss}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: colors.bg.surface,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
        >
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{
              padding: 16,
              paddingBottom: 8,
            }}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: true })
            }
            showsVerticalScrollIndicator={false}
            ListFooterComponent={isLoading ? <BouncingDots /> : null}
          />

          {/* Input Bar */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-end',
              paddingHorizontal: 12,
              paddingVertical: 10,
              paddingBottom: Platform.OS === 'ios' ? 34 : 16,
              borderTopWidth: 1,
              borderTopColor: colors.border.default,
              backgroundColor: '#ffffff',
              gap: 8,
            }}
          >
            <VoiceInput
              onRecordingComplete={handleVoiceComplete}
              disabled={isLoading}
            />

            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Ask Coach Ney..."
              placeholderTextColor={colors.text.tertiary}
              multiline
              maxLength={500}
              style={{
                flex: 1,
                backgroundColor: colors.bg.surface,
                borderRadius: 20,
                paddingHorizontal: 16,
                paddingVertical: 10,
                fontSize: 15,
                fontFamily: 'PlusJakartaSans_400Regular',
                color: colors.text.primary,
                maxHeight: 100,
              }}
            />

            <TouchableOpacity
              onPress={() => sendMessage(input)}
              disabled={!input.trim() || isLoading}
              activeOpacity={0.7}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor:
                  input.trim() && !isLoading
                    ? colors.accent[400]
                    : colors.bg.surface,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Send
                size={18}
                color={
                  input.trim() && !isLoading
                    ? '#1a1a2e'
                    : colors.text.tertiary
                }
              />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Animated.View>
    </Modal>
  );
}
