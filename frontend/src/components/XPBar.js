import { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { colors } from "../theme";

export default function XPBar({ totalXP = 0, level = 1, style }) {
  const xpInLevel = totalXP % 500;
  const xpPercent = xpInLevel / 500;
  const barAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(barAnim, {
      toValue: xpPercent,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [xpPercent]);

  return (
    <View style={[s.container, style]}>
      <View style={s.row}>
        <Text style={s.levelBadge}>Lv {level}</Text>
        <Text style={s.xpText}>{totalXP} XP</Text>
        <Text style={s.nextText}>{500 - xpInLevel} to next</Text>
      </View>
      <View style={s.barBg}>
        <Animated.View
          style={[s.barFill, {
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
  row: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  levelBadge: { fontFamily: "Inter_700Bold", fontSize: 12, color: "#fff", backgroundColor: colors.primary, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, overflow: "hidden", marginRight: 8 },
  xpText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: colors.text, flex: 1 },
  nextText: { fontFamily: "Inter_400Regular", fontSize: 11, color: colors.text3 },
  barBg: { height: 8, backgroundColor: colors.primaryBg2, borderRadius: 4, overflow: "hidden" },
  barFill: { height: "100%", backgroundColor: colors.primary, borderRadius: 4 },
});
