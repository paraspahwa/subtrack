import { View, Text, StyleSheet, TouchableOpacity, Linking } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, categoryColors } from "../theme";
import StaggerReveal from "./StaggerReveal";

const RATING_LABELS = ["", "Never use", "Rarely", "Sometimes", "Often", "Every day"];

function daysUntil(dateStr) {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr) - new Date()) / 86400000);
}

export default function AnalyticsPanel({ analytics }) {
  if (!analytics) return null;

  const {
    monthly_total,
    yearly_total,
    home_currency = "USD",
    active_count,
    by_category,
    upcoming_renewals,
    most_expensive,
    waste_subs = [],
    waste_monthly = 0,
    potential_yearly_savings = 0,
  } = analytics;

  const fmt = (val, curr = home_currency) => {
    try {
      return new Intl.NumberFormat("en-US", { style: "currency", currency: curr, maximumFractionDigits: val % 1 === 0 ? 0 : 2 }).format(val);
    } catch {
      return `${curr} ${Number(val).toFixed(2)}`;
    }
  };

  const catEntries = Object.entries(by_category || {}).sort((a, b) => b[1] - a[1]);
  const maxCat = catEntries[0]?.[1] || 1;

  const kpis = [
    { label: "Monthly",  value: fmt(monthly_total), icon: "📅", color: colors.primary },
    { label: "Yearly",   value: fmt(yearly_total),  icon: "📊", color: "#7c3aed" },
    { label: "Active",   value: String(active_count), icon: "✓", color: colors.success },
    { label: "Due Soon", value: String(upcoming_renewals?.length || 0), icon: "⏰", color: colors.warning },
  ];

  return (
    <View style={s.wrap}>
      {/* KPI row */}
      <StaggerReveal style={s.kpiRow} delay={40} profile="snappy">
        {kpis.map((k) => (
          <View key={k.label} style={s.kpiCard}>
            <Text style={s.kpiIcon}>{k.icon}</Text>
            <Text style={s.kpiValue}>{k.value}</Text>
            <Text style={s.kpiLabel}>{k.label}</Text>
          </View>
        ))}
      </StaggerReveal>

      {/* Spend by category */}
      {catEntries.length > 0 && (
        <StaggerReveal style={s.block} delay={70} profile="smooth">
          <Text style={s.blockTitle}>Spend by category</Text>
          {catEntries.map(([cat, val]) => {
            const cc = categoryColors[cat] || colors.primary;
            const pct = (val / maxCat) * 100;
            return (
              <View key={cat} style={s.barRow}>
                <View style={s.barHeader}>
                  <View style={s.barLabelRow}>
                    <View style={[s.barDot, { backgroundColor: cc }]} />
                    <Text style={s.barLabel}>{cat}</Text>
                  </View>
                  <Text style={s.barAmt}>{fmt(val)}/mo</Text>
                </View>
                <View style={s.barTrack}>
                  <View style={[s.barFill, { width: `${pct}%`, backgroundColor: cc }]} />
                </View>
              </View>
            );
          })}
        </StaggerReveal>
      )}

      {/* Upcoming renewals */}
      {upcoming_renewals?.length > 0 && (
        <StaggerReveal style={s.block} delay={100} profile="smooth">
          <Text style={s.blockTitle}>Upcoming renewals</Text>
          {upcoming_renewals.map((sub) => {
            const d = daysUntil(sub.next_billing_date);
            const urgent = d !== null && d <= 3;
            return (
              <View key={sub.id} style={s.row}>
                <View style={[s.rowAvatar, { backgroundColor: (sub.color || colors.primary) + "20" }]}>
                  <Text style={[s.rowAvatarText, { color: sub.color || colors.primary }]}>{sub.name[0]?.toUpperCase()}</Text>
                </View>
                <Text style={s.rowName} numberOfLines={1}>{sub.name}</Text>
                <Text style={s.rowAmt}>{fmt(sub.amount, sub.currency)}</Text>
                <View style={[s.dDayPill, urgent ? s.dDayUrgent : s.dDayNormal]}>
                  <Text style={[s.dDayText, { color: urgent ? colors.warning : colors.text3 }]}>
                    {d === 0 ? "Today" : `${d}d`}
                  </Text>
                </View>
              </View>
            );
          })}
        </StaggerReveal>
      )}

      {/* Highest costs */}
      {most_expensive?.length > 0 && (
        <StaggerReveal style={s.block} delay={130} profile="smooth">
          <Text style={s.blockTitle}>Highest monthly costs</Text>
          {most_expensive.map((sub, i) => (
            <View key={sub.id} style={s.row}>
              <View style={[s.rankBadge, i === 0 && s.rankGold, i === 1 && s.rankSilver, i === 2 && s.rankBronze]}>
                <Text style={[s.rankText, i === 0 && s.rankGoldText]}>{i + 1}</Text>
              </View>
              <Text style={s.rowName} numberOfLines={1}>{sub.name}</Text>
              <Text style={s.rowAmt}>{fmt(sub.monthly_cost)}/mo</Text>
            </View>
          ))}
        </StaggerReveal>
      )}

      {/* Savings */}
      {waste_subs.length > 0 && (
        <StaggerReveal delay={160} profile="smooth">
          <LinearGradient colors={["#fef2f2", "#fff5f5"]} style={s.savingsBlock}>
            <View style={s.savingsHead}>
              <View>
                <Text style={s.savingsTitle}>💡 Savings opportunities</Text>
                <Text style={s.savingsSubtitle}>Low-usage subscriptions worth cancelling</Text>
              </View>
              <View style={s.savingsPill}>
                <Text style={s.savingsPillText}>Save {fmt(potential_yearly_savings)}/yr</Text>
              </View>
            </View>

            <View style={s.savingsTiles}>
              <View style={s.tile}>
                <Text style={s.tileLabel}>Wasted monthly</Text>
                <Text style={[s.tileValue, { color: colors.error }]}>{fmt(waste_monthly)}</Text>
              </View>
              <View style={s.tile}>
                <Text style={s.tileLabel}>Potential yearly</Text>
                <Text style={[s.tileValue, { color: colors.success }]}>{fmt(potential_yearly_savings)}</Text>
              </View>
            </View>

            {waste_subs.map((sub) => (
              <View key={sub.id} style={s.row}>
                <Text style={s.rowName} numberOfLines={1}>{sub.name}</Text>
                <Text style={s.rowMeta}>{RATING_LABELS[sub.usage_rating || 0]}</Text>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={s.rowAmt}>{fmt(sub.monthly_cost)}/mo</Text>
                  {sub.cancel_url ? (
                    <TouchableOpacity onPress={() => Linking.openURL(sub.cancel_url)}>
                      <Text style={s.cancelLink}>Cancel →</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            ))}
          </LinearGradient>
        </StaggerReveal>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { paddingBottom: 8 },

  kpiRow: { flexDirection: "row", gap: 8, marginBottom: 10 },
  kpiCard: {
    flex: 1, borderRadius: 14, borderWidth: 1, borderColor: colors.border2,
    backgroundColor: colors.card, padding: 12, alignItems: "center",
    shadowColor: "#0f172a", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  kpiIcon:  { fontSize: 18, marginBottom: 4 },
  kpiValue: { fontFamily: "Poppins_800ExtraBold", color: colors.text, fontSize: 16, letterSpacing: -0.3 },
  kpiLabel: { fontFamily: "Inter_500Medium", color: colors.text4, fontSize: 10, marginTop: 2, textTransform: "uppercase", letterSpacing: 0.5 },

  block: {
    borderWidth: 1, borderColor: colors.border2, backgroundColor: colors.card,
    borderRadius: 16, padding: 14, marginBottom: 10,
    shadowColor: "#0f172a", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  blockTitle: { fontFamily: "Inter_700Bold", color: colors.text, fontSize: 14, marginBottom: 12 },

  barRow:    { marginBottom: 10 },
  barHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 5 },
  barLabelRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  barDot:    { width: 8, height: 8, borderRadius: 4 },
  barLabel:  { fontFamily: "Inter_600SemiBold", color: colors.text2, fontSize: 12 },
  barAmt:    { fontFamily: "Inter_700Bold", color: colors.text, fontSize: 12 },
  barTrack:  { height: 6, borderRadius: 99, backgroundColor: colors.bg3, overflow: "hidden" },
  barFill:   { height: "100%", borderRadius: 99 },

  row: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingVertical: 9, borderTopWidth: 1, borderTopColor: colors.border2,
  },
  rowAvatar: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  rowAvatarText: { fontFamily: "Inter_700Bold", fontSize: 12 },
  rowName:  { flex: 1, fontFamily: "Inter_600SemiBold", color: colors.text, fontSize: 13 },
  rowAmt:   { fontFamily: "Inter_700Bold", color: colors.text2, fontSize: 13 },
  rowMeta:  { fontFamily: "Inter_500Medium", color: colors.text3, fontSize: 12 },
  dDayPill: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  dDayUrgent: { backgroundColor: colors.warningBg },
  dDayNormal: { backgroundColor: colors.bg3 },
  dDayText: { fontFamily: "Inter_700Bold", fontSize: 11 },

  rankBadge: {
    width: 24, height: 24, borderRadius: 8,
    alignItems: "center", justifyContent: "center",
    backgroundColor: colors.bg3, borderWidth: 1, borderColor: colors.border2,
  },
  rankGold:   { backgroundColor: "#fef3c7", borderColor: "#fcd34d" },
  rankSilver: { backgroundColor: "#f1f5f9", borderColor: "#cbd5e1" },
  rankBronze: { backgroundColor: "#fdf4ec", borderColor: "#fdba74" },
  rankText:   { fontFamily: "Inter_700Bold", fontSize: 11, color: colors.text3 },
  rankGoldText: { color: "#d97706" },

  savingsBlock: { borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: "rgba(220,38,38,0.12)" },
  savingsHead:  { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  savingsTitle: { fontFamily: "Inter_700Bold", color: colors.text, fontSize: 14 },
  savingsSubtitle: { fontFamily: "Inter_400Regular", color: colors.text3, fontSize: 12, marginTop: 2 },
  savingsPill: {
    borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5,
    backgroundColor: colors.successBg, borderWidth: 1, borderColor: "rgba(22,163,74,0.2)",
  },
  savingsPillText: { fontFamily: "Inter_700Bold", fontSize: 11, color: colors.successText },
  savingsTiles:   { flexDirection: "row", gap: 8, marginBottom: 6 },
  tile: {
    flex: 1, borderRadius: 12, borderWidth: 1, borderColor: colors.border2,
    padding: 10, backgroundColor: "rgba(255,255,255,0.7)",
  },
  tileLabel: { fontFamily: "Inter_500Medium", color: colors.text3, fontSize: 11 },
  tileValue: { fontFamily: "Poppins_800ExtraBold", fontSize: 18, marginTop: 3 },
  cancelLink:{ fontFamily: "Inter_700Bold", fontSize: 11, color: colors.error, marginTop: 2 },
});
