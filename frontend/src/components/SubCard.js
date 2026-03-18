import { View, Text, TouchableOpacity, StyleSheet, Linking } from "react-native";
import { colors, categoryColors } from "../theme";

const RATING_COLORS = ["", colors.error, "#ea580c", "#d97706", "#65a30d", colors.success];
const RATING_LABELS = ["", "Never use", "Rarely", "Sometimes", "Often", "Every day"];

function daysUntil(dateStr) {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr) - new Date()) / 86400000);
}

function fmtCurrency(amount, currency = "USD") {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: 2 }).format(amount);
  } catch {
    return `${currency} ${Number(amount || 0).toFixed(2)}`;
  }
}

export default function SubCard({ sub, onEdit, onDelete }) {
  const days = daysUntil(sub.next_billing_date);
  const catColor = sub.color || categoryColors[sub.category] || "#475569";
  const isUrgent = days !== null && days >= 0 && days <= 7;
  const isOverdue = days !== null && days < 0;
  const isWaste = sub.usage_rating !== null && sub.usage_rating !== undefined && sub.usage_rating <= 2;

  const dueColor = isOverdue ? colors.error : isUrgent ? colors.warning : colors.text3;
  const dueBg = isOverdue ? colors.errorBg : isUrgent ? colors.warningBg : colors.bg3;
  const dueLabel = isOverdue
    ? `${Math.abs(days)}d overdue`
    : days === 0 ? "Due today"
    : `${days}d left`;

  return (
    <View style={[s.card, !sub.is_active && s.inactive]}>
      {/* Left accent bar */}
      <View style={[s.accentBar, { backgroundColor: catColor }]} />

      <View style={s.body}>
        {/* Header row */}
        <View style={s.header}>
          <View style={[s.avatar, { backgroundColor: catColor + "20", borderColor: catColor + "40" }]}>
            <Text style={[s.avatarText, { color: catColor }]}>{sub.name[0]?.toUpperCase()}</Text>
          </View>
          <View style={s.titleBlock}>
            <Text style={s.name} numberOfLines={1}>{sub.name}</Text>
            <Text style={s.category}>{sub.category}</Text>
          </View>
          <View style={s.actions}>
            <TouchableOpacity onPress={() => onEdit(sub)} style={s.actionBtn} hitSlop={6}>
              <Text style={s.actionEdit}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onDelete(sub.id)} style={[s.actionBtn, s.actionDangerBtn]} hitSlop={6}>
              <Text style={s.actionDanger}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Amount + Due */}
        <View style={s.footer}>
          <View>
            <Text style={s.amount}>{fmtCurrency(sub.amount, sub.currency)}</Text>
            <Text style={s.cycle}>
              {sub.billing_cycle}
              {sub.num_members > 1 ? ` · ${sub.num_members} members` : ""}
            </Text>
          </View>
          {days !== null && (
            <View style={[s.dueBadge, { backgroundColor: dueBg }]}>
              <Text style={[s.dueLabel, { color: dueColor }]}>{dueLabel}</Text>
              <Text style={s.dueDate}>
                {new Date(sub.next_billing_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </Text>
            </View>
          )}
        </View>

        {/* Usage + waste */}
        {sub.usage_rating ? (
          <View style={s.ratingRow}>
            <View style={[s.ratingPill, { backgroundColor: RATING_COLORS[sub.usage_rating] + "18" }]}>
              <Text style={[s.ratingDot, { color: RATING_COLORS[sub.usage_rating] }]}>●</Text>
              <Text style={[s.ratingText, { color: RATING_COLORS[sub.usage_rating] }]}>
                {RATING_LABELS[sub.usage_rating]}
              </Text>
            </View>
            {isWaste && (
              <View style={s.wastePill}>
                <Text style={s.wasteText}>Low usage</Text>
              </View>
            )}
            {sub.cancel_url && isWaste && (
              <TouchableOpacity onPress={() => Linking.openURL(sub.cancel_url)} style={s.cancelBtn}>
                <Text style={s.cancelText}>Cancel →</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : null}

        {/* Paused */}
        {!sub.is_active && (
          <View style={s.pausedBar}>
            <Text style={s.pausedText}>⏸ Paused</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border2,
    marginBottom: 10,
    flexDirection: "row",
    overflow: "hidden",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  inactive: { opacity: 0.55 },
  accentBar: { width: 4, minHeight: "100%" },
  body: { flex: 1, padding: 14 },

  header: { flexDirection: "row", alignItems: "center", marginBottom: 12, gap: 10 },
  avatar: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1,
  },
  avatarText: { fontFamily: "Inter_800ExtraBold", fontSize: 16 },
  titleBlock: { flex: 1 },
  name: { fontFamily: "Inter_700Bold", fontSize: 16, color: colors.text, letterSpacing: -0.2 },
  category: { fontFamily: "Inter_500Medium", fontSize: 11, color: colors.text4, marginTop: 2 },

  actions: { flexDirection: "row", gap: 6 },
  actionBtn: {
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 1, borderColor: colors.border2,
    backgroundColor: colors.bg3,
  },
  actionDangerBtn: { borderColor: "rgba(220,38,38,0.15)", backgroundColor: "rgba(220,38,38,0.05)" },
  actionEdit: { fontFamily: "Inter_600SemiBold", color: colors.text3, fontSize: 11 },
  actionDanger: { fontFamily: "Inter_700Bold", color: colors.error, fontSize: 11 },

  footer: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  amount: { fontFamily: "Poppins_800ExtraBold", color: colors.text, fontSize: 24, lineHeight: 28, letterSpacing: -0.5 },
  cycle: { fontFamily: "Inter_500Medium", color: colors.text3, fontSize: 12, marginTop: 2 },

  dueBadge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7, alignItems: "flex-end" },
  dueLabel: { fontFamily: "Inter_700Bold", fontSize: 12 },
  dueDate: { fontFamily: "Inter_500Medium", color: colors.text4, fontSize: 11, marginTop: 1 },

  ratingRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 6, marginTop: 10 },
  ratingPill: {
    flexDirection: "row", alignItems: "center", gap: 4,
    borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4,
  },
  ratingDot: { fontSize: 8 },
  ratingText: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
  wastePill: {
    borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4,
    backgroundColor: colors.errorBg, borderWidth: 1, borderColor: "rgba(220,38,38,0.18)",
  },
  wasteText: { fontFamily: "Inter_600SemiBold", color: colors.error, fontSize: 11 },
  cancelBtn: { marginLeft: "auto" },
  cancelText: { fontFamily: "Inter_700Bold", color: colors.primary, fontSize: 11 },

  pausedBar: {
    marginTop: 10, borderRadius: 8, paddingVertical: 6, alignItems: "center",
    backgroundColor: colors.bg3, borderWidth: 1, borderColor: colors.border2,
  },
  pausedText: { fontFamily: "Inter_600SemiBold", color: colors.text3, fontSize: 12 },
});
