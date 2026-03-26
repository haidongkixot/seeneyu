import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Send, X } from 'lucide-react-native';
import { useAuth } from '@/lib/auth-context';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api';
import { CommentCard, type Comment } from './CommentCard';
import { colors } from '@/lib/theme';

type Props = {
  lessonId?: string;
  challengeId?: string;
};

export function CommentThread({ lessonId, challengeId }: Props) {
  const { user, token } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<Comment | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const queryParam = lessonId
    ? `lessonId=${lessonId}`
    : challengeId
    ? `challengeId=${challengeId}`
    : '';

  const fetchComments = useCallback(async () => {
    if (!queryParam) return;
    try {
      const data = await apiGet<Comment[]>(
        `/api/comments?${queryParam}`,
        token
      );
      setComments(data || []);
    } catch {
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [queryParam, token]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmit = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || submitting) return;

    setSubmitting(true);
    try {
      if (editingComment) {
        await apiPatch(
          `/api/comments/${editingComment.id}`,
          { text: trimmed },
          token
        );
        setEditingComment(null);
      } else {
        const body: Record<string, string> = { text: trimmed };
        if (lessonId) body.lessonId = lessonId;
        if (challengeId) body.challengeId = challengeId;
        if (replyTo) body.parentId = replyTo;
        await apiPost('/api/comments', body, token);
        setReplyTo(null);
      }
      setText('');
      await fetchComments();
    } catch {
      Alert.alert('Error', 'Failed to post comment.');
    } finally {
      setSubmitting(false);
    }
  }, [
    text,
    submitting,
    editingComment,
    replyTo,
    lessonId,
    challengeId,
    token,
    fetchComments,
  ]);

  const handleDelete = useCallback(
    (commentId: string) => {
      Alert.alert('Delete Comment', 'Are you sure?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiDelete(`/api/comments/${commentId}`, token);
              await fetchComments();
            } catch {
              Alert.alert('Error', 'Failed to delete comment.');
            }
          },
        },
      ]);
    },
    [token, fetchComments]
  );

  const handleEdit = useCallback((comment: Comment) => {
    setEditingComment(comment);
    setText(comment.text);
    setReplyTo(null);
  }, []);

  const handleReply = useCallback((commentId: string) => {
    setReplyTo(commentId);
    setEditingComment(null);
    setText('');
  }, []);

  const cancelAction = useCallback(() => {
    setReplyTo(null);
    setEditingComment(null);
    setText('');
  }, []);

  // Build flat list with nested replies (1 level)
  const flatData = comments.reduce<(Comment & { isReply: boolean })[]>(
    (acc, comment) => {
      if (!comment.parentId) {
        acc.push({ ...comment, isReply: false });
        if (comment.replies) {
          comment.replies.forEach((reply) => {
            acc.push({ ...reply, isReply: true });
          });
        }
        // Also find top-level replies from flat list
        comments
          .filter((c) => c.parentId === comment.id && !comment.replies?.some((r) => r.id === c.id))
          .forEach((reply) => {
            acc.push({ ...reply, isReply: true });
          });
      }
      return acc;
    },
    []
  );

  // Auth gate
  if (!user) {
    return (
      <View
        style={{
          padding: 16,
          alignItems: 'center',
          borderTopWidth: 1,
          borderTopColor: colors.border.default,
          marginTop: 16,
        }}
      >
        <Text
          style={{
            fontSize: 14,
            fontFamily: 'PlusJakartaSans_500Medium',
            color: colors.text.tertiary,
          }}
        >
          Sign in to join the discussion
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      <View
        style={{
          borderTopWidth: 1,
          borderTopColor: colors.border.default,
          marginTop: 16,
          paddingTop: 16,
        }}
      >
        <Text
          style={{
            fontSize: 16,
            fontFamily: 'PlusJakartaSans_600SemiBold',
            color: colors.text.primary,
            marginBottom: 12,
            paddingHorizontal: 16,
          }}
        >
          Discussion ({comments.filter((c) => !c.parentId).length})
        </Text>

        {loading ? (
          <ActivityIndicator
            color={colors.accent[400]}
            style={{ paddingVertical: 24 }}
          />
        ) : (
          <FlatList
            data={flatData}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            contentContainerStyle={{ paddingHorizontal: 16 }}
            renderItem={({ item }) => (
              <CommentCard
                comment={item}
                currentUserId={user.id}
                onReply={handleReply}
                onEdit={handleEdit}
                onDelete={handleDelete}
                isReply={item.isReply}
              />
            )}
            ListEmptyComponent={
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: 'PlusJakartaSans_400Regular',
                  color: colors.text.tertiary,
                  textAlign: 'center',
                  paddingVertical: 24,
                }}
              >
                No comments yet. Be the first!
              </Text>
            }
          />
        )}

        {/* Reply / Edit indicator */}
        {(replyTo || editingComment) && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 16,
              paddingVertical: 6,
              backgroundColor: colors.bg.surface,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontFamily: 'PlusJakartaSans_500Medium',
                color: colors.accent[600],
              }}
            >
              {editingComment ? 'Editing comment...' : 'Replying...'}
            </Text>
            <TouchableOpacity onPress={cancelAction} hitSlop={8}>
              <X size={16} color={colors.text.tertiary} />
            </TouchableOpacity>
          </View>
        )}

        {/* Input */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-end',
            paddingHorizontal: 16,
            paddingVertical: 8,
            gap: 8,
            borderTopWidth: 1,
            borderTopColor: colors.border.default,
          }}
        >
          <TextInput
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: colors.border.default,
              borderRadius: 20,
              paddingHorizontal: 14,
              paddingVertical: 8,
              fontSize: 14,
              fontFamily: 'PlusJakartaSans_400Regular',
              color: colors.text.primary,
              maxHeight: 100,
              backgroundColor: colors.bg.surface,
            }}
            value={text}
            onChangeText={setText}
            placeholder={
              replyTo ? 'Write a reply...' : 'Add a comment...'
            }
            placeholderTextColor={colors.text.tertiary}
            multiline
          />
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!text.trim() || submitting}
            activeOpacity={0.7}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor:
                text.trim() && !submitting
                  ? colors.accent[400]
                  : colors.bg.surface,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {submitting ? (
              <ActivityIndicator size="small" color={colors.accent[600]} />
            ) : (
              <Send
                size={18}
                color={
                  text.trim() ? '#1a1a2e' : colors.text.tertiary
                }
              />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
