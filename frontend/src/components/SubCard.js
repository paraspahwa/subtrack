import { View, Text, TouchableOpacity, StyleSheet, Linking } from "react-native";
import { colors, categoryColors } from "../theme";

const RATING_COLORS = ["", colors.error, "#ea580c", "#d97706", "#65a30d", colors.success];

function daysUntil(dateStr) {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr) - new Date()) / 86400000);
}

function fmtCurrency(amount, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: 2 }).format(amount);
}

export default function SubCard({ sub, onEdit, onDelete }) {
  const days = daysUntil(sub.next_billing_date);
  const catColor = sub.color || categoryColors[sub.category] || "#475569";
  const isUrgent = days !== null && days >= 0 && days <= 7;
  const isOverdue = days !== null && days < 0;
  const isWaste = sub.usage_rating !== null && sub.usage_rating !== undefined && sub.usage_rating <= 2;

  return (
    <View
      style={[
        s.card,
        isWaste ? s.cardWaste : null,
        isOverdue ? s.cardOverdue : null,
        isUrgent ? s.cardUrgent : null,
        !sub.is_active ? s.inactive : null,
      ]}
    >
      <View style={s.header}>
        <View style={s.nameRow}>
          <View style={[s.avatar, { backgroundColor: catColor }]}>
            <Text style={s.avatarText}>{sub.name[0].toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.name}>{sub.name}</Text>
            <Text style={s.category}>{sub.category}</Text>
          </View>
        </View>
        <View style={s.actions}>
          <TouchableOpacity onPress={() => onEdit(sub)} style={s.actionBtn}><Text style={s.actionText}>Edit</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => onDelete(sub.id)} style={[s.actionBtn, s.actionDanger]}><Text style={[s.actionText, { color: colors.error }]}>Delete</Text></TouchableOpacity>
        </View>
      </View>

      <View style={s.footer}>
        <View>
          <Text style={s.amount}>{fmtCurrency(sub.amount, sub.currency)}</Text>
          <Text style={s.cycle}>
            {sub.billing_cycle} • {fmtCurrency(sub.monthly_cost, sub.currency)}/mo
            {sub.num_members > 1 ? ` • ${sub.num_members} members` : ""}
          </Text>
          {sub.num_members > 1 && (
            <Text style={s.shareText}>Your share: {fmtCurrency(sub.monthly_cost, sub.currency)}/mo</Text>
          )}
        </View>

        {days !== null && (
          <View style={[s.dueBadge, isOverdue ? s.badgeOverdue : isUrgent ? s.badgeUrgent : s.badgeNormal]}>
            <Text style={[s.dueText, isOverdue ? { color: colors.error } : isUrgent ? { color: colors.warning } : { color: colors.text3 }]}>
              {isOverdue ? `${Math.abs(days)}d overdue` : days === 0 ? "Due today" : `${days}d left`}
            </Text>
            <Text style={s.dueDate}>{new Date(sub.next_billing_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</Text>
          </View>
        )}
      </View>

      {sub.usage_rating ? (
        <View style={s.ratingRow}>
          <Text style={[s.stars, { color: RATING_COLORS[sub.usage_rating] }]}>
            {"★".repeat(sub.usage_rating)}{"☆".repeat(5 - sub.usage_rating)}
          </Text>
          {isWaste && <Text style={s.waste}>Low usage detected</Text>}
          {sub.cancel_url && isWaste ? (
            <TouchableOpacity style={{ marginLeft: "auto" }} onPress={() => Linking.openURL(sub.cancel_url)}>
              <Text style={s.cancelLink}>Open cancel page</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}

      {!sub.is_active && (
        <View style={s.pausedBadge}>
          <Text style={s.pausedText}>Paused or cancelled</Text>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: 18, borderWidth: 1, borderColor: colors.border2, padding: 16, marginBottom: 11 },
  cardWaste: { borderColor: "rgba(220,38,38,0.28)" },
  cardOverdue: { borderColor: "rgba(220,38,38,0.36)" },
  cardUrgent: { borderColor: "rgba(194,65,12,0.28)" },
  inactive: { opacity: 0.66 },

  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, gap: 8 },
  nameRow: { flexDirection: "row", alignItems: "center", flex: 1, gap: 11 },
  avatar: { width: 42, height: 42, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  avatarText: { fontFamily: "Inter_800ExtraBold", color: "#fff", fontSize: 17 },
  name: { fontFamily: "Inter_700Bold", fontSize: 17, color: colors.text },
  category: { fontFamily: "Inter_500Medium", fontSize: 12, color: colors.text3, marginTop: 2 },

  actions: { flexDirection: "row", alignItems: "center", gap: 7 },
  actionBtn: { borderWidth: 1, borderColor: colors.border2, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 6, backgroundColor: "rgba(255,255,255,0.65)" },
  actionDanger: { borderColor: "rgba(220,38,38,0.20)", backgroundColor: "rgba(220,38,38,0.05)" },
  actionText: { fontFamily: "Inter_600SemiBold", color: colors.text3, fontSize: 11 },

  footer: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", gap: 10 },
  amount: { fontFamily: "Poppins_800ExtraBold", color: colors.text, fontSize: 25, lineHeight: 28 },
  cycle: { fontFamily: "Inter_500Medium", color: colors.text3, fontSize: 12, marginTop: 3 },
  dueBadge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7, alignItems: "flex-end" },
  badgeOverdue: { backgroundColor: "rgba(220,38,38,0.07)" },
  badgeUrgent: { backgroundColor: "rgba(194,65,12,0.08)" },
  badgeNormal: { backgroundColor: "rgba(15,23,42,0.05)" },
  dueText: { fontFamily: "Inter_700Bold", fontSize: 12 },
  dueDate: { fontFamily: "Inter_500Medium", color: colors.text4, fontSize: 11, marginTop: 2 },

  ratingRow: { marginTop: 11, flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8 },
  stars: { fontFamily: "Inter_700Bold", fontSize: 13, letterSpacing: 0.6 },
  waste: { fontFamily: "Inter_600SemiBold", color: colors.error, fontSize: 11, backgroundColor: "rgba(220,38,38,0.10)", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  cancelLink: { fontFamily: "Inter_700Bold", color: colors.primary, fontSize: 11 },

  pausedBadge: { marginTop: 10, backgroundColor: "rgba(148,163,184,0.20)", borderRadius: 8, paddingVertical: 6, alignItems: "center" },
  pausedText: { fontFamily: "Inter_600SemiBold", color: colors.text3, fontSize: 12 },
  shareText: { fontFamily: "Inter_700Bold", color: colors.primary, fontSize: 11, marginTop: 2 },
});
