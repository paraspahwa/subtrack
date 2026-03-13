import { View, StyleSheet } from "react-native";

const variantMap = {
  landing: {
    a: { top: -70, right: -50, width: 220, height: 220, radius: 999, color: "rgba(18,94,89,0.12)" },
    b: { bottom: 40, left: -30, width: 180, height: 180, radius: 24, color: "rgba(217,119,6,0.12)", rotate: "18deg" },
    c: { top: 90, right: 60, width: 120, height: 120, radius: 999, color: "rgba(255,255,255,0.46)" },
    l1: { top: 160, left: -40, width: 280, rotate: "-14deg", color: "rgba(18,94,89,0.12)" },
    l2: { bottom: 110, right: -70, width: 240, rotate: "22deg", color: "rgba(217,119,6,0.14)" },
  },
  pricing: {
    a: { top: -90, right: -20, width: 260, height: 260, radius: 999, color: "rgba(18,94,89,0.10)" },
    b: { bottom: 90, left: -50, width: 210, height: 140, radius: 26, color: "rgba(217,119,6,0.10)", rotate: "-16deg" },
    c: { top: 130, right: 20, width: 96, height: 96, radius: 18, color: "rgba(255,255,255,0.42)", rotate: "22deg" },
    l1: { top: 230, left: -30, width: 320, rotate: "-12deg", color: "rgba(18,94,89,0.10)" },
    l2: { bottom: 160, right: -50, width: 280, rotate: "19deg", color: "rgba(217,119,6,0.12)" },
  },
  dashboard: {
    a: { top: -70, right: -40, width: 200, height: 200, radius: 999, color: "rgba(18,94,89,0.10)" },
    b: { bottom: -10, left: -40, width: 160, height: 160, radius: 20, color: "rgba(217,119,6,0.10)", rotate: "14deg" },
    c: { top: 30, right: 120, width: 88, height: 88, radius: 999, color: "rgba(255,255,255,0.36)" },
    l1: { top: 92, left: -60, width: 240, rotate: "-10deg", color: "rgba(18,94,89,0.10)" },
    l2: { bottom: 34, right: -60, width: 220, rotate: "18deg", color: "rgba(217,119,6,0.12)" },
  },
  auth: {
    a: { top: -100, right: -70, width: 230, height: 230, radius: 999, color: "rgba(18,94,89,0.11)" },
    b: { bottom: 130, left: -70, width: 200, height: 160, radius: 24, color: "rgba(217,119,6,0.12)", rotate: "-20deg" },
    c: { top: 140, right: 20, width: 90, height: 90, radius: 999, color: "rgba(255,255,255,0.40)" },
    l1: { top: 230, left: -40, width: 260, rotate: "-16deg", color: "rgba(18,94,89,0.11)" },
    l2: { bottom: 210, right: -60, width: 240, rotate: "18deg", color: "rgba(217,119,6,0.14)" },
  },
  settings: {
    a: { top: -80, right: -50, width: 210, height: 210, radius: 999, color: "rgba(18,94,89,0.10)" },
    b: { bottom: 60, left: -60, width: 180, height: 140, radius: 24, color: "rgba(217,119,6,0.10)", rotate: "-18deg" },
    c: { top: 170, right: 15, width: 90, height: 90, radius: 999, color: "rgba(255,255,255,0.38)" },
    l1: { top: 290, left: -50, width: 280, rotate: "-12deg", color: "rgba(18,94,89,0.10)" },
    l2: { bottom: 140, right: -70, width: 240, rotate: "21deg", color: "rgba(217,119,6,0.12)" },
  },
  modal: {
    a: { top: -70, right: -45, width: 180, height: 180, radius: 999, color: "rgba(18,94,89,0.10)" },
    b: { bottom: 40, left: -45, width: 140, height: 140, radius: 18, color: "rgba(217,119,6,0.10)", rotate: "14deg" },
    c: { top: 120, right: 110, width: 72, height: 72, radius: 999, color: "rgba(255,255,255,0.34)" },
    l1: { top: 180, left: -60, width: 220, rotate: "-10deg", color: "rgba(18,94,89,0.09)" },
    l2: { bottom: 70, right: -40, width: 200, rotate: "18deg", color: "rgba(217,119,6,0.10)" },
  },
};

function shapeStyle(base) {
  return {
    position: "absolute",
    width: base.width,
    height: base.height,
    borderRadius: base.radius,
    backgroundColor: base.color,
    top: base.top,
    right: base.right,
    bottom: base.bottom,
    left: base.left,
    transform: base.rotate ? [{ rotate: base.rotate }] : undefined,
  };
}

function lineStyle(base) {
  return {
    position: "absolute",
    width: base.width,
    height: 2,
    backgroundColor: base.color,
    top: base.top,
    right: base.right,
    bottom: base.bottom,
    left: base.left,
    transform: [{ rotate: base.rotate }],
  };
}

export default function BrandShapes({ style, variant = "landing" }) {
  const current = variantMap[variant] || variantMap.landing;

  return (
    <View pointerEvents="none" style={[s.wrap, style]}>
      <View style={shapeStyle(current.a)} />
      <View style={shapeStyle(current.b)} />
      <View style={shapeStyle(current.c)} />
      <View style={lineStyle(current.l1)} />
      <View style={lineStyle(current.l2)} />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
});