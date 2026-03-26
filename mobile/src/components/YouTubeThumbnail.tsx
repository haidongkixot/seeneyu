import React, { useCallback } from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  Linking,
  ViewStyle,
} from 'react-native';
import { Play } from 'lucide-react-native';

type YouTubeThumbnailProps = {
  videoId: string;
  startTime?: number;
  style?: ViewStyle;
  height?: number;
  onPress?: () => void;
};

function YouTubeThumbnailInner({
  videoId,
  startTime,
  style,
  height = 180,
  onPress,
}: YouTubeThumbnailProps) {
  const thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;

  const handlePress = useCallback(() => {
    if (onPress) {
      onPress();
      return;
    }
    const t = startTime ? `&t=${startTime}` : '';
    Linking.openURL(`https://www.youtube.com/watch?v=${videoId}${t}`);
  }, [videoId, startTime, onPress]);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={handlePress}
      style={[styles.container, { height }, style]}
    >
      <Image
        source={{ uri: thumbnailUrl }}
        style={styles.image}
        resizeMode="cover"
      />
      <View style={styles.overlay}>
        <View style={styles.playButton}>
          <Play size={24} color="#ffffff" fill="#ffffff" />
        </View>
      </View>
    </TouchableOpacity>
  );
}

export const YouTubeThumbnail = React.memo(YouTubeThumbnailInner);

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#e5e7eb',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  playButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 3,
  },
});
