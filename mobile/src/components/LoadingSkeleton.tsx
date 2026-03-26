import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';

type LoadingSkeletonProps = {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
};

function LoadingSkeletonInner({
  width = '100%',
  height = 16,
  borderRadius = 8,
  style,
}: LoadingSkeletonProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { width, height, borderRadius, opacity },
        style,
      ]}
    />
  );
}

export const LoadingSkeleton = React.memo(LoadingSkeletonInner);

type CourseSkeletonProps = { count?: number };

function CourseSkeletonListInner({ count = 4 }: CourseSkeletonProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={styles.courseCard}>
          <View style={styles.courseHeader}>
            <LoadingSkeleton width={40} height={40} borderRadius={12} />
            <View style={styles.courseHeaderText}>
              <LoadingSkeleton width="70%" height={18} />
              <LoadingSkeleton width="40%" height={14} style={styles.mt4} />
            </View>
          </View>
          <LoadingSkeleton width="100%" height={6} borderRadius={3} style={styles.mt12} />
        </View>
      ))}
    </View>
  );
}

export const CourseSkeletonList = React.memo(CourseSkeletonListInner);

function ClipSkeletonGridInner({ count = 6 }: { count?: number }) {
  return (
    <View style={styles.gridContainer}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={styles.clipCard}>
          <LoadingSkeleton width="100%" height={100} borderRadius={10} />
          <LoadingSkeleton width="60%" height={12} style={styles.mt8} />
          <LoadingSkeleton width="80%" height={14} style={styles.mt4} />
        </View>
      ))}
    </View>
  );
}

export const ClipSkeletonGrid = React.memo(ClipSkeletonGridInner);

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#e5e7eb',
  },
  container: {
    gap: 12,
  },
  courseCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  courseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  courseHeaderText: {
    flex: 1,
    marginLeft: 12,
  },
  mt4: { marginTop: 4 },
  mt8: { marginTop: 8 },
  mt12: { marginTop: 12 },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  clipCard: {
    width: '48%' as any,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
});
