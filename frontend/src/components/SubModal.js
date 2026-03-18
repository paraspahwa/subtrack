import { useEffect, useState } from "react";
import { Modal, View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, CATEGORIES, BILLING_CYCLES, categoryColors } from "../theme";
import { api } from "../api";
import InteractiveButton from "./InteractiveButton";

const CURRENCIES = ["USD", "EUR", "GBP", "INR", "CAD", "AUD"];

const TEMPLATES = [
  { name: "Netflix",          category: "Entertainment",   amount: 15.99, color: "#e50914", cancel_url: "https://netflix.com/cancelplan" },
  { name: "Spotify",          category: "Entertainment",   amount: 9.99,  color: "#1db954", cancel_url: "https://spotify.com/account/subscription/cancel" },
  { name: "YouTube Premium",  category: "Entertainment",   amount: 13.99, color: "#ff0000", cancel_url: "https://youtube.com/paid_memberships" },
  { name: "Disney+",          category: "Entertainment",   amount: 13.99, color: "#113ccf", cancel_url: "https://disneyplus.com/account" },
  { name: "Apple TV+",        category: "Entertainment",   amount: 9.99,  color: "#1c1c1e", cancel_url: "https://appleid.apple.com/account/manage" },
  { name: "HBO Max",          category: "Entertainment",   amount: 15.99, color: "#5822b4", cancel_url: "https://hbomax.com/account" },
  { name: "Amazon Prime",     category: "Shopping",        amount: 14.99, color: "#ff9900", cancel_url: "https://amazon.com/mc/pipeline/managevideo" },
  { name: "Hulu",             category: "Entertainment",   amount: 7.99,  color: "#1ce783", cancel_url: "https://help.hulu.com/s/article/cancel" },
  { name: "GitHub Pro",       category: "Productivity",    amount: 4.00,  color: "#6e40c9", cancel_url: "https://github.com/settings/billing" },
  { name: "Notion",           category: "Productivity",    amount: 16.00, color: "#191919", cancel_url: "https://notion.so/profile/billing" },
  { name: "Figma",            category: "Productivity",    amount: 12.00, color: "#f24e1e", cancel_url: "https://figma.com/subscription" },
  { name: "Slack",            category: "Productivity",    amount: 7.25,  color: "#4a154b", cancel_url: "https://slack.com/intl/en-us/help/articles/204938814" },
  { name: "Dropbox",          category: "Cloud Storage",   amount: 11.99, color: "#0061ff", cancel_url: "https://dropbox.com/account/billing" },
  { name: "iCloud+",          category: "Cloud Storage",   amount: 2.99,  color: "#3478f6", cancel_url: "https://appleid.apple.com/account/manage" },
  { name: "Adobe CC",         category: "Productivity",    amount: 54.99, color: "#ff0000", cancel_url: "https://account.adobe.com/plans" },
  { name: "ChatGPT Plus",     category: "Productivity",    amount: 20.00, color: "#10a37f", cancel_url: "https://chat.openai.com/settings" },
  { name: "LinkedIn Premium", category: "Productivity",    amount: 39.99, color: "#0077b5", cancel_url: "https://linkedin.com/premium/manage" },
  { name: "Calm",             category: "Health & Fitness", amount: 69.99, billing_cycle: "yearly", color: "#4a90d9", cancel_url: "https://calm.com/app/subscription" },
  { name: "Headspace",        category: "Health & Fitness", amount: 12.99, color: "#ff6d00", cancel_url: "https://headspace.com/settings/subscription" },
  { name: "Duolingo Plus",    category: "Education",       amount: 6.99,  color: "#58cc02", cancel_url: "https://duolingo.com/manage-plus" },
];

function nextMonthDate() {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return d.toISOString().split("T")[0];
}

const RATING_LABELS = ["", "Never use", "Rarely", "Sometimes", "Often", "Every day"];
const RATING_COLORS = ["", colors.error, "#f97316", "#d97706", "#84cc16", colors.success];

export default function SubModal({ visible, sub, onClose, onSaved }) {
  const isEdit = Boolean(sub?.id);
  const [showTemplates, setShowTemplates] = useState(!isEdit);

  const blankForm = () => ({
    name:              sub?.name              || "",
    category:          sub?.category          || "Entertainment",
    amount:            sub?.amount?.toString() || "",
    currency:          sub?.currency          || "USD",
    billing_cycle:     sub?.billing_cycle     || "monthly",
    next_billing_date: sub?.next_billing_date ? sub.next_billing_date.split("T")[0] : nextMonthDate(),
    notes:             sub?.notes             || "",
    color:             sub?.color             || categoryColors["Entertainment"],
    is_active:         sub?.is_active !== undefined ? sub.is_active : true,
    usage_rating:      sub?.usage_rating      || null,
    cancel_url:        sub?.cancel_url        || "",
    num_members:       sub?.num_members?.toString() || "1",
  });

  const [form, setForm]     = useState(blankForm);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");

  useEffect(() => {
    setForm(blankForm());
    setShowTemplates(!isEdit);
    setError("");
  }, [sub, visible, isEdit]);

  const set = (key) => (val) => {
    setForm(p => {
      const next = { ...p, [key]: val };
      if (key === "category") next.color = categoryColors[val] || "#475569";
      return next;
    });
    setError("");
  };

  const applyTemplate = (t) => {
    setForm({
      name:              t.name,
      category:          t.category,
      amount:            t.amount.toString(),
      currency:          "USD",
      billing_cycle:     t.billing_cycle || "monthly",
      next_billing_date: nextMonthDate(),
      notes:             "",
      color:             t.color,
      is_active:         true,
      usage_rating:      null,
      cancel_url:        t.cancel_url || "",
      num_members:       "1",
    });
    setShowTemplates(false);
    setError("");
  };

  const handleSubmit = async () => {
    if (!form.name.trim())                                               return setError("Service name is required.");
    if (!form.amount || isNaN(form.amount) || Number(form.amount) <= 0) return setError("Enter a valid amount.");
    if (!form.next_billing_date)                                          return setError("Select a billing date.");

    setLoading(true);
    try {
      const payload = {
        ...form,
        amount:      parseFloat(form.amount),
        num_members: parseInt(form.num_members) || 1,
        cancel_url:  form.cancel_url || null,
      };
      const data = isEdit ? await api.updateSub(sub.id, payload) : await api.createSub(payload);
      onSaved(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={s.container}>
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.title}>{isEdit ? "Edit subscription" : "Add subscription"}</Text>
            <Text style={s.subtitle}>{isEdit ? "Update the details below" : "Track a new recurring charge"}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={s.closeBtn} hitSlop={8}>
            <Text style={s.closeTxt}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Quick-add templates */}
          {!isEdit && (
            <View style={s.section}>
              <TouchableOpacity onPress={() => setShowTemplates(v => !v)} style={s.templateToggle}>
                <Text style={s.sectionLabel}>Quick add popular services</Text>
                <View style={s.templateChevronBtn}>
                  <Text style={s.templateChevron}>{showTemplates ? "▲" : "▼"}</Text>
                </View>
              </TouchableOpacity>
              {showTemplates && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.templateRow}>
                  {TEMPLATES.map((t) => (
                    <TouchableOpacity key={t.name} onPress={() => applyTemplate(t)} style={[s.templateChip, { borderColor: t.color + "33" }]}>
                      <View style={[s.templateDot, { backgroundColor: t.color + "18", borderColor: t.color + "44" }]}>
                        <Text style={[s.templateDotText, { color: t.color }]}>{t.name[0]}</Text>
                      </View>
                      <Text style={s.templateName} numberOfLines={1}>{t.name}</Text>
                      <Text style={s.templateAmt}>${t.amount}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          )}

          {/* Error */}
          {!!error && (
            <View style={s.errorBox}>
              <Text style={s.errorText}>⚠ {error}</Text>
            </View>
          )}

          {/* Service Name */}
          <View style={s.field}>
            <Text style={s.label}>Service Name <Text style={s.required}>*</Text></Text>
            <TextInput
              style={s.input}
              placeholder="e.g. Netflix"
              placeholderTextColor={colors.text4}
              value={form.name}
              onChangeText={set("name")}
            />
          </View>

          {/* Amount + Currency */}
          <View style={s.rowField}>
            <View style={s.halfField}>
              <Text style={s.label}>Amount <Text style={s.required}>*</Text></Text>
              <TextInput
                style={s.input}
                placeholder="9.99"
                placeholderTextColor={colors.text4}
                value={form.amount}
                onChangeText={set("amount")}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={s.halfField}>
              <Text style={s.label}>Currency</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.currencyRow}>
                {CURRENCIES.map(c => (
                  <TouchableOpacity key={c} onPress={() => set("currency")(c)} style={[s.currencyChip, form.currency === c && s.currencyChipActive]}>
                    <Text style={[s.currencyText, form.currency === c && s.currencyTextActive]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          {/* Members */}
          <View style={s.field}>
            <Text style={s.label}>Members (shared subscription)</Text>
            <TextInput
              style={s.input}
              placeholder="1"
              placeholderTextColor={colors.text4}
              value={form.num_members}
              onChangeText={set("num_members")}
              keyboardType="numeric"
            />
            <Text style={s.hint}>Cost is split equally among all members.</Text>
          </View>

          {/* Billing Cycle */}
          <View style={s.field}>
            <Text style={s.label}>Billing Cycle</Text>
            <View style={s.toggleRow}>
              {BILLING_CYCLES.map(b => (
                <TouchableOpacity key={b.value} onPress={() => set("billing_cycle")(b.value)} style={[s.toggleBtn, form.billing_cycle === b.value && s.toggleActive]}>
                  <Text style={[s.toggleText, form.billing_cycle === b.value && s.toggleActiveText]}>{b.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Next Billing Date */}
          <View style={s.field}>
            <Text style={s.label}>Next Billing Date <Text style={s.required}>*</Text></Text>
            <TextInput
              style={s.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.text4}
              value={form.next_billing_date}
              onChangeText={set("next_billing_date")}
              keyboardType="numeric"
            />
          </View>

          {/* Category */}
          <View style={s.field}>
            <Text style={s.label}>Category</Text>
            <View style={s.catGrid}>
              {CATEGORIES.map(c => {
                const cc = categoryColors[c] || colors.primary;
                const active = form.category === c;
                return (
                  <TouchableOpacity key={c} onPress={() => set("category")(c)} style={[s.catChip, active && { borderColor: cc, backgroundColor: cc + "15" }]}>
                    <Text style={[s.catChipText, active && { color: cc, fontFamily: "Inter_700Bold" }]}>{c}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Usage Rating */}
          <View style={s.field}>
            <Text style={s.label}>How much do you use this?</Text>
            <Text style={s.hint}>Used to surface subscriptions worth cancelling</Text>
            <View style={s.ratingRow}>
              {[1, 2, 3, 4, 5].map(r => {
                const active = form.usage_rating >= r;
                return (
                  <TouchableOpacity
                    key={r}
                    onPress={() => set("usage_rating")(form.usage_rating === r ? null : r)}
                    style={[s.ratingBtn, active && { borderColor: RATING_COLORS[r], backgroundColor: RATING_COLORS[r] + "18" }]}
                  >
                    <Text style={{ fontSize: 18 }}>⭐</Text>
                    <Text style={[s.ratingLabel, active && { color: RATING_COLORS[r] }]}>{r}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {form.usage_rating ? (
              <View style={[s.ratingHintPill, { backgroundColor: RATING_COLORS[form.usage_rating] + "15" }]}>
                <Text style={[s.ratingHintText, { color: RATING_COLORS[form.usage_rating] }]}>
                  {RATING_LABELS[form.usage_rating]}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Cancellation Link */}
          <View style={s.field}>
            <Text style={s.label}>Cancellation Link (optional)</Text>
            <TextInput
              style={s.input}
              placeholder="https://..."
              placeholderTextColor={colors.text4}
              value={form.cancel_url}
              onChangeText={set("cancel_url")}
              autoCapitalize="none"
              keyboardType="url"
            />
          </View>

          {/* Notes */}
          <View style={s.field}>
            <Text style={s.label}>Notes (optional)</Text>
            <TextInput
              style={[s.input, s.textarea]}
              placeholder="Add context, reminder reason, or team notes"
              placeholderTextColor={colors.text4}
              value={form.notes}
              onChangeText={set("notes")}
              multiline
            />
          </View>

          {/* Status (edit only) */}
          {isEdit && (
            <View style={s.field}>
              <Text style={s.label}>Status</Text>
              <View style={s.toggleRow}>
                {[{ v: true, l: "Active" }, { v: false, l: "Paused" }].map(o => (
                  <TouchableOpacity key={String(o.v)} onPress={() => set("is_active")(o.v)} style={[s.toggleBtn, form.is_active === o.v && s.toggleActive]}>
                    <Text style={[s.toggleText, form.is_active === o.v && s.toggleActiveText]}>{o.l}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Action buttons */}
          <View style={s.btnRow}>
            <TouchableOpacity onPress={onClose} style={s.cancelBtn}>
              <Text style={s.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            {loading ? (
              <View style={s.saveBtnLoading}>
                <ActivityIndicator color="#fff" size="small" />
              </View>
            ) : (
              <TouchableOpacity onPress={handleSubmit} style={s.saveBtn}>
                <LinearGradient colors={[colors.primary, colors.primaryLight]} style={s.saveBtnGradient}>
                  <Text style={s.saveBtnText}>{isEdit ? "Save changes" : "Add subscription"}</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingTop: Platform.OS === "android" ? 24 : 0 },

  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start",
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: colors.border2,
    backgroundColor: colors.card,
  },
  title:    { fontFamily: "Poppins_800ExtraBold", fontSize: 20, color: colors.text },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 13, color: colors.text3, marginTop: 2 },
  closeBtn: {
    width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center",
    backgroundColor: colors.bg3, borderWidth: 1, borderColor: colors.border2,
  },
  closeTxt: { fontFamily: "Inter_700Bold", color: colors.text3, fontSize: 13 },

  scroll:       { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 50 },

  section:        { marginBottom: 20 },
  sectionLabel:   { fontFamily: "Inter_700Bold", fontSize: 13, color: colors.primary },
  templateToggle: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  templateChevronBtn: {
    width: 26, height: 26, borderRadius: 8, alignItems: "center", justifyContent: "center",
    backgroundColor: colors.primaryBg,
  },
  templateChevron: { fontFamily: "Inter_600SemiBold", fontSize: 10, color: colors.primary },
  templateRow:    { gap: 8, paddingBottom: 4 },
  templateChip:   {
    borderWidth: 1, borderRadius: 14, padding: 10,
    alignItems: "center", width: 84, backgroundColor: colors.card,
  },
  templateDot:    {
    width: 36, height: 36, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
    marginBottom: 6, borderWidth: 1,
  },
  templateDotText: { fontFamily: "Inter_800ExtraBold", fontSize: 15 },
  templateName:   { fontFamily: "Inter_600SemiBold", fontSize: 11, color: colors.text2, textAlign: "center", marginBottom: 2 },
  templateAmt:    { fontFamily: "Inter_700Bold", fontSize: 11, color: colors.text4 },

  errorBox: {
    backgroundColor: colors.errorBg, borderWidth: 1, borderColor: "rgba(220,38,38,0.24)",
    borderRadius: 12, padding: 12, marginBottom: 16,
  },
  errorText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: colors.error },

  field:     { marginBottom: 18 },
  rowField:  { flexDirection: "row", gap: 12, marginBottom: 18 },
  halfField: { flex: 1 },
  label:     { fontFamily: "Inter_600SemiBold", fontSize: 11, color: colors.text3, textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 6 },
  required:  { color: colors.error },
  hint:      { fontFamily: "Inter_400Regular", fontSize: 12, color: colors.text4, marginTop: 4 },
  input:     {
    backgroundColor: colors.bg2, borderWidth: 1, borderColor: colors.border2,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: colors.text, fontFamily: "Inter_400Regular",
  },
  textarea: { height: 80, textAlignVertical: "top" },

  currencyRow: { gap: 6, paddingVertical: 2 },
  currencyChip: {
    paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10,
    borderWidth: 1, borderColor: colors.border2, backgroundColor: colors.bg3,
  },
  currencyChipActive: { borderColor: colors.primary, backgroundColor: colors.primaryBg },
  currencyText: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: colors.text3 },
  currencyTextActive: { color: colors.primary },

  toggleRow:       { flexDirection: "row", gap: 8 },
  toggleBtn:       { flex: 1, paddingVertical: 11, borderRadius: 12, borderWidth: 1, borderColor: colors.border2, alignItems: "center", backgroundColor: colors.bg3 },
  toggleActive:    { borderColor: colors.primary, backgroundColor: colors.primaryBg },
  toggleText:      { fontFamily: "Inter_500Medium", fontSize: 14, color: colors.text3 },
  toggleActiveText:{ color: colors.primary, fontFamily: "Inter_700Bold" },

  catGrid:     { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  catChip:     { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: colors.border2, backgroundColor: colors.bg3 },
  catChipText: { fontFamily: "Inter_500Medium", fontSize: 12, color: colors.text3 },

  ratingRow:  { flexDirection: "row", gap: 8, marginTop: 8 },
  ratingBtn:  { flex: 1, alignItems: "center", paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: colors.border2, backgroundColor: colors.bg3 },
  ratingLabel:{ fontFamily: "Inter_600SemiBold", fontSize: 12, color: colors.text4, marginTop: 2 },
  ratingHintPill: { marginTop: 10, alignSelf: "flex-start", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
  ratingHintText: { fontFamily: "Inter_700Bold", fontSize: 12 },

  btnRow:         { flexDirection: "row", gap: 10, marginTop: 12 },
  cancelBtn:      {
    flex: 1, paddingVertical: 14, borderRadius: 14, borderWidth: 1,
    borderColor: colors.border2, backgroundColor: colors.bg3, alignItems: "center",
  },
  cancelBtnText:  { fontFamily: "Inter_700Bold", color: colors.text3, fontSize: 15 },
  saveBtn:        { flex: 2, borderRadius: 14, overflow: "hidden" },
  saveBtnGradient:{ paddingVertical: 14, alignItems: "center" },
  saveBtnText:    { fontFamily: "Inter_700Bold", color: "#fff", fontSize: 15 },
  saveBtnLoading: {
    flex: 2, borderRadius: 14, paddingVertical: 14,
    alignItems: "center", backgroundColor: colors.primaryLight,
  },
});
