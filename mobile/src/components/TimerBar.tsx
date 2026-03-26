import React, { useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';

type TimerBarProps = {
  timeLeft: number;
  maxTime: number;
};

function TimerBarInner({ timeLeft, maxTime }: TimerBarProps) {
  const widthAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const fraction = maxTime > 0 ? timeLeft / maxTime : 0;
    Animated.timing(widthAnim, {
      toValue: fraction,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [timeLeft, maxTime]);

  const backgroundColor = widthAnim.interpolate({
    inputRange: [0, 0.3, 0.6, 1],
    outputRange: ['#ef4444', '#ef4444', '#f59e0b', '#22c55e'],
  });

  return (
    <View
      style={{
        height: 6,
        borderRadius: 3,
        backgroundColor: 'rgba(0,0,0,0.06)',
        overflow: 'hidden',
      }}
    >
      <Animated.View
        style={{
          height: '100%',
          borderRadius: 3,
          backgroundColor,
          width: widthAnim.interpolate({
            inputRange: [0, 1],
            outputRange: ['0%', '100%'],
          }),
        }}
      />
    </View>
  );
}

export const TimerBar = React.memo(TimerBarInner);
