import { useEffect, useRef } from "react";
import { Animated } from "react-native";

const profiles = {
  snappy: { duration: 320, tension: 220, friction: 16 },
  smooth: { duration: 520, tension: 170, friction: 20 },
  gentle: { duration: 600, tension: 145, friction: 22 },
};

export default function StaggerReveal({
  children,
  delay = 0,
  duration,
  offset = 14,
  profile = "smooth",
  style,
}) {
  const motion = profiles[profile] || profiles.smooth;
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(offset)).current;
  const scale = useRef(new Animated.Value(0.985)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: duration || motion.duration,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        delay,
        tension: motion.tension,
        friction: motion.friction,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: duration || motion.duration,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [delay, duration, motion.duration, motion.friction, motion.tension, opacity, scale, translateY]);

  return (
    <Animated.View style={[style, { opacity, transform: [{ translateY }, { scale }] }]}> 
      {children}
    </Animated.View>
  );
}