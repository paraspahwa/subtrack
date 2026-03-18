import { View, StyleSheet } from "react-native";
import { Animated } from "react-native";
import Svg, { Circle, Rect } from "react-native-svg";

// Brand color palette
const brandColors = {
  teal: "#125E59",
  gold: "#D97706",
  white: "#FFFFFF",
};

// Animated shape parameters for each variant
const variantMap = {
  landing: {
    a: { top: -70, right: -50, width: 220, height: 220, color: brandColors.teal, opacity: 0.12 },
    b: { bottom: 40, left: -30, width: 180, height: 180, color: brandColors.gold, opacity: 0.12, rotate: 18 },
    c: { top: 90, right: 60, width: 120, height: 120, color: brandColors.white, opacity: 0.46 },
    l1: { top: 160, left: -40, width: 280, color: brandColors.teal, opacity: 0.12, rotate: -14 },
    l2: { bottom: 110, right: -70, width: 240, color: brandColors.gold, opacity: 0.14, rotate: 22 },
  },
  pricing: {
    a: { top: -90, right: -20, width: 260, height: 260, color: brandColors.teal, opacity: 0.10 },
    b: { bottom: 90, left: -50, width: 210, height: 140, color: brandColors.gold, opacity: 0.10, rotate: -16 },
    c: { top: 130, right: 20, width: 96, height: 96, color: brandColors.white, opacity: 0.42, rotate: 22 },
    l1: { top: 230, left: -30, width: 320, color: brandColors.teal, opacity: 0.10, rotate: -12 },
    l2: { bottom: 160, right: -50, width: 280, color: brandColors.gold, opacity: 0.12, rotate: 19 },
  },
  dashboard: {
    a: { top: -70, right: -40, width: 200, height: 200, color: brandColors.teal, opacity: 0.10 },
    b: { bottom: -10, left: -40, width: 160, height: 160, color: brandColors.gold, opacity: 0.10, rotate: 14 },
    c: { top: 30, right: 120, width: 88, height: 88, color: brandColors.white, opacity: 0.36 },
    l1: { top: 92, left: -60, width: 240, color: brandColors.teal, opacity: 0.10, rotate: -10 },
    l2: { bottom: 34, right: -60, width: 220, color: brandColors.gold, opacity: 0.12, rotate: 18 },
  },
  auth: {
    a: { top: -100, right: -70, width: 230, height: 230, color: brandColors.teal, opacity: 0.11 },
    b: { bottom: 130, left: -70, width: 200, height: 160, color: brandColors.gold, opacity: 0.12, rotate: -20 },
    c: { top: 140, right: 20, width: 90, height: 90, color: brandColors.white, opacity: 0.40 },
    l1: { top: 230, left: -40, width: 260, color: brandColors.teal, opacity: 0.11, rotate: -16 },
    l2: { bottom: 210, right: -60, width: 240, color: brandColors.gold, opacity: 0.14, rotate: 18 },
  },
  settings: {
    a: { top: -80, right: -50, width: 210, height: 210, color: brandColors.teal, opacity: 0.10 },
    b: { bottom: 60, left: -60, width: 180, height: 140, color: brandColors.gold, opacity: 0.10, rotate: -18 },
    c: { top: 170, right: 15, width: 90, height: 90, color: brandColors.white, opacity: 0.38 },
    l1: { top: 290, left: -50, width: 280, color: brandColors.teal, opacity: 0.10, rotate: -12 },
    l2: { bottom: 140, right: -70, width: 240, color: brandColors.gold, opacity: 0.12, rotate: 21 },
  },
  modal: {
    a: { top: -70, right: -45, width: 180, height: 180, color: brandColors.teal, opacity: 0.10 },
    b: { bottom: 40, left: -45, width: 140, height: 140, color: brandColors.gold, opacity: 0.10, rotate: 14 },
    c: { top: 120, right: 110, width: 72, height: 72, color: brandColors.white, opacity: 0.34 },
    l1: { top: 180, left: -60, width: 220, color: brandColors.teal, opacity: 0.09, rotate: -10 },
    l2: { bottom: 70, right: -40, width: 200, color: brandColors.gold, opacity: 0.10, rotate: 18 },
  },
};

function AnimatedShape({ shape, animation }) {
  const scale = animation ? animation.scale : 1;
  const opacity = animation ? animation.opacity : shape.opacity;
  return (
    <Animated.View
      style={{
        position: "absolute",
        top: shape.top,
        right: shape.right,
        bottom: shape.bottom,
        left: shape.left,
        width: shape.width,
        height: shape.height,
        transform: [{ scale }, shape.rotate ? { rotate: `${shape.rotate}deg` } : {}],
        opacity,
      }}
    >
      <Svg width={shape.width} height={shape.height}>
        <Circle
          cx={shape.width / 2}
          cy={shape.height / 2}
          r={Math.min(shape.width, shape.height) / 2}
          fill={shape.color}
          fillOpacity={shape.opacity}
        />
      </Svg>
    </Animated.View>
  );
}

function AnimatedLine({ line, animation }) {
  const opacity = animation ? animation.opacity : line.opacity;
  return (
    <Animated.View
      style={{
        position: "absolute",
        top: line.top,
        right: line.right,
        bottom: line.bottom,
        left: line.left,
        width: line.width,
        height: 4,
        transform: [line.rotate ? { rotate: `${line.rotate}deg` } : {}],
        opacity,
      }}
    >
      <Svg width={line.width} height={4}>
        <Rect
          x={0}
          y={0}
          width={line.width}
          height={4}
          fill={line.color}
          fillOpacity={line.opacity}
        />
      </Svg>
    </Animated.View>
  );
}

export default function BrandShapes({ style, variant = "landing" }) {
  const current = variantMap[variant] || variantMap.landing;

  // Example animation values (could be replaced with Animated API for dynamic transitions)
  const animation = {
    scale: 1,
    opacity: 1,
  };

  return (
    <View pointerEvents="none" style={[s.wrap, style]}>
      <AnimatedShape shape={current.a} animation={animation} />
      <AnimatedShape shape={current.b} animation={animation} />
      <AnimatedShape shape={current.c} animation={animation} />
      <AnimatedLine line={current.l1} animation={animation} />
      <AnimatedLine line={current.l2} animation={animation} />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
    zIndex: -1,
  },
});