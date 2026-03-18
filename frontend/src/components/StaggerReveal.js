
import { useEffect, useRef } from "react";
import { Animated, Easing } from "react-native";

// Advanced spring profiles for micro-interactions
const springProfiles = {
  snappy: { tension: 240, friction: 16, overshootClamping: false, bounce: 0.6 },
  smooth: { tension: 170, friction: 20, overshootClamping: false, bounce: 0.4 },
  gentle: { tension: 120, friction: 22, overshootClamping: true, bounce: 0.2 },
  bounce: { tension: 180, friction: 12, overshootClamping: false, bounce: 0.8 },
};

export default function StaggerReveal({
  children,
  delay = 0,
  duration,
  offset = 18,
  profile = "smooth",
  style,
  onAnimationEnd,
  stagger = 0,
}) {
  const spring = springProfiles[profile] || springProfiles.smooth;
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(offset)).current;
  const scale = useRef(new Animated.Value(0.98)).current;
  const bounce = spring.bounce;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          tension: spring.tension,
          friction: spring.friction,
          overshootClamping: spring.overshootClamping,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          tension: spring.tension,
          friction: spring.friction,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: duration || 420,
          easing: Easing.out(Easing.exp),
          useNativeDriver: true,
        }),
      ]),
      Animated.spring(scale, {
        toValue: 1 + bounce * 0.03,
        tension: spring.tension,
        friction: spring.friction,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        tension: spring.tension,
        friction: spring.friction,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onAnimationEnd) onAnimationEnd();
    });
  }, [delay, duration, spring, opacity, scale, translateY, bounce, onAnimationEnd]);

  // Accessibility: fade-in and bounce for micro-interaction
  return (
    <Animated.View
      accessible={true}
      accessibilityLabel="Animated content"
      style={[style, { opacity, transform: [{ translateY }, { scale }] }]}
    >
      {children}
    </Animated.View>
  );
}