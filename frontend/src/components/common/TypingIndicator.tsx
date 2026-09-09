import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet } from "react-native";

interface Props {
  color?: string;
  size?: number;
}

export const TypingIndicator = ({ color = "#2D9CDB", size = 9 }: Props) => {
  const d1 = useRef(new Animated.Value(0)).current;
  const d2 = useRef(new Animated.Value(0)).current;
  const d3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const bounce = (val: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, { toValue: 1, duration: 320, useNativeDriver: true }),
          Animated.timing(val, { toValue: 0, duration: 320, useNativeDriver: true }),
          Animated.delay(Math.max(0, 960 - 640 - delay)),
        ])
      );

    const a1 = bounce(d1, 0);
    const a2 = bounce(d2, 180);
    const a3 = bounce(d3, 360);
    a1.start();
    a2.start();
    a3.start();
    return () => {
      a1.stop();
      a2.stop();
      a3.stop();
    };
  }, []);

  const dotStyle = (val: Animated.Value) => ({
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: color,
    opacity: val.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }),
    transform: [
      { translateY: val.interpolate({ inputRange: [0, 1], outputRange: [0, -(size * 0.8)] }) },
    ],
  });

  return (
    <View style={styles.row}>
      <Animated.View style={dotStyle(d1)} />
      <Animated.View style={dotStyle(d2)} />
      <Animated.View style={dotStyle(d3)} />
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 6 },
});
