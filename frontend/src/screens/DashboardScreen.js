import { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, RefreshControl, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, CATEGORIES } from "../theme";
import { api, insforge } from "../api";
import SubCard from "../components/SubCard";
import SubModal from "../components/SubModal";
import AnalyticsPanel from "../components/AnalyticsPanel";
import StaggerReveal from "../components/StaggerReveal";
import { useTheme } from "../ThemeContext";

const FREE_LIMIT = 3;

export default function DashboardScreen({ navigation }) {
  const { theme } = useTheme();
  const [subs, setSubs]                       = useState([]);
  const [analytics, setAnalytics]             = useState(null);
  const [actionCenterItems, setActionCenterItems] = useState([]);
  const [priceAlerts, setPriceAlerts]         = useState([]);
  const [userInfo, setUserInfo]               = useState(null);
  const [loading, setLoading]                 = useState(true);
  const [refreshing, setRefreshing]           = useState(false);
  const [actionLoadingMap, setActionLoadingMap]   = useState({});
  const [amountAlertLoadingMap, setAmountAlertLoadingMap] = useState({});
  const [priceAlertsLoading, setPriceAlertsLoading] = useState(true);
  const [modalVisible, setModalVisible]       = useState(false);
  const [editSub, setEditSub]                 = useState(null);
  const [activeTab, setActiveTab]             = useState("all");
  const [filterCat, setFilterCat]             = useState("All");
  const [showAnalytics, setShowAnalytics]     = useState(true);

  const fetchAll = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      // allSettled so a failing edge-function (analytics) never wipes the sub list
      const [subsRes, analyticsRes, meRes, actionRes] = await Promise.allSettled([
        api.listSubs(),
        api.analytics(),
        api.me(),
        api.actionCenterRisk(30),
      ]);

      if (subsRes.status === "fulfilled") {
        const d = subsRes.value;
        setSubs(Array.isArray(d) ? d : d?.items || []);
      }
      if (analyticsRes.status === "fulfilled") setAnalytics(analyticsRes.value);
      if (meRes.status === "fulfilled")        setUserInfo(meRes.value);

      if (actionRes.status === "fulfilled") {
        const d = actionRes.value;
        const now = Date.now();
        const enriched = (Array.isArray(d) ? d : d?.items || []).map((sub) => {
          const due = new Date(sub.next_billing_date);
          const due_in_days = Math.max(0, Math.ceil((due.getTime() - now) / (1000 * 60 * 60 * 24)));
          const reasons = [];
          if (due_in_days <= 7) reasons.push("due_within_7_days");
          else if (due_in_days <= 30) reasons.push("due_within_30_days");
          if (sub.usage_rating && sub.usage_rating <= 2) reasons.push("low_usage");
          return { ...sub, due_in_days, reasons };
        });
        setActionCenterItems(enriched);
      }
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, [navigation]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const fetchPriceAlerts = useCallback(async (showLoading = true) => {
    if (showLoading) setPriceAlertsLoading(true);
    try {
      const data = await api.priceAnomalies();
      setPriceAlerts(Array.isArray(data) ? data : data?.items || []);
    } catch {
      setPriceAlerts([]);
    } finally {
      if (showLoading) setPriceAlertsLoading(false);
    }
  }, []);

  useEffect(() => { fetchPriceAlerts(); }, [fetchPriceAlerts]);

  const handleLogout = async () => {
    await insforge.auth.signOut();
    navigation.reset({ index: 0, routes: [{ name: "Landing" }] });
  };

  const handleDelete = (id) => {
    Alert.alert("Delete subscription", "This action cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => { await api.deleteSub(id); fetchAll(); } },
    ]);
  };

  const handleEdit  = (sub) => { setEditSub(sub); setModalVisible(true); };

  const handleAdd = () => {
    const activeCount = subs.filter((s) => s.is_active).length;
    const isPro = userInfo?.plan !== "free";
    if (!isPro && activeCount >= FREE_LIMIT) {
      Alert.alert("Genin Limit Reached", "Genin rank can track 3 subscriptions. Upgrade to Chunin for unlimited tracking.", [
        { text: "Later", style: "cancel" },
        { text: "See Plans", onPress: () => navigation.navigate("Pricing") },
      ]);
      return;
    }
    setEditSub(null);
    setModalVisible(true);
  };

  const handleSaved = () => { setModalVisible(false); setEditSub(null); fetchAll(); fetchPriceAlerts(false); };

  const reasonLabel = (r) => ({
    low_usage:          "Low usage",
    due_within_7_days:  "Due in 7 days",
    due_within_30_days: "Due in 30 days",
  }[r] || r);

  const handleActionOutcome = async (id, outcome) => {
    setActionLoadingMap(p => ({ ...p, [id]: true }));
    try {
      await api.setCancellationOutcome(id, outcome);
      await fetchAll(true);
    } catch (e) {
      Alert.alert("Action failed", e.message || "Could not update outcome.");
    } finally {
      setActionLoadingMap(p => { const n = { ...p }; delete n[id]; return n; });
    }
  };

  const confirmCancelled = (id) => Alert.alert("Mark as Cancelled", "Confirm cancellation?", [
    { text: "Keep", style: "cancel" },
    { text: "Mark Cancelled", style: "destructive", onPress: () => handleActionOutcome(id, "cancelled") },
  ]);

  const handleDismissAmountAlert = async (id) => {
    setAmountAlertLoadingMap(p => ({ ...p, [id]: true }));
    try {
      await api.dismissAmountAlert(id);
      await fetchPriceAlerts(false);
    } catch (e) {
      Alert.alert("Action failed", e.message || "Could not dismiss alert.");
    } finally {
      setAmountAlertLoadingMap(p => { const n = { ...p }; delete n[id]; return n; });
    }
  };

  const fmt = (value, currency = "USD") => {
    try {
      return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 2 }).format(Number(value || 0));
    } catch {
      return `${currency} ${Number(value || 0).toFixed(2)}`;
    }
  };

  const fmtPct = (v) => { const n = Number(v || 0); return `${n > 0 ? "+" : ""}${n.toFixed(1)}%`; };

  const fmtChangedAt = (ts) => {
    if (!ts) return "Updated recently";
    const dt = new Date(ts);
    if (isNaN(dt)) return "Updated recently";
    const daysAgo = Math.max(0, Math.floor((Date.now() - dt) / 86400000));
    return `${dt.toLocaleDateString("en-US", { month: "short", day: "numeric" })} · ${daysAgo === 0 ? "today" : daysAgo === 1 ? "1 day ago" : `${daysAgo} days ago`}`;
  };

  const handleRefresh = () => { setRefreshing(true); fetchAll(true); fetchPriceAlerts(false); };

  const filteredSubs = subs.filter((s) => {
    if (activeTab === "active" && !s.is_active) return false;
    if (activeTab === "inactive" && s.is_active) return false;
    if (filterCat !== "All" && s.category !== filterCat) return false;
    return true;
  });

  const isPro       = userInfo?.plan !== "free";
  const activeCount = subs.filter((s) => s.is_active).length;
  const atLimit     = !isPro && activeCount >= FREE_LIMIT;

  const initials = userInfo?.full_name
    ? userInfo.full_name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
    : (userInfo?.email?.[0] || "U").toUpperCase();

  return (
    <SafeAreaView style={s.safe}>
      {/* Top chrome */}
      <View style={s.topChrome}>
        <View style={s.brandRow}>
          <View style={s.logoWrap}>
            <LinearGradient colors={[colors.primary, colors.primaryLight]} style={s.logoDot} />
          </View>
          <Text style={s.brand}>SubTrack</Text>
        </View>
        <View style={s.topActions}>
          {!isPro && (
            <TouchableOpacity onPress={() => navigation.navigate("Pricing")} hitSlop={8}>
              <LinearGradient colors={[theme.primary, theme.primaryLight]} style={s.proBadge}>
                <Text style={s.proBadgeText}>✦ Go Pro</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => navigation.navigate("Calendar")} style={s.iconBtn} hitSlop={8}>
            <Text style={s.iconTxt}>📅</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate("BossBattle")} style={s.iconBtn} hitSlop={8}>
            <Text style={s.iconTxt}>⚔</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate("Settings")} style={s.iconBtn} hitSlop={8}>
            <Text style={s.iconTxt}>⚙</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} style={[s.iconBtn, s.avatarBtn]} hitSlop={8}>
            <Text style={s.avatarTxt}>{initials}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <SubModal visible={modalVisible} sub={editSub} onClose={() => { setModalVisible(false); setEditSub(null); }} onSaved={handleSaved} />

      <ScrollView
        style={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
      >
        {/* Hero */}
        <StaggerReveal delay={60} profile="snappy">
          <LinearGradient colors={theme.heroGradient} style={s.heroCard}>
            <View style={s.heroContent}>
              <View>
                <Text style={s.heroGreet}>Hello{userInfo?.full_name ? `, ${userInfo.full_name.split(" ")[0]}` : ""} 👋</Text>
                <Text style={s.heroTitle}>{activeCount} active subscription{activeCount !== 1 ? "s" : ""}</Text>
                <Text style={s.heroSub}>{isPro ? "Chunin · Unlimited tracking" : activeCount >= FREE_LIMIT ? "Genin · Limit reached — upgrade for more" : `Genin · ${FREE_LIMIT - activeCount} slot${FREE_LIMIT - activeCount !== 1 ? "s" : ""} left`}</Text>
              </View>
              <View style={s.heroActions}>
                <TouchableOpacity onPress={() => setShowAnalytics(v => !v)} style={[s.toggleBtn, showAnalytics && s.toggleBtnActive]}>
                  <Text style={[s.toggleBtnText, showAnalytics && s.toggleBtnTextActive]}>Insights</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleAdd} style={s.addBtn}>
                  <Text style={s.addBtnText}>+ Add</Text>
                </TouchableOpacity>
              </View>
            </View>

            {atLimit && (
              <View style={s.limitBanner}>
                <Text style={s.limitTxt}>Genin limit reached — become Chunin for unlimited tracking.</Text>
                <TouchableOpacity onPress={() => navigation.navigate("Pricing")} style={s.limitCta} hitSlop={8}>
                  <Text style={s.limitCtaTxt}>Upgrade →</Text>
                </TouchableOpacity>
              </View>
            )}

            {Platform.OS === "web" && (
              <View style={s.reminderBanner}>
                <Text style={s.reminderText}>📱 Use the mobile app for device-level renewal reminders.</Text>
              </View>
            )}
          </LinearGradient>
        </StaggerReveal>

        {/* Analytics */}
        {showAnalytics && (
          <StaggerReveal style={s.analyticsWrap} delay={110} profile="smooth">
            <AnalyticsPanel analytics={analytics} />
          </StaggerReveal>
        )}

        {/* Action Center */}
        {actionCenterItems.length > 0 && (
          <View style={s.sectionWrap}>
            <View style={s.sectionHead}>
              <View style={s.sectionHeadLeft}>
                <View style={[s.sectionDot, { backgroundColor: colors.warning }]} />
                <Text style={s.sectionTitle}>Action Center</Text>
              </View>
              <View style={s.countPill}>
                <Text style={s.countPillText}>{actionCenterItems.length}</Text>
              </View>
            </View>
            {actionCenterItems.map((item) => {
              const isBusy = !!actionLoadingMap[item.id];
              return (
                <View key={item.id} style={s.actionRow}>
                  <View style={s.actionRowTop}>
                    <Text style={s.actionName}>{item.name}</Text>
                    <View style={[s.duePill, item.due_in_days <= 7 ? s.duePillUrgent : s.duePillNormal]}>
                      <Text style={[s.duePillText, item.due_in_days <= 7 ? { color: colors.warning } : { color: colors.text3 }]}>
                        {item.due_in_days}d left
                      </Text>
                    </View>
                  </View>
                  <View style={s.tagRow}>
                    {(item.reasons || []).map((r) => (
                      <View key={r} style={s.tagChip}><Text style={s.tagText}>{reasonLabel(r)}</Text></View>
                    ))}
                  </View>
                  <View style={s.actionBtns}>
                    <TouchableOpacity onPress={() => handleActionOutcome(item.id, "kept")} disabled={isBusy} style={[s.outBtn, isBusy && s.outBtnDisabled]}>
                      <Text style={s.outBtnText}>Keep</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => confirmCancelled(item.id)} disabled={isBusy} style={[s.outBtn, s.outBtnDanger, isBusy && s.outBtnDisabled]}>
                      <Text style={[s.outBtnText, { color: colors.error }]}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Price Alerts */}
        {(priceAlerts.length > 0 || priceAlertsLoading) && (
          <View style={s.sectionWrap}>
            <View style={s.sectionHead}>
              <View style={s.sectionHeadLeft}>
                <View style={[s.sectionDot, { backgroundColor: colors.info }]} />
                <Text style={s.sectionTitle}>Price Alerts</Text>
              </View>
              {!priceAlertsLoading && (
                <View style={[s.countPill, { backgroundColor: colors.infoBg }]}>
                  <Text style={[s.countPillText, { color: colors.info }]}>{priceAlerts.length}</Text>
                </View>
              )}
            </View>
            {priceAlertsLoading ? (
              <ActivityIndicator color={colors.primary} size="small" style={{ paddingVertical: 12 }} />
            ) : (
              priceAlerts.map((item) => {
                const isBusy = !!amountAlertLoadingMap[item.id];
                const pct = Number(item.amount_change_pct || 0);
                return (
                  <View key={item.id} style={s.priceRow}>
                    <View style={s.actionRowTop}>
                      <Text style={s.actionName}>{item.name}</Text>
                      <View style={[s.pctPill, pct >= 0 ? s.pctPillUp : s.pctPillDown]}>
                        <Text style={[s.pctText, { color: pct >= 0 ? colors.warning : colors.success }]}>{fmtPct(pct)}</Text>
                      </View>
                    </View>
                    <Text style={s.priceAmounts}>{fmt(item.last_amount, item.currency)} → {fmt(item.amount, item.currency)}</Text>
                    <View style={s.priceFooter}>
                      <Text style={s.priceMeta}>{fmtChangedAt(item.amount_changed_at)}</Text>
                      <TouchableOpacity onPress={() => handleDismissAmountAlert(item.id)} disabled={isBusy} style={[s.outBtn, isBusy && s.outBtnDisabled]}>
                        <Text style={s.outBtnText}>Dismiss</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filters} contentContainerStyle={s.filtersInner}>
          {["all", "active", "inactive"].map((tab) => (
            <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={[s.chip, activeTab === tab && s.chipActive]}>
              <Text style={[s.chipText, activeTab === tab && s.chipTextActive]}>{tab.charAt(0).toUpperCase() + tab.slice(1)}</Text>
            </TouchableOpacity>
          ))}
          <View style={s.filterDivider} />
          {["All", ...CATEGORIES].map((cat) => (
            <TouchableOpacity key={cat} onPress={() => setFilterCat(cat)} style={[s.chip, filterCat === cat && s.chipActive]}>
              <Text style={[s.chipText, filterCat === cat && s.chipTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Subscription list */}
        {loading ? (
          <View style={s.center}><ActivityIndicator color={colors.primary} size="large" /></View>
        ) : filteredSubs.length === 0 ? (
          <StaggerReveal style={s.emptyWrap} delay={170} profile="smooth">
            <View style={s.emptyCard}>
              <Text style={s.emptyEmoji}>{subs.length === 0 ? "📦" : "🔍"}</Text>
              <Text style={s.emptyTitle}>{subs.length === 0 ? "No subscriptions yet" : "No matches"}</Text>
              <Text style={s.emptySub}>{subs.length === 0 ? "Add your first subscription to start tracking spending." : "Try a different filter or tab."}</Text>
              {subs.length === 0 && (
                <TouchableOpacity onPress={handleAdd} style={s.emptyBtn}>
                  <LinearGradient colors={[colors.primary, colors.primaryLight]} style={s.emptyBtnGradient}>
                    <Text style={s.emptyBtnText}>+ Add First Subscription</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          </StaggerReveal>
        ) : (
          <StaggerReveal style={s.list} delay={170} profile="smooth">
            {filteredSubs.map((sub) => <SubCard key={sub.id} sub={sub} onEdit={handleEdit} onDelete={handleDelete} />)}
          </StaggerReveal>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },

  topChrome: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 20, paddingTop: 10, paddingBottom: 12,
    backgroundColor: colors.card,
    borderBottomWidth: 1, borderBottomColor: colors.border2,
    shadowColor: "#0f172a", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  brandRow:  { flexDirection: "row", alignItems: "center", gap: 8 },
  logoWrap:  {},
  logoDot:   { width: 8, height: 8, borderRadius: 4 },
  brand:     { fontFamily: "Poppins_800ExtraBold", fontSize: 22, color: colors.text, letterSpacing: -0.5 },

  topActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  proBadge:   { borderRadius: 10, paddingHorizontal: 11, paddingVertical: 8 },
  proBadgeText: { fontFamily: "Inter_700Bold", color: "#fff", fontSize: 12 },
  iconBtn:    {
    borderWidth: 1, borderColor: colors.border2, borderRadius: 10,
    width: 36, height: 36, alignItems: "center", justifyContent: "center",
    backgroundColor: colors.bg3,
  },
  iconTxt:   { fontFamily: "Inter_600SemiBold", color: colors.text3, fontSize: 15 },
  avatarBtn: { backgroundColor: colors.primaryBg2, borderColor: colors.primary + "30" },
  avatarTxt: { fontFamily: "Inter_800ExtraBold", color: colors.primary, fontSize: 13 },

  scroll: { flex: 1 },

  heroCard: { margin: 16, borderRadius: 20, padding: 20, overflow: "hidden" },
  heroContent: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  heroGreet: { fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.65)", fontSize: 13, marginBottom: 4 },
  heroTitle: { fontFamily: "Poppins_800ExtraBold", fontSize: 26, color: "#fff", lineHeight: 30, letterSpacing: -0.5 },
  heroSub:   { fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.6)", fontSize: 12, marginTop: 6 },
  heroActions: { gap: 8, alignItems: "flex-end" },
  toggleBtn: {
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.2)", backgroundColor: "rgba(255,255,255,0.10)",
  },
  toggleBtnActive:     { borderColor: "rgba(255,255,255,0.5)", backgroundColor: "rgba(255,255,255,0.18)" },
  toggleBtnText:       { fontFamily: "Inter_600SemiBold", color: "rgba(255,255,255,0.65)", fontSize: 12 },
  toggleBtnTextActive: { color: "#fff" },
  addBtn: {
    borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: "rgba(255,255,255,0.15)", borderWidth: 1, borderColor: "rgba(255,255,255,0.3)",
  },
  addBtnText: { fontFamily: "Inter_700Bold", color: "#fff", fontSize: 13 },

  limitBanner: {
    marginTop: 16, borderRadius: 12, padding: 12,
    backgroundColor: "rgba(255,255,255,0.10)", borderWidth: 1, borderColor: "rgba(255,255,255,0.18)",
    flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8,
  },
  limitTxt:  { fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.85)", fontSize: 12, flex: 1 },
  limitCta:  { borderRadius: 8, backgroundColor: "rgba(255,255,255,0.18)", paddingHorizontal: 10, paddingVertical: 7 },
  limitCtaTxt: { fontFamily: "Inter_700Bold", color: "#fff", fontSize: 12 },

  reminderBanner: {
    marginTop: 10, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  reminderText: { fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.55)", fontSize: 12 },

  analyticsWrap: { paddingHorizontal: 16, marginBottom: 4 },

  sectionWrap: {
    marginHorizontal: 16, marginBottom: 10,
    borderRadius: 16, borderWidth: 1, borderColor: colors.border2,
    backgroundColor: colors.card, padding: 14,
    shadowColor: "#0f172a", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  sectionHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionHeadLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionDot:  { width: 8, height: 8, borderRadius: 4 },
  sectionTitle:{ fontFamily: "Inter_700Bold", color: colors.text, fontSize: 14 },
  countPill:   {
    borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3,
    backgroundColor: colors.warningBg,
  },
  countPillText: { fontFamily: "Inter_700Bold", color: colors.warning, fontSize: 11 },

  actionRow: {
    borderWidth: 1, borderColor: colors.border2, borderRadius: 12,
    backgroundColor: colors.bg, padding: 12, marginTop: 8,
  },
  actionRowTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  actionName:  { flex: 1, fontFamily: "Inter_700Bold", color: colors.text2, fontSize: 14 },
  duePill:     { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  duePillUrgent: { backgroundColor: colors.warningBg },
  duePillNormal: { backgroundColor: colors.bg3 },
  duePillText: { fontFamily: "Inter_700Bold", fontSize: 11 },
  tagRow:      { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  tagChip:     {
    borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4,
    backgroundColor: colors.primaryBg, borderWidth: 1, borderColor: colors.border,
  },
  tagText:     { fontFamily: "Inter_600SemiBold", color: colors.primary, fontSize: 10 },
  actionBtns:  { flexDirection: "row", gap: 8, marginTop: 10 },
  outBtn: {
    borderRadius: 8, borderWidth: 1, borderColor: colors.border2,
    backgroundColor: colors.bg3, paddingHorizontal: 14, paddingVertical: 7,
  },
  outBtnDanger:  { borderColor: "rgba(220,38,38,0.18)", backgroundColor: colors.errorBg },
  outBtnDisabled:{ opacity: 0.5 },
  outBtnText:   { fontFamily: "Inter_700Bold", color: colors.text2, fontSize: 12 },

  priceRow: {
    borderWidth: 1, borderColor: colors.border2, borderRadius: 12,
    backgroundColor: colors.bg, padding: 12, marginTop: 8,
  },
  pctPill:  { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  pctPillUp:   { backgroundColor: colors.warningBg },
  pctPillDown: { backgroundColor: colors.successBg },
  pctText:     { fontFamily: "Inter_700Bold", fontSize: 11 },
  priceAmounts:{ marginTop: 6, fontFamily: "Inter_600SemiBold", fontSize: 13, color: colors.text2 },
  priceFooter: { marginTop: 8, flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  priceMeta:   { flex: 1, fontFamily: "Inter_500Medium", color: colors.text4, fontSize: 11 },

  filters:      { marginBottom: 8, marginTop: 4 },
  filtersInner: { paddingHorizontal: 16, gap: 8, alignItems: "center" },
  chip: {
    borderWidth: 1, borderColor: colors.border2, borderRadius: 999,
    paddingHorizontal: 13, paddingVertical: 8, backgroundColor: colors.card,
  },
  chipActive:    { borderColor: colors.primary, backgroundColor: colors.primaryBg },
  chipText:      { fontFamily: "Inter_500Medium", fontSize: 12, color: colors.text3 },
  chipTextActive:{ color: colors.primary, fontFamily: "Inter_700Bold" },
  filterDivider: { width: 1, height: 22, backgroundColor: colors.border2, marginHorizontal: 2 },

  center:  { alignItems: "center", justifyContent: "center", paddingVertical: 80 },
  emptyWrap: { marginHorizontal: 16, marginTop: 8, marginBottom: 20 },
  emptyCard: {
    borderRadius: 20, borderWidth: 1, borderColor: colors.border2,
    backgroundColor: colors.card, padding: 28, alignItems: "center",
  },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyTitle:{ fontFamily: "Poppins_800ExtraBold", color: colors.text, fontSize: 22, textAlign: "center" },
  emptySub:  { fontFamily: "Inter_400Regular", color: colors.text3, fontSize: 14, textAlign: "center", lineHeight: 21, marginTop: 8, marginBottom: 20 },
  emptyBtn:  { borderRadius: 12, overflow: "hidden" },
  emptyBtnGradient: { paddingHorizontal: 20, paddingVertical: 13 },
  emptyBtnText: { fontFamily: "Inter_700Bold", color: "#fff", fontSize: 14 },

  list: { paddingHorizontal: 16, paddingBottom: 30 },
});
