import { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, RefreshControl } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colors, CATEGORIES } from "../theme";
import { api } from "../api";
import SubCard from "../components/SubCard";
import SubModal from "../components/SubModal";
import AnalyticsPanel from "../components/AnalyticsPanel";

const FREE_LIMIT = 10;

export default function DashboardScreen({ navigation }) {
  const [subs, setSubs]           = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [userInfo, setUserInfo]   = useState(null);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editSub, setEditSub]     = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [filterCat, setFilterCat] = useState("All");
  const [showAnalytics, setShowAnalytics] = useState(false);

  const fetchAll = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const [subsData, analyticsData, meData] = await Promise.all([
        api.listSubs(),
        api.analytics(),
        api.me(),
      ]);
      setSubs(subsData);
      setAnalytics(analyticsData);
      setUserInfo(meData);
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

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleLogout = async () => {
    await AsyncStorage.multiRemove(["st_token", "st_user"]);
    navigation.reset({ index: 0, routes: [{ name: "Landing" }] });
  };

  const handleDelete = (id) => {
    Alert.alert("Delete Subscription", "Are you sure you want to delete this subscription?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
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
    const activeCount = subs.filter(s => s.is_active).length;
    const isPro = userInfo?.plan !== "free";
    if (!isPro && activeCount >= FREE_LIMIT) {
      Alert.alert("Free Plan Limit", `Free plan supports up to ${FREE_LIMIT} active subscriptions.\n\nUpgrade to Pro for unlimited.`, [
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

  const filteredSubs = subs.filter(s => {
    if (activeTab === "active"   && !s.is_active) return false;
    if (activeTab === "inactive" &&  s.is_active) return false;
    if (filterCat !== "All" && s.category !== filterCat) return false;
    return true;
  });

  const isPro = userInfo?.plan !== "free";
  const activeCount = subs.filter(s => s.is_active).length;
  const atLimit = !isPro && activeCount >= FREE_LIMIT;

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <Text style={s.logoIcon}>💳</Text>
          <Text style={s.logo}>SubTrack</Text>
          <View style={[s.planBadge, isPro ? s.proBadge : s.freeBadge]}>
            <Text style={[s.planBadgeText, isPro ? { color: colors.cyan } : { color: colors.primaryLight }]}>
              {isPro ? "PRO" : "FREE"}
            </Text>
          </View>
        </View>
        <View style={s.headerRight}>
          {!isPro && (
            <TouchableOpacity onPress={() => navigation.navigate("Pricing")} style={s.upgradeBtn}>
              <LinearGradient colors={[colors.primary, colors.cyan]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.upgradeBtnGrad}>
                <Text style={s.upgradeBtnText}>⚡ Pro</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={handleLogout} style={s.logoutBtn}>
            <Text style={s.logoutText}>Exit</Text>
          </TouchableOpacity>
        </View>
      </View>

      <SubModal
        visible={modalVisible}
        sub={editSub}
        onClose={() => { setModalVisible(false); setEditSub(null); }}
        onSaved={handleSaved}
      />

      <ScrollView
        style={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAll(true); }} tintColor={colors.primary} />}
      >
        {/* Top bar */}
        <View style={s.topBar}>
          <View>
            <Text style={s.pageTitle}>My Subscriptions</Text>
            <Text style={s.pageSub}>
              {activeCount} active{!isPro ? ` · ${FREE_LIMIT} max on free` : ""}
            </Text>
          </View>
          <View style={s.topBtns}>
            <TouchableOpacity onPress={() => setShowAnalytics(v => !v)} style={[s.analyticsBtn, showAnalytics && s.analyticsBtnActive]}>
              <Text style={[s.analyticsBtnText, showAnalytics && { color: colors.cyan }]}>📊</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleAdd} style={s.addBtnWrap}>
              <LinearGradient colors={[colors.primary, colors.cyan]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.addBtn}>
                <Text style={s.addBtnText}>+ Add</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Free limit banner */}
        {atLimit && (
          <View style={s.limitBanner}>
            <View>
              <Text style={s.limitTitle}>Free plan limit reached</Text>
              <Text style={s.limitSub}>Upgrade to Pro for unlimited subscriptions.</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate("Pricing")} style={s.limitBtn}>
              <Text style={s.limitBtnText}>Upgrade</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Analytics panel */}
        {showAnalytics && (
          <View style={s.analyticsPanel}>
            <AnalyticsPanel analytics={analytics} />
          </View>
        )}

        {/* Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filters} contentContainerStyle={s.filtersContent}>
          {["all", "active", "inactive"].map(tab => (
            <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={[s.filterChip, activeTab === tab && s.filterChipActive]}>
              <Text style={[s.filterChipText, activeTab === tab && s.filterChipActiveText]}>{tab.charAt(0).toUpperCase() + tab.slice(1)}</Text>
            </TouchableOpacity>
          ))}
          <View style={s.filterDivider} />
          {["All", ...CATEGORIES].map(cat => (
            <TouchableOpacity key={cat} onPress={() => setFilterCat(cat)} style={[s.filterChip, filterCat === cat && s.filterChipActive]}>
              <Text style={[s.filterChipText, filterCat === cat && s.filterChipActiveText]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Content */}
        {loading ? (
          <View style={s.center}>
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        ) : filteredSubs.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyIcon}>💳</Text>
            <Text style={s.emptyTitle}>{subs.length === 0 ? "No subscriptions yet" : "No matches"}</Text>
            <Text style={s.emptySub}>{subs.length === 0 ? "Tap + Add to track your first subscription." : "Try changing the filter."}</Text>
            {subs.length === 0 && (
              <TouchableOpacity onPress={handleAdd} style={s.emptyAddBtnWrap}>
                <LinearGradient colors={[colors.primary, colors.cyan]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.emptyAddBtn}>
                  <Text style={s.emptyAddBtnText}>+ Add First Subscription</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={s.list}>
            {filteredSubs.map(sub => (
              <SubCard key={sub.id} sub={sub} onEdit={handleEdit} onDelete={handleDelete} />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: colors.bg },

  header:       { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderColor: colors.border2, backgroundColor: colors.bg },
  headerLeft:   { flexDirection: "row", alignItems: "center", gap: 8 },
  logoIcon:     { fontSize: 20 },
  logo:         { fontFamily: "Poppins_800ExtraBold", fontSize: 18, color: colors.primaryLight },
  planBadge:    { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, borderWidth: 1 },
  freeBadge:    { borderColor: "rgba(124,58,237,0.3)", backgroundColor: "rgba(124,58,237,0.1)" },
  proBadge:     { borderColor: "rgba(6,182,212,0.3)", backgroundColor: "rgba(6,182,212,0.1)" },
  planBadgeText:{ fontFamily: "Inter_700Bold", fontSize: 10, letterSpacing: 0.5 },
  headerRight:  { flexDirection: "row", alignItems: "center", gap: 8 },
  upgradeBtn:   { borderRadius: 8, overflow: "hidden" },
  upgradeBtnGrad:{ paddingHorizontal: 12, paddingVertical: 7 },
  upgradeBtnText:{ fontFamily: "Inter_700Bold", fontSize: 12, color: "#fff" },
  logoutBtn:    { borderWidth: 1, borderColor: colors.border2, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7 },
  logoutText:   { fontFamily: "Inter_500Medium", fontSize: 12, color: colors.text4 },

  scroll:       { flex: 1 },

  topBar:       { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, paddingBottom: 12 },
  pageTitle:    { fontFamily: "Poppins_800ExtraBold", fontSize: 22, color: colors.text },
  pageSub:      { fontFamily: "Inter_400Regular", fontSize: 13, color: colors.text3, marginTop: 2 },
  topBtns:      { flexDirection: "row", gap: 8, alignItems: "center" },
  analyticsBtn: { width: 40, height: 40, borderRadius: 10, borderWidth: 1, borderColor: colors.border2, alignItems: "center", justifyContent: "center", backgroundColor: colors.card },
  analyticsBtnActive: { borderColor: "rgba(6,182,212,0.3)", backgroundColor: "rgba(6,182,212,0.1)" },
  analyticsBtnText:   { fontSize: 18 },
  addBtnWrap:   { borderRadius: 10, overflow: "hidden" },
  addBtn:       { paddingHorizontal: 18, paddingVertical: 10 },
  addBtnText:   { fontFamily: "Inter_700Bold", fontSize: 14, color: "#fff" },

  limitBanner:  { marginHorizontal: 20, marginBottom: 12, backgroundColor: "rgba(124,58,237,0.1)", borderWidth: 1, borderColor: "rgba(124,58,237,0.3)", borderRadius: 14, padding: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 },
  limitTitle:   { fontFamily: "Inter_600SemiBold", fontSize: 14, color: colors.primaryLight },
  limitSub:     { fontFamily: "Inter_400Regular", fontSize: 12, color: colors.text3, marginTop: 2 },
  limitBtn:     { backgroundColor: colors.primary, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, flexShrink: 0 },
  limitBtnText: { fontFamily: "Inter_700Bold", fontSize: 13, color: "#fff" },

  analyticsPanel:{ paddingHorizontal: 20, marginBottom: 4 },

  filters:      { paddingBottom: 8 },
  filtersContent:{ paddingHorizontal: 20, gap: 8, paddingVertical: 4 },
  filterChip:   { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: colors.border2, backgroundColor: colors.card },
  filterChipActive:{ borderColor: "rgba(124,58,237,0.4)", backgroundColor: "rgba(124,58,237,0.12)" },
  filterChipText:{ fontFamily: "Inter_500Medium", fontSize: 13, color: colors.text3 },
  filterChipActiveText: { color: colors.primaryLight, fontFamily: "Inter_600SemiBold" },
  filterDivider:{ width: 1, backgroundColor: colors.border2, marginHorizontal: 4 },

  center:       { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 80 },
  empty:        { alignItems: "center", padding: 40, paddingTop: 60 },
  emptyIcon:    { fontSize: 48, marginBottom: 12 },
  emptyTitle:   { fontFamily: "Poppins_800ExtraBold", fontSize: 20, color: colors.text, marginBottom: 8, textAlign: "center" },
  emptySub:     { fontFamily: "Inter_400Regular", fontSize: 15, color: colors.text3, textAlign: "center", marginBottom: 28 },
  emptyAddBtnWrap: { borderRadius: 12, overflow: "hidden" },
  emptyAddBtn:  { paddingHorizontal: 28, paddingVertical: 14 },
  emptyAddBtnText: { fontFamily: "Inter_700Bold", fontSize: 15, color: "#fff" },

  list:         { paddingHorizontal: 20, paddingBottom: 32 },
});
