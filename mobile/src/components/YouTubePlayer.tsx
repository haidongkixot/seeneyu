import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { WebView } from 'react-native-webview';

type YouTubePlayerProps = {
  videoId: string;
  startSec?: number;
  endSec?: number;
  style?: ViewStyle;
};

function YouTubePlayerInner({ videoId, startSec, endSec, style }: YouTubePlayerProps) {
  const params = new URLSearchParams({
    autoplay: '1',
    playsinline: '1',
    modestbranding: '1',
    rel: '0',
  });
  if (startSec !== undefined) params.set('start', String(startSec));
  if (endSec !== undefined) params.set('end', String(endSec));

  const uri = `https://www.youtube.com/embed/${videoId}?${params.toString()}`;

  return (
    <View style={[styles.container, style]}>
      <WebView
        source={{ uri }}
        style={styles.webview}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled
        domStorageEnabled
        allowsFullscreenVideo
      />
    </View>
  );
}

export const YouTubePlayer = React.memo(YouTubePlayerInner);

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  webview: {
    flex: 1,
    backgroundColor: '#000',
  },
});
