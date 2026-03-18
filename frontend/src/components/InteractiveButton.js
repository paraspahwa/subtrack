
import { useRef, useState } from "react";
import { Pressable, Animated, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../theme";

// Advanced spring profiles for micro-interactions
const springProfiles = {
  tap: { tension: 210, friction: 14, overshootClamping: false, bounce: 0.7 },
  hover: { tension: 170, friction: 18, overshootClamping: false, bounce: 0.4 },
};

export default function InteractiveButton({
  label,
  onPress,
  variant = "solid",
  style,
  textStyle,
  disabled = false,
  accessibilityLabel,
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const [hovered, setHovered] = useState(false);
  const [ripple, setRipple] = useState(false);

  // Micro-interaction: spring with overshoot and bounce
  const animateTo = (toValue, profile = "tap") => {
    const spring = springProfiles[profile] || springProfiles.tap;
    Animated.spring(scale, {
      toValue,
      tension: spring.tension,
      friction: spring.friction,
      overshootClamping: spring.overshootClamping,
      useNativeDriver: true,
    }).start();
  };

  // Ripple effect for tap feedback
  const triggerRipple = () => {
    setRipple(true);
    setTimeout(() => setRipple(false), 320);
  };

  const isSolid = variant === "solid";

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Pressable
        disabled={disabled}
        onPress={e => {
          triggerRipple();
          if (onPress) onPress(e);
        }}
        onPressIn={() => animateTo(0.97, "tap")}
        onPressOut={() => animateTo(1, "tap")}
        onHoverIn={() => {
          setHovered(true);
          animateTo(1.02, "hover");
        }}
        onHoverOut={() => {
          setHovered(false);
          animateTo(1, "hover");
        }}
        hitSlop={8}
        accessible={true}
        accessibilityLabel={accessibilityLabel || label}
      >
        {isSolid ? (
          <LinearGradient
            colors={hovered ? [colors.primaryDark, colors.primary] : [colors.primary, "#1f7a73"]}
            style={[s.btn, s.solid, disabled && s.disabled]}
          >
            <View style={s.rippleWrap}>
              {ripple && <View style={s.ripple} />}
              <Text style={[s.text, s.solidText, textStyle]}>{label}</Text>
            </View>
          </LinearGradient>
        ) : (
          <Animated.View style={[s.btn, s.ghost, hovered && s.ghostHover, disabled && s.disabled]}>
            <View style={s.rippleWrap}>
              {ripple && <View style={s.ripple} />}
              <Text style={[s.text, s.ghostText, textStyle]}>{label}</Text>
            </View>
          </Animated.View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  btn: {
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  solid: {
    shadowColor: colors.primary,
    shadowOpacity: 0.28,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  ghost: {
    borderWidth: 1,
    borderColor: colors.border2,
    backgroundColor: "rgba(255,255,255,0.66)",
  },
  ghostHover: {
    backgroundColor: "rgba(255,255,255,0.86)",
    borderColor: colors.border,
  },
  text: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
  },
  solidText: { color: "#fff" },
  ghostText: { color: colors.text2 },
  disabled: { opacity: 0.65 },
  rippleWrap: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  ripple: {
    position: "absolute",
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.18)",
    opacity: 0.7,
    zIndex: 1,
    top: -8,
    left: -8,
    transform: [{ scale: 1.2 }],
  },
});