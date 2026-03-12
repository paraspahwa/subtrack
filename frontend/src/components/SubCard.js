import { View, Text, TouchableOpacity, StyleSheet, Linking } from "react-native";
import { colors, categoryColors } from "../theme";

const RATING_COLORS = ["", colors.error, "#f97316", colors.warning, "#84cc16", colors.success];

function daysUntil(dateStr) {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr) - new Date()) / 86400000);
}

function fmtCurrency(amount, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: 2 }).format(amount);
}

export default function SubCard({ sub, onEdit, onDelete }) {
  const days = daysUntil(sub.next_billing_date);
  const catColor  = sub.color || categoryColors[sub.category] || "#475569";
  const isUrgent  = days !== null && days >= 0 && days <= 7;
  const isOverdue = days !== null && days < 0;
  const isWaste   = sub.usage_rating !== null && sub.usage_rating !== undefined && sub.usage_rating <= 2;

  return (
    <View style={[
      s.card,
      isWaste   ? { borderColor: "rgba(239,68,68,0.5)", borderLeftWidth: 3, borderLeftColor: colors.error }
        : isOverdue ? { borderColor: "rgba(239,68,68,0.4)" }
        : isUrgent  ? { borderColor: "rgba(245,158,11,0.4)" }
        : {},
      !sub.is_active && { opacity: 0.55 },
    ]}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.nameRow}>
          <View style={[s.avatar, { backgroundColor: catColor }]}>
            <Text style={s.avatarText}>{sub.name[0].toUpperCase()}</Text>
          </View>
          <View>
            <Text style={s.name}>{sub.name}</Text>
            <Text style={s.category}>{sub.category}</Text>
          </View>
        </View>
        <View style={s.actions}>
          <TouchableOpacity onPress={() => onEdit(sub)} style={s.actionBtn}>
            <Text style={{ fontSize: 16 }}>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onDelete(sub.id)} style={s.actionBtn}>
            <Text style={{ fontSize: 16 }}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Footer */}
      <View style={s.footer}>
        <View>
          <Text style={s.amount}>{fmtCurrency(sub.amount, sub.currency)}</Text>
          <Text style={s.cycle}>{sub.billing_cycle} · {fmtCurrency(sub.monthly_cost, sub.currency)}/mo</Text>
        </View>
        {days !== null && (
          <View style={[s.dueBadge, isOverdue ? s.dueOverdue : isUrgent ? s.dueUrgent : s.dueNormal]}>
            <Text style={[s.dueText, isOverdue ? { color: colors.error } : isUrgent ? { color: colors.warning } : { color: colors.text3 }]}>
              {isOverdue ? `⚠️ ${Math.abs(days)}d overdue` : days === 0 ? "⚡ Today" : isUrgent ? `⚡ ${days}d` : `${days}d`}
            </Text>
            <Text style={s.dueDate}>
              {new Date(sub.next_billing_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </Text>
          </View>
        )}
      </View>

      {/* Usage rating row */}
      {sub.usage_rating && (
        <View style={s.ratingRow}>
          <Text style={[s.ratingDot, { color: RATING_COLORS[sub.usage_rating] }]}>
            {"★".repeat(sub.usage_rating)}{"☆".repeat(5 - sub.usage_rating)}
          </Text>
          {isWaste && (
            <View style={s.wasteBadge}>
              <Text style={s.wasteText}>💸 Consider cancelling</Text>
            </View>
          )}
          {sub.cancel_url && isWaste && (
            <TouchableOpacity onPress={() => Linking.openURL(sub.cancel_url)} style={s.cancelLink}>
              <Text style={s.cancelLinkText}>Cancel →</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {!sub.is_active && (
        <View style={s.pausedBadge}>
          <Text style={s.pausedText}>Paused / Cancelled</Text>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  card:       { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border2, borderRadius: 16, padding: 18, marginBottom: 12 },
  header:     { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  nameRow:    { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar:     { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  avatarText: { fontFamily: "Inter_800ExtraBold", fontSize: 18, color: "#fff" },
  name:       { fontFamily: "Inter_700Bold", fontSize: 16, color: colors.text },
  category:   { fontFamily: "Inter_400Regular", fontSize: 12, color: colors.text4, marginTop: 2 },
  actions:    { flexDirection: "row", gap: 4 },
  actionBtn:  { padding: 6, borderRadius: 8 },
  footer:     { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  amount:     { fontFamily: "Poppins_800ExtraBold", fontSize: 20, color: colors.text },
  cycle:      { fontFamily: "Inter_400Regular", fontSize: 12, color: colors.text4, marginTop: 2 },
  dueBadge:   { alignItems: "flex-end", padding: 6, borderRadius: 8 },
  dueOverdue: { backgroundColor: "rgba(239,68,68,0.1)" },
  dueUrgent:  { backgroundColor: "rgba(245,158,11,0.1)" },
  dueNormal:  { backgroundColor: colors.bg },
  dueText:    { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  dueDate:    { fontFamily: "Inter_400Regular", fontSize: 11, color: colors.text4, marginTop: 2 },
  ratingRow:  { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12, flexWrap: "wrap" },
  ratingDot:  { fontFamily: "Inter_500Medium", fontSize: 14, letterSpacing: 1 },
  wasteBadge: { backgroundColor: "rgba(239,68,68,0.12)", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  wasteText:  { fontFamily: "Inter_600SemiBold", fontSize: 11, color: colors.error },
  cancelLink: { marginLeft: "auto" },
  cancelLinkText: { fontFamily: "Inter_700Bold", fontSize: 12, color: colors.primaryLight },
  pausedBadge:{ marginTop: 12, backgroundColor: "rgba(100,116,139,0.15)", borderRadius: 8, padding: 6, alignItems: "center" },
  pausedText: { fontFamily: "Inter_500Medium", fontSize: 12, color: colors.text4 },
});
