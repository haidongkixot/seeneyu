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
  const startParam = startSec !== undefined ? startSec : 0;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <style>
    * { margin: 0; padding: 0; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: #000; }
    #player { width: 100%; height: 100%; }
  </style>
</head>
<body>
  <div id="player"></div>
  <script>
    var tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);

    function onYouTubeIframeAPIReady() {
      new YT.Player('player', {
        width: '100%',
        height: '100%',
        videoId: '${videoId}',
        playerVars: {
          autoplay: 1,
          start: ${startParam},
          ${endSec !== undefined ? `end: ${endSec},` : ''}
          playsinline: 1,
          modestbranding: 1,
          rel: 0,
          controls: 1,
          fs: 0
        },
        events: {
          onReady: function(event) {
            event.target.playVideo();
          }
        }
      });
    }
  </script>
</body>
</html>`;

  return (
    <View style={[styles.container, style]}>
      <WebView
        source={{ html }}
        style={styles.webview}
        originWhitelist={['*']}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowsFullscreenVideo={true}
        mixedContentMode="compatibility"
        allowsProtectedMedia={true}
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
