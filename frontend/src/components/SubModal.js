import { useState } from "react";
import { Modal, View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, CATEGORIES, BILLING_CYCLES, categoryColors } from "../theme";
import { api } from "../api";

const CURRENCIES = ["USD", "EUR", "GBP", "INR", "CAD", "AUD"];

// ── Popular service templates for one-tap add ──────────────────────────────
const TEMPLATES = [
  { name: "Netflix",        category: "Entertainment",  amount: 15.99, color: "#e50914", cancel_url: "https://netflix.com/cancelplan" },
  { name: "Spotify",        category: "Entertainment",  amount: 9.99,  color: "#1db954", cancel_url: "https://spotify.com/account/subscription/cancel" },
  { name: "YouTube Premium",category: "Entertainment",  amount: 13.99, color: "#ff0000", cancel_url: "https://youtube.com/paid_memberships" },
  { name: "Disney+",        category: "Entertainment",  amount: 13.99, color: "#113ccf", cancel_url: "https://disneyplus.com/account" },
  { name: "Apple TV+",      category: "Entertainment",  amount: 9.99,  color: "#555", cancel_url: "https://appleid.apple.com/account/manage" },
  { name: "HBO Max",        category: "Entertainment",  amount: 15.99, color: "#5822b4", cancel_url: "https://hbomax.com/account" },
  { name: "Amazon Prime",   category: "Shopping",       amount: 14.99, color: "#ff9900", cancel_url: "https://amazon.com/mc/pipeline/managevideo" },
  { name: "Hulu",           category: "Entertainment",  amount: 7.99,  color: "#1ce783", cancel_url: "https://help.hulu.com/s/article/cancel" },
  { name: "GitHub Pro",     category: "Productivity",   amount: 4.00,  color: "#6e40c9", cancel_url: "https://github.com/settings/billing" },
  { name: "Notion",         category: "Productivity",   amount: 16.00, color: "#555", cancel_url: "https://notion.so/profile/billing" },
  { name: "Figma",          category: "Productivity",   amount: 12.00, color: "#f24e1e", cancel_url: "https://figma.com/subscription" },
  { name: "Slack",          category: "Productivity",   amount: 7.25,  color: "#4a154b", cancel_url: "https://slack.com/intl/en-us/help/articles/204938814" },
  { name: "Dropbox",        category: "Cloud Storage",  amount: 11.99, color: "#0061ff", cancel_url: "https://dropbox.com/account/billing" },
  { name: "iCloud+",        category: "Cloud Storage",  amount: 2.99,  color: "#3478f6", cancel_url: "https://appleid.apple.com/account/manage" },
  { name: "Adobe CC",       category: "Productivity",   amount: 54.99, color: "#ff0000", cancel_url: "https://account.adobe.com/plans" },
  { name: "ChatGPT Plus",   category: "Productivity",   amount: 20.00, color: "#10a37f", cancel_url: "https://chat.openai.com/settings" },
  { name: "LinkedIn Premium",category:"Productivity",   amount: 39.99, color: "#0077b5", cancel_url: "https://linkedin.com/premium/manage" },
  { name: "Calm",           category: "Health & Fitness",amount: 69.99,billing_cycle:"yearly", color: "#4a90d9", cancel_url: "https://calm.com/app/subscription" },
  { name: "Headspace",      category: "Health & Fitness",amount: 12.99, color: "#ff6d00", cancel_url: "https://headspace.com/settings/subscription" },
  { name: "Duolingo Plus",  category: "Education",      amount: 6.99,  color: "#58cc02", cancel_url: "https://duolingo.com/manage-plus" },
];

function nextMonthDate() {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return d.toISOString().split("T")[0];
}

const RATING_LABELS = ["", "Never use", "Rarely", "Sometimes", "Often", "Every day"];
const RATING_COLORS = ["", colors.error, "#f97316", colors.warning, "#84cc16", colors.success];

export default function SubModal({ visible, sub, onClose, onSaved }) {
  const isEdit = Boolean(sub?.id);
  const today = new Date().toISOString().split("T")[0];
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
  });

  const [form, setForm] = useState(blankForm);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const set = (key) => (val) => {
    setForm(p => {
      const next = { ...p, [key]: val };
      if (key === "category") next.color = categoryColors[val] || "#475569";
      return next;
    });
    setError("");
  };

  const applyTemplate = (t) => {
    const nextDate = nextMonthDate();
    setForm({
      name:              t.name,
      category:          t.category,
      amount:            t.amount.toString(),
      currency:          "USD",
      billing_cycle:     t.billing_cycle || "monthly",
      next_billing_date: nextDate,
      notes:             "",
      color:             t.color,
      is_active:         true,
      usage_rating:      null,
      cancel_url:        t.cancel_url || "",
    });
    setShowTemplates(false);
    setError("");
  };

  const handleSubmit = async () => {
    if (!form.name.trim())                                              return setError("Name is required.");
    if (!form.amount || isNaN(form.amount) || Number(form.amount) <= 0) return setError("Enter a valid amount.");
    if (!form.next_billing_date)                                         return setError("Select a billing date.");

    setLoading(true);
    try {
      const payload = {
        ...form,
        amount: parseFloat(form.amount),
        cancel_url: form.cancel_url || null,
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
      <View style={s.safe}>
        <View style={s.header}>
          <Text style={s.title}>{isEdit ? "Edit Subscription" : "Add Subscription"}</Text>
          <TouchableOpacity onPress={onClose} style={s.closeBtn}>
            <Text style={s.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* ── Quick-add templates (new subs only) ── */}
          {!isEdit && (
            <View style={s.field}>
              <TouchableOpacity onPress={() => setShowTemplates(v => !v)} style={s.templateToggle}>
                <Text style={s.label}>⚡  Quick-Add Popular Service</Text>
                <Text style={s.templateChevron}>{showTemplates ? "▲" : "▼"}</Text>
              </TouchableOpacity>
              {showTemplates && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.templateRow}>
                  {TEMPLATES.map(t => (
                    <TouchableOpacity key={t.name} onPress={() => applyTemplate(t)} style={[s.templateChip, { borderColor: t.color + "55" }]}>
                      <View style={[s.templateDot, { backgroundColor: t.color }]}>
                        <Text style={s.templateDotText}>{t.name[0]}</Text>
                      </View>
                      <Text style={s.templateName}>{t.name}</Text>
                      <Text style={s.templateAmt}>${t.amount}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          )}

          {error ? (
            <View style={s.errorBox}>
              <Text style={s.errorText}>⚠️  {error}</Text>
            </View>
          ) : null}

          <View style={s.field}>
            <Text style={s.label}>Service Name *</Text>
            <TextInput style={s.input} placeholder="e.g. Netflix" placeholderTextColor={colors.text4} value={form.name} onChangeText={set("name")} />
          </View>

          <View style={s.row}>
            <View style={[s.field, { flex: 1 }]}>
              <Text style={s.label}>Amount *</Text>
              <TextInput style={s.input} placeholder="9.99" placeholderTextColor={colors.text4} value={form.amount} onChangeText={set("amount")} keyboardType="decimal-pad" />
            </View>
            <View style={[s.field, { flex: 1 }]}>
              <Text style={s.label}>Currency</Text>
              <View style={s.picker}>
                {CURRENCIES.map(c => (
                  <TouchableOpacity key={c} onPress={() => set("currency")(c)} style={[s.chip, form.currency === c && s.chipActive]}>
                    <Text style={[s.chipText, form.currency === c && s.chipActiveText]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

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

          <View style={s.field}>
            <Text style={s.label}>Next Billing Date</Text>
            <TextInput
              style={s.input} placeholder="YYYY-MM-DD" placeholderTextColor={colors.text4}
              value={form.next_billing_date} onChangeText={set("next_billing_date")} keyboardType="numeric"
            />
          </View>

          <View style={s.field}>
            <Text style={s.label}>Category</Text>
            <View style={s.catGrid}>
              {CATEGORIES.map(c => (
                <TouchableOpacity key={c} onPress={() => set("category")(c)} style={[s.catChip, form.category === c && { borderColor: categoryColors[c] || colors.primary, backgroundColor: (categoryColors[c] || colors.primary) + "22" }]}>
                  <Text style={[s.catChipText, form.category === c && { color: categoryColors[c] || colors.primary }]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ── Usage rating — the waste detector ── */}
          <View style={s.field}>
            <Text style={s.label}>How much do you use this?</Text>
            <Text style={s.sublabel}>Helps detect subscriptions worth cancelling</Text>
            <View style={s.ratingRow}>
              {[1, 2, 3, 4, 5].map(r => (
                <TouchableOpacity key={r} onPress={() => set("usage_rating")(form.usage_rating === r ? null : r)} style={[s.ratingBtn, form.usage_rating >= r && { borderColor: RATING_COLORS[r], backgroundColor: RATING_COLORS[r] + "22" }]}>
                  <Text style={{ fontSize: 20 }}>{"⭐"}</Text>
                  <Text style={[s.ratingLabel, form.usage_rating >= r && { color: RATING_COLORS[r] }]}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {form.usage_rating && (
              <Text style={[s.ratingHint, { color: RATING_COLORS[form.usage_rating] }]}>
                {RATING_LABELS[form.usage_rating]}
              </Text>
            )}
          </View>

          {/* ── Cancel URL ── */}
          <View style={s.field}>
            <Text style={s.label}>Cancellation Link (optional)</Text>
            <TextInput
              style={s.input} placeholder="https://..." placeholderTextColor={colors.text4}
              value={form.cancel_url} onChangeText={set("cancel_url")}
              autoCapitalize="none" keyboardType="url"
            />
          </View>

          <View style={s.field}>
            <Text style={s.label}>Notes (optional)</Text>
            <TextInput style={[s.input, { height: 72, textAlignVertical: "top" }]} placeholder="Any notes..." placeholderTextColor={colors.text4} value={form.notes} onChangeText={set("notes")} multiline />
          </View>

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

          <View style={s.btnRow}>
            <TouchableOpacity style={s.cancelBtn} onPress={onClose}>
              <Text style={s.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <LinearGradient colors={loading ? ["rgba(124,58,237,0.5)", "rgba(6,182,212,0.5)"] : [colors.primary, colors.cyan]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.saveBtn}>
              <TouchableOpacity style={s.saveBtnInner} onPress={handleSubmit} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.saveText}>{isEdit ? "Save Changes" : "Add Subscription"}</Text>}
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  safe:             { flex: 1, backgroundColor: colors.bg, paddingTop: Platform.OS === "android" ? 24 : 0 },
  header:           { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, borderBottomWidth: 1, borderColor: colors.border2 },
  title:            { fontFamily: "Poppins_800ExtraBold", fontSize: 18, color: colors.text },
  closeBtn:         { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  closeText:        { fontFamily: "Inter_400Regular", fontSize: 18, color: colors.text3 },
  scroll:           { padding: 20 },

  errorBox:         { backgroundColor: "rgba(239,68,68,0.1)", borderWidth: 1, borderColor: "rgba(239,68,68,0.3)", borderRadius: 10, padding: 12, marginBottom: 16 },
  errorText:        { fontFamily: "Inter_500Medium", fontSize: 13, color: "#fca5a5" },

  field:            { marginBottom: 18 },
  row:              { flexDirection: "row", gap: 12 },
  label:            { fontFamily: "Inter_600SemiBold", fontSize: 11, color: colors.text3, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 4 },
  sublabel:         { fontFamily: "Inter_400Regular", fontSize: 12, color: colors.text4, marginBottom: 10 },
  input:            { backgroundColor: colors.bg2, borderWidth: 1, borderColor: colors.border2, borderRadius: 10, padding: 13, fontSize: 15, color: colors.text, fontFamily: "Inter_400Regular" },

  templateToggle:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  templateChevron:  { fontFamily: "Inter_400Regular", fontSize: 12, color: colors.text4 },
  templateRow:      { gap: 10, paddingBottom: 4 },
  templateChip:     { backgroundColor: colors.card, borderWidth: 1, borderRadius: 14, padding: 12, alignItems: "center", width: 90 },
  templateDot:      { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", marginBottom: 6 },
  templateDotText:  { fontFamily: "Inter_800ExtraBold", fontSize: 16, color: "#fff" },
  templateName:     { fontFamily: "Inter_600SemiBold", fontSize: 11, color: colors.text2, textAlign: "center", marginBottom: 2 },
  templateAmt:      { fontFamily: "Inter_700Bold", fontSize: 12, color: colors.text4 },

  picker:           { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip:             { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: colors.border2, backgroundColor: colors.bg2 },
  chipActive:       { borderColor: colors.primary, backgroundColor: colors.primary + "22" },
  chipText:         { fontFamily: "Inter_500Medium", fontSize: 12, color: colors.text3 },
  chipActiveText:   { color: colors.primaryLight },

  toggleRow:        { flexDirection: "row", gap: 8 },
  toggleBtn:        { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: colors.border2, alignItems: "center", backgroundColor: colors.bg2 },
  toggleActive:     { borderColor: colors.primary, backgroundColor: colors.primary + "22" },
  toggleText:       { fontFamily: "Inter_500Medium", fontSize: 14, color: colors.text3 },
  toggleActiveText: { color: colors.primaryLight, fontFamily: "Inter_600SemiBold" },

  catGrid:          { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  catChip:          { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: colors.border2, backgroundColor: colors.bg2 },
  catChipText:      { fontFamily: "Inter_500Medium", fontSize: 13, color: colors.text3 },

  ratingRow:        { flexDirection: "row", gap: 8 },
  ratingBtn:        { flex: 1, alignItems: "center", paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: colors.border2, backgroundColor: colors.bg2 },
  ratingLabel:      { fontFamily: "Inter_600SemiBold", fontSize: 12, color: colors.text4, marginTop: 2 },
  ratingHint:       { fontFamily: "Inter_600SemiBold", fontSize: 13, marginTop: 8, textAlign: "center" },

  btnRow:           { flexDirection: "row", gap: 12, marginTop: 8, marginBottom: 40 },
  cancelBtn:        { flex: 1, backgroundColor: colors.bg2, borderWidth: 1, borderColor: colors.border2, borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  cancelText:       { fontFamily: "Inter_600SemiBold", fontSize: 15, color: colors.text3 },
  saveBtn:          { flex: 2, borderRadius: 12 },
  saveBtnInner:     { paddingVertical: 15, alignItems: "center" },
  saveText:         { fontFamily: "Inter_700Bold", fontSize: 15, color: "#fff" },
});
