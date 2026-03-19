import { useState, useEffect, useRef } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, Animated, Alert, SafeAreaView
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../theme";
import api from "../api";

export default function BossBattleScreen({ navigation }) {
  const [boss, setBoss] = useState(null);
  const [userXP, setUserXP] = useState(null);
  const [subs, setSubs] = useState([]);
  const [selectedSub, setSelectedSub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [attacking, setAttacking] = useState(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const hpAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [bossData, xpData, subsData] = await Promise.all([
        api.getActiveBoss(),
        api.getUserXP(),
        api.listSubs(),
      ]);
      setBoss(bossData);
      setUserXP(xpData);
      setSubs((subsData || []).filter(s => s.is_active));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const shakeBoss = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleAttack = () => {
    if (!selectedSub || !boss) return;
    Alert.alert(
      "Cancel Subscription?",
      `This will cancel "${selectedSub.name}" ($${selectedSub.amount}/mo) and deal damage to the boss!`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Attack!",
          style: "destructive",
          onPress: async () => {
            setAttacking(true);
            try {
              const damage = Math.round((selectedSub.amount || 5) * 10);
              await api.updateSub(selectedSub.id, { is_active: false });
              await api.dealBossDamage(boss.id, damage);
              const newXP = await api.updateUserXP(damage);
              setUserXP(newXP);
              shakeBoss();
              const newBossHP = Math.max(0, (boss.hp || boss.max_hp) - damage);
              setBoss(prev => ({ ...prev, hp: newBossHP }));
              Animated.timing(hpAnim, {
                toValue: newBossHP / boss.max_hp,
                duration: 600,
                useNativeDriver: false,
              }).start();
              setSubs(prev => prev.filter(s => s.id !== selectedSub.id));
              setSelectedSub(null);
              Alert.alert("Hit!", `You dealt ${damage} damage and earned ${damage} XP!`);
            } catch (e) {
              Alert.alert("Error", e.message || "Attack failed");
            } finally {
              setAttacking(false);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <LinearGradient colors={["#0a1628", "#0d1f3c"]} style={s.center}>
        <ActivityIndicator size="large" color={colors.primaryLight} />
      </LinearGradient>
    );
  }

  if (!boss) {
    return (
      <LinearGradient colors={["#0a1628", "#0d1f3c"]} style={s.center}>
        <Text style={s.noBossTitle}>No Active Boss</Text>
        <Text style={s.noBossDesc}>Check back later for the next boss battle!</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backBtnText}>← Back</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#0a1628", "#0d1f3c", "#0f2744"]} style={s.flex}>
      <SafeAreaView style={s.flex}>
        <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={s.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={s.headerBack}>
              <Text style={s.headerBackText}>← Back</Text>
            </TouchableOpacity>
            <Text style={s.headerTitle}>Boss Battle</Text>
            <View style={{ width: 60 }} />
          </View>

          {/* Player XP */}
          {userXP && (
            <View style={s.playerCard}>
              <View>
                <Text style={s.playerLabel}>Level {userXP.level}</Text>
                <Text style={s.playerXP}>{userXP.total_xp} XP</Text>
              </View>
              <View style={s.xpBarBg}>
                <View style={[s.xpBarFill, { width: `${((userXP.total_xp % 500) / 500) * 100}%` }]} />
              </View>
            </View>
          )}

          {/* Boss Card */}
          <View style={s.bossCard}>
            <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
              <Text style={s.bossEmoji}>🐉</Text>
            </Animated.View>
            <Text style={s.bossName}>{boss.name}</Text>
            <Text style={s.bossDesc}>{boss.description}</Text>

            {/* HP Bar */}
            <View style={s.hpSection}>
              <View style={s.hpLabels}>
                <Text style={s.hpLabel}>HP</Text>
                <Text style={s.hpValue}>{boss.hp} / {boss.max_hp}</Text>
              </View>
              <View style={s.hpBarBg}>
                <Animated.View
                  style={[s.hpBarFill, {
                    width: hpAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["0%", "100%"],
                    })
                  }]}
                />
              </View>
            </View>
          </View>

          {/* Attack Section */}
          <View style={s.attackSection}>
            <Text style={s.attackTitle}>Choose Your Attack</Text>
            <Text style={s.attackSub}>Cancel a subscription to deal damage proportional to its cost</Text>

            {subs.length === 0 ? (
              <View style={s.noSubs}>
                <Text style={s.noSubsText}>No active subscriptions to cancel</Text>
              </View>
            ) : (
              subs.map(sub => (
                <TouchableOpacity
                  key={sub.id}
                  style={[s.subOption, selectedSub?.id === sub.id && s.subOptionSelected]}
                  onPress={() => setSelectedSub(sub.id === selectedSub?.id ? null : sub)}
                >
                  <View style={s.subOptionInfo}>
                    <Text style={s.subOptionName}>{sub.name}</Text>
                    <Text style={s.subOptionDmg}>⚔ {Math.round((sub.amount || 5) * 10)} damage</Text>
                  </View>
                  <Text style={s.subOptionAmt}>${sub.amount?.toFixed(2)}</Text>
                </TouchableOpacity>
              ))
            )}

            <TouchableOpacity
              style={[s.attackBtn, (!selectedSub || attacking) && s.attackBtnDisabled]}
              onPress={handleAttack}
              disabled={!selectedSub || attacking}
            >
              <LinearGradient
                colors={selectedSub && !attacking ? ["#dc2626", "#b91c1c"] : ["#374151", "#374151"]}
                style={s.attackBtnGrad}
              >
                <Text style={s.attackBtnText}>
                  {attacking ? "Attacking..." : selectedSub ? `⚔ Attack with ${selectedSub.name}` : "Select a subscription to attack"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  scroll: { flex: 1 },
  noBossTitle: { fontFamily: "Poppins_800ExtraBold", fontSize: 24, color: "#f8fafc", marginBottom: 8 },
  noBossDesc: { fontFamily: "Inter_400Regular", fontSize: 16, color: "rgba(248,250,252,0.7)", textAlign: "center", marginBottom: 24 },
  backBtn: { backgroundColor: "rgba(255,255,255,0.1)", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  backBtnText: { fontFamily: "Inter_600SemiBold", color: "#f8fafc", fontSize: 15 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  headerBack: { padding: 4 },
  headerBackText: { fontFamily: "Inter_600SemiBold", color: colors.primaryLight, fontSize: 15 },
  headerTitle: { fontFamily: "Poppins_800ExtraBold", fontSize: 20, color: "#f8fafc" },
  playerCard: { marginHorizontal: 20, marginBottom: 16, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 16, padding: 16, flexDirection: "row", alignItems: "center", gap: 16 },
  playerLabel: { fontFamily: "Inter_600SemiBold", color: colors.primaryLight, fontSize: 12 },
  playerXP: { fontFamily: "Poppins_800ExtraBold", color: "#f8fafc", fontSize: 20 },
  xpBarBg: { flex: 1, height: 8, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 4, overflow: "hidden" },
  xpBarFill: { height: "100%", backgroundColor: colors.primaryLight, borderRadius: 4 },
  bossCard: { marginHorizontal: 20, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 20, padding: 24, alignItems: "center", marginBottom: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  bossEmoji: { fontSize: 72, marginBottom: 12 },
  bossName: { fontFamily: "Poppins_900Black", fontSize: 26, color: "#f8fafc", textAlign: "center", marginBottom: 6 },
  bossDesc: { fontFamily: "Inter_400Regular", fontSize: 14, color: "rgba(248,250,252,0.7)", textAlign: "center", marginBottom: 16, lineHeight: 20 },
  hpSection: { width: "100%" },
  hpLabels: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  hpLabel: { fontFamily: "Inter_700Bold", color: "#ef4444", fontSize: 13 },
  hpValue: { fontFamily: "Inter_600SemiBold", color: "rgba(248,250,252,0.7)", fontSize: 13 },
  hpBarBg: { height: 12, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 6, overflow: "hidden" },
  hpBarFill: { height: "100%", backgroundColor: "#ef4444", borderRadius: 6 },
  attackSection: { marginHorizontal: 20, marginBottom: 32 },
  attackTitle: { fontFamily: "Poppins_800ExtraBold", fontSize: 20, color: "#f8fafc", marginBottom: 4 },
  attackSub: { fontFamily: "Inter_400Regular", fontSize: 13, color: "rgba(248,250,252,0.6)", marginBottom: 16 },
  noSubs: { backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 12, padding: 20, alignItems: "center" },
  noSubsText: { fontFamily: "Inter_400Regular", color: "rgba(248,250,252,0.5)", fontSize: 14 },
  subOption: { backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 14, padding: 14, flexDirection: "row", alignItems: "center", marginBottom: 8, borderWidth: 1, borderColor: "transparent" },
  subOptionSelected: { borderColor: colors.primaryLight, backgroundColor: "rgba(99,102,241,0.15)" },
  subOptionInfo: { flex: 1 },
  subOptionName: { fontFamily: "Inter_600SemiBold", color: "#f8fafc", fontSize: 15 },
  subOptionDmg: { fontFamily: "Inter_400Regular", color: "rgba(248,250,252,0.6)", fontSize: 12, marginTop: 2 },
  subOptionAmt: { fontFamily: "Inter_700Bold", color: colors.primaryLight, fontSize: 16 },
  attackBtn: { marginTop: 16, borderRadius: 16, overflow: "hidden" },
  attackBtnDisabled: { opacity: 0.5 },
  attackBtnGrad: { paddingVertical: 16, alignItems: "center" },
  attackBtnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#f8fafc" },
});
