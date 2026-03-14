import { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, RefreshControl, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colors, CATEGORIES } from "../theme";
import { api } from "../api";
import SubCard from "../components/SubCard";
import SubModal from "../components/SubModal";
import AnalyticsPanel from "../components/AnalyticsPanel";
import { syncRenewalReminders } from "../notifications";
import StaggerReveal from "../components/StaggerReveal";
import InteractiveButton from "../components/InteractiveButton";
import BrandShapes from "../components/BrandShapes";

const FREE_LIMIT = 10;

export default function DashboardScreen({ navigation }) {
  const [subs, setSubs] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editSub, setEditSub] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [filterCat, setFilterCat] = useState("All");
  const [showAnalytics, setShowAnalytics] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  const fetchAll = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const [subsData, analyticsData, meData] = await Promise.all([api.listSubs(), api.analytics(), api.me()]);
      setSubs(subsData);
      setAnalytics(analyticsData);
      setUserInfo(meData);
      await AsyncStorage.setItem("st_user", JSON.stringify({ id: meData.user_id, email: meData.email, name: meData.full_name, plan: meData.plan }));

      const reminderPref = await AsyncStorage.getItem("st_notifications");
      const remindersOn = reminderPref === "true";
      setNotificationsEnabled(remindersOn);

      if (remindersOn && Platform.OS !== "web") {
        const reminderData = await api.reminderCandidates(30);
        await syncRenewalReminders(reminderData.items || []);
      }
    } catch (e) {
      if (e.message?.includes("401")) {
        await AsyncStorage.multiRemove(["st_token", "st_user"]);
        navigation.reset({ index: 0, routes: [{ name: "Landing" }] });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [navigation]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleLogout = async () => {
    await AsyncStorage.multiRemove(["st_token", "st_user"]);
    navigation.reset({ index: 0, routes: [{ name: "Landing" }] });
  };

  const handleDelete = (id) => {
    Alert.alert("Delete Subscription", "Are you sure you want to delete this subscription?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await api.deleteSub(id);
          fetchAll();
        },
      },
    ]);
  };

  const handleEdit = (sub) => {
    setEditSub(sub);
    setModalVisible(true);
  };

  const handleAdd = () => {
    const activeCount = subs.filter((s) => s.is_active).length;
    const isPro = userInfo?.plan !== "free";
    if (!isPro && activeCount >= FREE_LIMIT) {
      Alert.alert("Free Plan Limit", `Free plan supports up to ${FREE_LIMIT} active subscriptions.`, [
        { text: "Maybe Later", style: "cancel" },
        { text: "See Pricing", onPress: () => navigation.navigate("Pricing") },
      ]);
      return;
    }
    setEditSub(null);
    setModalVisible(true);
  };

  const handleSaved = () => {
    setModalVisible(false);
    setEditSub(null);
    fetchAll();
  };

  const filteredSubs = subs.filter((s) => {
    if (activeTab === "active" && !s.is_active) return false;
    if (activeTab === "inactive" && s.is_active) return false;
    if (filterCat !== "All" && s.category !== filterCat) return false;
    return true;
  });

  const isPro = userInfo?.plan !== "free";
  const activeCount = subs.filter((s) => s.is_active).length;
  const atLimit = !isPro && activeCount >= FREE_LIMIT;

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.topChrome}>
        <View>
          <Text style={s.brand}>SubTrack</Text>
          <Text style={s.welcome}>{userInfo?.full_name || userInfo?.email || "Your subscription workspace"}</Text>
        </View>
        <View style={s.topActions}>
          {!isPro && (
            <TouchableOpacity onPress={() => navigation.navigate("Pricing")} hitSlop={8}>
              <LinearGradient colors={[colors.primary, "#1f7a73"]} style={s.upgradeBtn}>
                <Text style={s.upgradeBtnText}>Go Pro</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => navigation.navigate("Settings")} style={s.iconBtn} hitSlop={8}><Text style={s.iconTxt}>⚙</Text></TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} style={s.iconBtn} hitSlop={8}><Text style={s.iconTxt}>↩</Text></TouchableOpacity>
        </View>
      </View>

      <SubModal visible={modalVisible} sub={editSub} onClose={() => { setModalVisible(false); setEditSub(null); }} onSaved={handleSaved} />

      <ScrollView
        style={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAll(true); }} tintColor={colors.primary} />}
      >
        <StaggerReveal delay={70} profile="snappy">
          <LinearGradient colors={["#fff8eb", "#f6f3ea"]} style={s.heroCard}>
          <BrandShapes variant="dashboard" style={s.heroShapes} />
          <View style={s.heroRow}>
            <View>
              <Text style={s.heroTitle}>My subscriptions</Text>
              <Text style={s.heroSub}>{activeCount} active{!isPro ? ` • ${FREE_LIMIT} max on free` : " • Unlimited on Pro"}</Text>
            </View>
            <View style={s.heroActions}>
              <TouchableOpacity onPress={() => setShowAnalytics((v) => !v)} style={[s.toggleBtn, showAnalytics && s.toggleBtnActive]} hitSlop={8}>
                <Text style={[s.toggleBtnText, showAnalytics && s.toggleBtnTextActive]}>Insights</Text>
              </TouchableOpacity>
              <InteractiveButton label="+ Add" onPress={handleAdd} style={s.addWrap} textStyle={s.addTxt} />
            </View>
          </View>

          {atLimit && (
            <View style={s.limitBanner}>
              <Text style={s.limitTxt}>Free limit reached. Upgrade for unlimited tracking.</Text>
              <TouchableOpacity onPress={() => navigation.navigate("Pricing")} style={s.limitCta} hitSlop={8}><Text style={s.limitCtaTxt}>Upgrade</Text></TouchableOpacity>
            </View>
          )}

          <View style={s.reminderBanner}>
            <Text style={s.reminderText}>
              {Platform.OS === "web"
                ? "Web reminder fallback: renewals are tracked in-app on this dashboard. Use mobile for device-level local alerts."
                : notificationsEnabled
                ? "Local reminder notifications are enabled on this device."
                : "Turn on reminders in Settings to schedule local alerts on this device."}
            </Text>
          </View>
          </LinearGradient>
        </StaggerReveal>

        {showAnalytics && (
          <StaggerReveal style={s.analyticsWrap} delay={130} profile="smooth">
            <AnalyticsPanel analytics={analytics} />
          </StaggerReveal>
        )}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filters} contentContainerStyle={s.filtersInner}>
          {["all", "active", "inactive"].map((tab) => (
            <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={[s.chip, activeTab === tab && s.chipActive]}>
              <Text style={[s.chipText, activeTab === tab && s.chipTextActive]}>{tab.charAt(0).toUpperCase() + tab.slice(1)}</Text>
            </TouchableOpacity>
          ))}
          <View style={s.divider} />
          {["All", ...CATEGORIES].map((cat) => (
            <TouchableOpacity key={cat} onPress={() => setFilterCat(cat)} style={[s.chip, filterCat === cat && s.chipActive]}>
              <Text style={[s.chipText, filterCat === cat && s.chipTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {loading ? (
          <View style={s.center}><ActivityIndicator color={colors.primary} size="large" /></View>
        ) : filteredSubs.length === 0 ? (
          <StaggerReveal style={s.empty} delay={190} profile="smooth">
            <Text style={s.emptyTitle}>{subs.length === 0 ? "No subscriptions yet" : "No matches"}</Text>
            <Text style={s.emptySub}>{subs.length === 0 ? "Add your first subscription to start tracking." : "Try a different filter."}</Text>
            {subs.length === 0 && (
              <TouchableOpacity onPress={handleAdd} hitSlop={8}>
                <LinearGradient colors={[colors.primary, "#1f7a73"]} style={s.emptyBtn}><Text style={s.emptyBtnText}>Add First Subscription</Text></LinearGradient>
              </TouchableOpacity>
            )}
          </StaggerReveal>
        ) : (
          <StaggerReveal style={s.list} delay={190} profile="smooth">{filteredSubs.map((sub) => <SubCard key={sub.id} sub={sub} onEdit={handleEdit} onDelete={handleDelete} />)}</StaggerReveal>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topChrome: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: colors.bg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border2,
  },
  brand: { fontFamily: "Poppins_800ExtraBold", fontSize: 24, color: colors.text },
  welcome: { fontFamily: "Inter_500Medium", fontSize: 12, color: colors.text3, marginTop: 2, maxWidth: 190 },
  topActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  upgradeBtn: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 9 },
  upgradeBtnText: { fontFamily: "Inter_700Bold", color: "#fff", fontSize: 12 },
  iconBtn: { borderWidth: 1, borderColor: colors.border2, borderRadius: 10, width: 36, height: 36, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.6)" },
  iconTxt: { fontFamily: "Inter_700Bold", color: colors.text2, fontSize: 15 },

  scroll: { flex: 1 },
  heroCard: { margin: 20, marginBottom: 12, borderRadius: 22, padding: 18, borderWidth: 1, borderColor: colors.border2, overflow: "hidden" },
  heroShapes: { opacity: 0.65 },
  heroRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  heroTitle: { fontFamily: "Poppins_800ExtraBold", fontSize: 27, color: colors.text },
  heroSub: { fontFamily: "Inter_500Medium", fontSize: 12, color: colors.text3, marginTop: 4 },
  heroActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  toggleBtn: { borderWidth: 1, borderColor: colors.border2, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: "rgba(255,255,255,0.67)" },
  toggleBtnActive: { borderColor: colors.primary, backgroundColor: "rgba(18,94,89,0.10)" },
  toggleBtnText: { fontFamily: "Inter_600SemiBold", color: colors.text3, fontSize: 12 },
  toggleBtnTextActive: { color: colors.primary },
  addWrap: { minWidth: 86 },
  addTxt: { fontSize: 13 },

  limitBanner: {
    marginTop: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(194,65,12,0.23)",
    backgroundColor: "rgba(194,65,12,0.08)",
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  limitTxt: { fontFamily: "Inter_500Medium", color: colors.warning, fontSize: 12, flex: 1 },
  limitCta: { borderRadius: 8, backgroundColor: colors.warning, paddingHorizontal: 10, paddingVertical: 8 },
  limitCtaTxt: { fontFamily: "Inter_700Bold", color: "#fff", fontSize: 12 },
  reminderBanner: {
    marginTop: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(18,94,89,0.18)",
    backgroundColor: "rgba(18,94,89,0.08)",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  reminderText: { fontFamily: "Inter_500Medium", color: colors.text2, fontSize: 12, lineHeight: 17 },

  analyticsWrap: { paddingHorizontal: 20, marginBottom: 6 },

  filters: { marginBottom: 8 },
  filtersInner: { paddingHorizontal: 20, gap: 8, alignItems: "center" },
  chip: { borderWidth: 1, borderColor: colors.border2, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: "rgba(255,255,255,0.68)" },
  chipActive: { borderColor: colors.primary, backgroundColor: "rgba(18,94,89,0.11)" },
  chipText: { fontFamily: "Inter_500Medium", fontSize: 12, color: colors.text3 },
  chipTextActive: { color: colors.primary, fontFamily: "Inter_700Bold" },
  divider: { width: 1, height: 24, backgroundColor: colors.border2, marginHorizontal: 2 },

  center: { alignItems: "center", justifyContent: "center", paddingVertical: 80 },
  empty: { marginHorizontal: 20, marginTop: 12, borderRadius: 18, borderWidth: 1, borderColor: colors.border2, backgroundColor: colors.card, padding: 24, alignItems: "center" },
  emptyTitle: { fontFamily: "Poppins_800ExtraBold", color: colors.text, fontSize: 24, textAlign: "center" },
  emptySub: { fontFamily: "Inter_400Regular", color: colors.text3, fontSize: 14, textAlign: "center", lineHeight: 20, marginTop: 8, marginBottom: 16 },
  emptyBtn: { borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12 },
  emptyBtnText: { fontFamily: "Inter_700Bold", color: "#fff", fontSize: 14 },

  list: { paddingHorizontal: 20, paddingBottom: 30 },
});
