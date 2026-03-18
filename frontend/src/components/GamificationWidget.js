import { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { colors } from "../theme";
import XPBar from "./XPBar";
import AchievementBadge from "./AchievementBadge";
import api from "../api";

export default function GamificationWidget({ navigation, style }) {
  const [userXP, setUserXP] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [userAchievements, setUserAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [xp, all, earned] = await Promise.all([
        api.getUserXP(),
        api.getAchievements(),
        api.getUserAchievements(),
      ]);
      setUserXP(xp);
      setAchievements(all || []);
      setUserAchievements(earned || []);
    } catch (e) {
      console.error("GamificationWidget error:", e);
    } finally {
      setLoading(false);
    }
  };

  const earnedIds = new Set(userAchievements.map(ua => ua.achievement_id));

  if (loading) {
    return (
      <View style={[s.container, style]}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[s.container, style]}>
      <View style={s.header}>
        <Text style={s.title}>Your Progress</Text>
        <TouchableOpacity onPress={() => navigation?.navigate("BossBattle")} style={s.bossBtn}>
          <Text style={s.bossBtnText}>⚔ Boss Battle</Text>
        </TouchableOpacity>
      </View>

      {userXP && (
        <XPBar totalXP={userXP.total_xp} level={userXP.level} style={s.xpBar} />
      )}

      <Text style={s.achievementsLabel}>
        Achievements ({userAchievements.length}/{achievements.length})
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.achievementScroll}>
        {achievements.map(ach => (
          <AchievementBadge
            key={ach.id}
            achievement={ach}
            earned={earnedIds.has(ach.id)}
            style={s.badge}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border2, borderRadius: 20, padding: 16 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  title: { fontFamily: "Inter_700Bold", fontSize: 16, color: colors.text },
  bossBtn: { backgroundColor: colors.primaryBg, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  bossBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: colors.primary },
  xpBar: { marginBottom: 14 },
  achievementsLabel: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: colors.text2, marginBottom: 10 },
  achievementScroll: { marginHorizontal: -4 },
  badge: { marginHorizontal: 4 },
});
