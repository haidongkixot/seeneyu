import React, { memo, useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Reply, Edit3, Trash2 } from 'lucide-react-native';
import { colors } from '@/lib/theme';

export type Comment = {
  id: string;
  userId: string;
  userName?: string;
  text: string;
  createdAt: string;
  parentId?: string | null;
  replies?: Comment[];
};

type Props = {
  comment: Comment;
  currentUserId?: string;
  onReply?: (commentId: string) => void;
  onEdit?: (comment: Comment) => void;
  onDelete?: (commentId: string) => void;
  isReply?: boolean;
};

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);

  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export const CommentCard = memo(function CommentCard({
  comment,
  currentUserId,
  onReply,
  onEdit,
  onDelete,
  isReply = false,
}: Props) {
  const isOwn = currentUserId === comment.userId;
  const initials = useMemo(() => {
    const name = comment.userName || 'U';
    return name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }, [comment.userName]);

  return (
    <View
      style={{
        marginLeft: isReply ? 40 : 0,
        marginBottom: 12,
      }}
    >
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {/* Avatar */}
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: isReply
              ? colors.bg.surface
              : colors.accent[300],
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontFamily: 'PlusJakartaSans_700Bold',
              color: isReply ? colors.text.secondary : '#1a1a2e',
            }}
          >
            {initials}
          </Text>
        </View>

        {/* Content */}
        <View style={{ flex: 1 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              marginBottom: 2,
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontFamily: 'PlusJakartaSans_600SemiBold',
                color: colors.text.primary,
              }}
            >
              {comment.userName || 'Anonymous'}
            </Text>
            <Text
              style={{
                fontSize: 11,
                fontFamily: 'PlusJakartaSans_400Regular',
                color: colors.text.tertiary,
              }}
            >
              {formatRelativeTime(comment.createdAt)}
            </Text>
          </View>

          <Text
            style={{
              fontSize: 14,
              fontFamily: 'PlusJakartaSans_400Regular',
              color: colors.text.secondary,
              lineHeight: 20,
            }}
          >
            {comment.text}
          </Text>

          {/* Actions */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 16,
              marginTop: 6,
            }}
          >
            {!isReply && onReply && (
              <TouchableOpacity
                onPress={() => onReply(comment.id)}
                activeOpacity={0.6}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Reply size={14} color={colors.text.tertiary} />
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: 'PlusJakartaSans_500Medium',
                    color: colors.text.tertiary,
                  }}
                >
                  Reply
                </Text>
              </TouchableOpacity>
            )}
            {isOwn && onEdit && (
              <TouchableOpacity
                onPress={() => onEdit(comment)}
                activeOpacity={0.6}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Edit3 size={14} color={colors.text.tertiary} />
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: 'PlusJakartaSans_500Medium',
                    color: colors.text.tertiary,
                  }}
                >
                  Edit
                </Text>
              </TouchableOpacity>
            )}
            {isOwn && onDelete && (
              <TouchableOpacity
                onPress={() => onDelete(comment.id)}
                activeOpacity={0.6}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Trash2 size={14} color={colors.status.error} />
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: 'PlusJakartaSans_500Medium',
                    color: colors.status.error,
                  }}
                >
                  Delete
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </View>
  );
});
