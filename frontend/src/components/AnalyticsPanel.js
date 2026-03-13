import { View, Text, StyleSheet, TouchableOpacity, Linking } from "react-native";
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
    active_count,
    by_category,
    upcoming_renewals,
    most_expensive,
    waste_subs = [],
    waste_monthly = 0,
    potential_yearly_savings = 0,
  } = analytics;

  const catEntries = Object.entries(by_category).sort((a, b) => b[1] - a[1]);
  const maxCat = catEntries[0]?.[1] || 1;

  return (
    <View style={s.wrap}>
      <StaggerReveal style={s.kpiGrid} delay={40} profile="snappy">
        {[
          { label: "Monthly", value: `$${monthly_total.toFixed(2)}` },
          { label: "Yearly", value: `$${yearly_total.toFixed(0)}` },
          { label: "Active", value: String(active_count) },
          { label: "Due Soon", value: String(upcoming_renewals.length) },
        ].map((kpi) => (
          <View key={kpi.label} style={s.kpiCard}>
            <Text style={s.kpiLabel}>{kpi.label}</Text>
            <Text style={s.kpiValue}>{kpi.value}</Text>
          </View>
        ))}
      </StaggerReveal>

      {catEntries.length > 0 && (
        <StaggerReveal style={s.block} delay={80} profile="smooth">
          <Text style={s.blockTitle}>Spend by category</Text>
          {catEntries.map(([cat, val]) => (
            <View key={cat} style={s.barRow}>
              <View style={s.barHeader}>
                <Text style={s.barLabel}>{cat}</Text>
                <Text style={s.barAmount}>${val.toFixed(2)}/mo</Text>
              </View>
              <View style={s.barTrack}>
                <View style={[s.barFill, { width: `${(val / maxCat) * 100}%`, backgroundColor: categoryColors[cat] || colors.primary }]} />
              </View>
            </View>
          ))}
        </StaggerReveal>
      )}

      {upcoming_renewals.length > 0 && (
        <StaggerReveal style={s.block} delay={110} profile="smooth">
          <Text style={s.blockTitle}>Upcoming renewals</Text>
          {upcoming_renewals.map((sub) => {
            const d = daysUntil(sub.next_billing_date);
            return (
              <View key={sub.id} style={s.row}>
                <Text style={s.rowName} numberOfLines={1}>{sub.name}</Text>
                <Text style={s.rowMeta}>${sub.amount}</Text>
                <Text style={[s.rowMeta, d <= 3 && { color: colors.warning }]}>{d === 0 ? "Today" : `${d}d`}</Text>
              </View>
            );
          })}
        </StaggerReveal>
      )}

      {most_expensive.length > 0 && (
        <StaggerReveal style={s.block} delay={140} profile="smooth">
          <Text style={s.blockTitle}>Highest monthly costs</Text>
          {most_expensive.map((sub, i) => (
            <View key={sub.id} style={s.row}>
              <Text style={s.rank}>{i + 1}</Text>
              <Text style={s.rowName} numberOfLines={1}>{sub.name}</Text>
              <Text style={s.rowMeta}>${sub.monthly_cost.toFixed(2)}/mo</Text>
            </View>
          ))}
        </StaggerReveal>
      )}

      {waste_subs.length > 0 && (
        <StaggerReveal style={[s.block, s.blockWarn]} delay={170} profile="smooth">
          <View style={s.savingsHead}>
            <Text style={[s.blockTitle, { marginBottom: 0 }]}>Savings opportunities</Text>
            <Text style={s.savingsPill}>Save ${potential_yearly_savings.toFixed(0)}/yr</Text>
          </View>

          <View style={s.savingsTiles}>
            <View style={s.tile}>
              <Text style={s.tileLabel}>Wasted monthly</Text>
              <Text style={[s.tileValue, { color: colors.error }]}>${waste_monthly.toFixed(2)}</Text>
            </View>
            <View style={s.tile}>
              <Text style={s.tileLabel}>Potential yearly</Text>
              <Text style={[s.tileValue, { color: colors.success }]}>${potential_yearly_savings.toFixed(2)}</Text>
            </View>
          </View>

          {waste_subs.map((sub) => (
            <View key={sub.id} style={s.row}>
              <Text style={s.rowName} numberOfLines={1}>{sub.name}</Text>
              <Text style={s.rowMeta}>{RATING_LABELS[sub.usage_rating || 0]}</Text>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={s.rowMeta}>${sub.monthly_cost.toFixed(2)}/mo</Text>
                {sub.cancel_url ? (
                  <TouchableOpacity onPress={() => Linking.openURL(sub.cancel_url)}>
                    <Text style={s.cancel}>Open cancel page</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          ))}
        </StaggerReveal>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { paddingBottom: 8 },

  kpiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 },
  kpiCard: { flex: 1, minWidth: "46%", borderRadius: 14, borderWidth: 1, borderColor: colors.border2, backgroundColor: colors.card, padding: 12 },
  kpiLabel: { fontFamily: "Inter_600SemiBold", color: colors.text3, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.7 },
  kpiValue: { fontFamily: "Poppins_800ExtraBold", color: colors.text, fontSize: 22, marginTop: 3 },

  block: { borderWidth: 1, borderColor: colors.border2, backgroundColor: colors.card, borderRadius: 15, padding: 14, marginBottom: 10 },
  blockWarn: { borderColor: "rgba(220,38,38,0.25)", backgroundColor: "rgba(220,38,38,0.04)" },
  blockTitle: { fontFamily: "Inter_700Bold", color: colors.text, fontSize: 14, marginBottom: 10 },

  barRow: { marginBottom: 9 },
  barHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  barLabel: { fontFamily: "Inter_600SemiBold", color: colors.text2, fontSize: 12 },
  barAmount: { fontFamily: "Inter_700Bold", color: colors.text, fontSize: 12 },
  barTrack: { height: 7, borderRadius: 99, backgroundColor: "rgba(15,23,42,0.08)", overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 99 },

  row: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 8, borderTopWidth: 1, borderTopColor: "rgba(15,23,42,0.06)" },
  rank: { width: 22, height: 22, textAlign: "center", textAlignVertical: "center", borderRadius: 11, backgroundColor: "rgba(18,94,89,0.12)", color: colors.primary, fontFamily: "Inter_700Bold", fontSize: 12, overflow: "hidden" },
  rowName: { flex: 1, fontFamily: "Inter_600SemiBold", color: colors.text, fontSize: 13 },
  rowMeta: { fontFamily: "Inter_500Medium", color: colors.text3, fontSize: 12 },

  savingsHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  savingsPill: { fontFamily: "Inter_700Bold", fontSize: 11, color: colors.success, backgroundColor: "rgba(21,128,61,0.12)", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  savingsTiles: { flexDirection: "row", gap: 8, marginBottom: 6 },
  tile: { flex: 1, borderRadius: 11, borderWidth: 1, borderColor: colors.border2, padding: 10, backgroundColor: "rgba(255,255,255,0.68)" },
  tileLabel: { fontFamily: "Inter_500Medium", color: colors.text3, fontSize: 11 },
  tileValue: { fontFamily: "Poppins_800ExtraBold", fontSize: 18, marginTop: 3 },

  cancel: { fontFamily: "Inter_700Bold", fontSize: 11, color: colors.error, marginTop: 2 },
});
