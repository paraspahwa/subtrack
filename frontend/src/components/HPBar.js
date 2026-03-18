import { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { colors } from "../theme";

export default function HPBar({ currentHP = 100, maxHP = 100, style }) {
  const barAnim = useRef(new Animated.Value(maxHP > 0 ? currentHP / maxHP : 0)).current;

  useEffect(() => {
    Animated.timing(barAnim, {
      toValue: maxHP > 0 ? currentHP / maxHP : 0,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [currentHP, maxHP]);

  const pct = maxHP > 0 ? currentHP / maxHP : 0;
  const color = pct > 0.5 ? colors.success : pct > 0.25 ? colors.warning : colors.error;

  return (
    <View style={[s.container, style]}>
      <View style={s.row}>
        <Text style={s.label}>HP</Text>
        <Text style={s.value}>{currentHP} / {maxHP}</Text>
      </View>
      <View style={s.barBg}>
        <Animated.View
          style={[s.barFill, {
            backgroundColor: color,
            width: barAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ["0%", "100%"],
            })
          }]}
        />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {},
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  label: { fontFamily: "Inter_700Bold", fontSize: 12, color: colors.error },
  value: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: colors.text3 },
  barBg: { height: 8, backgroundColor: colors.errorBg, borderRadius: 4, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 4 },
});
