import { View, Text, StyleSheet } from "react-native";
import { colors } from "../theme";

const RARITY_COLORS = {
  common:    "#64748b",
  rare:      "#2563eb",
  epic:      "#7c3aed",
  legendary: "#d97706",
};

export default function AchievementBadge({ achievement, earned = false, style }) {
  const rarityColor = RARITY_COLORS[achievement?.rarity] || RARITY_COLORS.common;

  return (
    <View style={[s.container, { borderColor: earned ? rarityColor : colors.border2, opacity: earned ? 1 : 0.45 }, style]}>
      <View style={[s.iconWrap, { backgroundColor: earned ? `${rarityColor}22` : colors.bg3 }]}>
        <Text style={s.icon}>🏆</Text>
      </View>
      <Text style={[s.name, { color: earned ? colors.text : colors.text3 }]} numberOfLines={1}>
        {achievement?.name}
      </Text>
      <Text style={s.xp}>+{achievement?.xp_reward} XP</Text>
      {earned && (
        <View style={[s.rarityBadge, { backgroundColor: rarityColor }]}>
          <Text style={s.rarityText}>{achievement?.rarity?.toUpperCase()}</Text>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { width: 90, alignItems: "center", backgroundColor: colors.card, borderWidth: 1.5, borderRadius: 16, padding: 10 },
  iconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center", marginBottom: 6 },
  icon: { fontSize: 24 },
  name: { fontFamily: "Inter_600SemiBold", fontSize: 10, textAlign: "center", marginBottom: 2 },
  xp: { fontFamily: "Inter_400Regular", fontSize: 10, color: colors.text3 },
  rarityBadge: { marginTop: 4, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6 },
  rarityText: { fontFamily: "Inter_700Bold", fontSize: 8, color: "#fff" },
});
