import { useRef, useState } from "react";
import { Pressable, Animated, StyleSheet, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../theme";

export default function InteractiveButton({
  label,
  onPress,
  variant = "solid",
  style,
  textStyle,
  disabled = false,
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const [hovered, setHovered] = useState(false);

  const animateTo = (toValue) => {
    Animated.spring(scale, {
      toValue,
      friction: 7,
      tension: 180,
      useNativeDriver: true,
    }).start();
  };

  const isSolid = variant === "solid";

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Pressable
        disabled={disabled}
        onPress={onPress}
        onPressIn={() => animateTo(0.98)}
        onPressOut={() => animateTo(1)}
        onHoverIn={() => {
          setHovered(true);
          animateTo(1.015);
        }}
        onHoverOut={() => {
          setHovered(false);
          animateTo(1);
        }}
        hitSlop={8}
      >
        {isSolid ? (
          <LinearGradient
            colors={hovered ? [colors.primaryDark, colors.primary] : [colors.primary, "#1f7a73"]}
            style={[s.btn, s.solid, disabled && s.disabled]}
          >
            <Text style={[s.text, s.solidText, textStyle]}>{label}</Text>
          </LinearGradient>
        ) : (
          <Animated.View style={[s.btn, s.ghost, hovered && s.ghostHover, disabled && s.disabled]}>
            <Text style={[s.text, s.ghostText, textStyle]}>{label}</Text>
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
});