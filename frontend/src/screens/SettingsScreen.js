import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, Switch, Linking, Platform, TextInput, ActivityIndicator } from "react-native";
import { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colors } from "../theme";
import { api } from "../api";
import StaggerReveal from "../components/StaggerReveal";
import BrandShapes from "../components/BrandShapes";

export default function SettingsScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [mailbox, setMailbox] = useState(null);
  const [mailboxLoading, setMailboxLoading] = useState(false);
  const [mailboxError, setMailboxError] = useState("");
  const [mailboxProvider, setMailboxProvider] = useState("gmail");
  const [mailboxEmail, setMailboxEmail] = useState("");
  const [connectLoading, setConnectLoading] = useState(false);
  const [disconnectLoading, setDisconnectLoading] = useState(false);

  const [candidates, setCandidates] = useState([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [candidatesError, setCandidatesError] = useState("");
  const [seedLoading, setSeedLoading] = useState(false);
  const [candidateActionId, setCandidateActionId] = useState(null);

  useEffect(() => {
    AsyncStorage.getItem("st_user").then((raw) => {
      if (raw) setUser(JSON.parse(raw));
    });
    AsyncStorage.getItem("st_notifications").then((val) => {
      setNotificationsEnabled(val === "true");
    });

    loadDiscoveryMailbox();
    loadPendingCandidates();
  }, []);

  const mailboxStatus = String(mailbox?.status || "").toLowerCase();
  const mailboxConnected = Boolean(
    mailbox?.connected || mailbox?.is_connected || mailboxStatus === "connected"
  );

  const mailboxStatusLabel = mailboxConnected
    ? `Connected${mailbox?.email ? ` as ${mailbox.email}` : ""}`
    : "Not connected";

  const loadDiscoveryMailbox = async () => {
    setMailboxLoading(true);
    setMailboxError("");
    try {
      const data = await api.discoveryMailbox();
      const mailboxData = data?.mailbox || data || null;
      setMailbox(mailboxData);
      if (mailboxData?.email) setMailboxEmail(mailboxData.email);
      if (mailboxData?.provider) setMailboxProvider(String(mailboxData.provider).toLowerCase());
    } catch (err) {
      setMailboxError(err.message || "Failed to load mailbox status.");
    } finally {
      setMailboxLoading(false);
    }
  };

  const loadPendingCandidates = async () => {
    setCandidatesLoading(true);
    setCandidatesError("");
    try {
      const data = await api.discoveryCandidates("pending");
      const list = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
      setCandidates(list);
    } catch (err) {
      setCandidatesError(err.message || "Failed to load discovery candidates.");
    } finally {
      setCandidatesLoading(false);
    }
  };

  const handleConnectMailbox = async () => {
    const provider = mailboxProvider.trim().toLowerCase();
    const email = mailboxEmail.trim();
    if (!provider || !email) {
      Alert.alert("Missing details", "Provider and email are required.");
      return;
    }

    setConnectLoading(true);
    setMailboxError("");
    try {
      await api.connectDiscoveryMailbox(provider, email);
      await loadDiscoveryMailbox();
    } catch (err) {
      setMailboxError(err.message || "Failed to connect mailbox.");
    } finally {
      setConnectLoading(false);
    }
  };

  const handleDisconnectMailbox = async () => {
    setDisconnectLoading(true);
    setMailboxError("");
    try {
      await api.disconnectDiscoveryMailbox();
      await loadDiscoveryMailbox();
    } catch (err) {
      setMailboxError(err.message || "Failed to disconnect mailbox.");
    } finally {
      setDisconnectLoading(false);
    }
  };

  const handleSeedDemoCandidates = async () => {
    setSeedLoading(true);
    setCandidatesError("");
    try {
      await api.seedDiscoveryDemoCandidates();
      await loadPendingCandidates();
    } catch (err) {
      setCandidatesError(err.message || "Failed to seed demo candidates.");
    } finally {
      setSeedLoading(false);
    }
  };

  const handleCandidateAction = async (candidateId, action) => {
    setCandidateActionId(candidateId);
    setCandidatesError("");
    try {
      if (action === "accept") {
        await api.acceptDiscoveryCandidate(candidateId);
      } else if (action === "reject") {
        await api.rejectDiscoveryCandidate(candidateId);
      } else {
        await api.falsePositiveDiscoveryCandidate(candidateId);
      }
      await loadPendingCandidates();
    } catch (err) {
      setCandidatesError(err.message || "Failed to update candidate.");
    } finally {
      setCandidateActionId(null);
    }
  };

  const formatCurrency = (value, currency = "USD") => {
    const num = Number(value);
    if (Number.isNaN(num)) return "-";
    try {
      return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(num);
    } catch {
      return `$${num.toFixed(2)}`;
    }
  };

  const formatConfidence = (value) => {
    const num = Number(value);
    if (Number.isNaN(num)) return "-";
    const pct = num <= 1 ? num * 100 : num;
    return `${Math.round(pct)}%`;
  };

  const handleLogout = () => {
    Alert.alert("Log out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.multiRemove(["st_token", "st_user"]);
          navigation.reset({ index: 0, routes: [{ name: "Landing" }] });
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert("Delete Account", "This will permanently delete your account and subscription data.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete Account",
        style: "destructive",
        onPress: async () => {
          try {
            await api.deleteAccount();
            await AsyncStorage.multiRemove(["st_token", "st_user"]);
            navigation.reset({ index: 0, routes: [{ name: "Landing" }] });
          } catch (err) {
            Alert.alert("Error", err.message || "Failed to delete account.");
          }
        },
      },
    ]);
  };

  const handleExportCSV = async () => {
    const token = await AsyncStorage.getItem("st_token");
    if (!token) return;
    const url = api.exportCsvUrl();
    Linking.openURL(`${url}?token=${token}`).catch(() => Alert.alert("Error", "Could not open export URL."));
  };

  const toggleNotifications = async (val) => {
    setNotificationsEnabled(val);
    await AsyncStorage.setItem("st_notifications", val ? "true" : "false");
  };

  const Row = ({ label, value, onPress, isDanger, rightElement }) => (
    <TouchableOpacity style={s.row} onPress={onPress} disabled={!onPress && !rightElement}>
      <Text style={[s.rowLabel, isDanger && s.rowLabelDanger]}>{label}</Text>
      {rightElement || (value ? <Text style={s.rowValue}>{value}</Text> : <Text style={s.rowChevron}>›</Text>)}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={s.safe}>
      <BrandShapes variant="settings" style={s.bgShapes} />
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <StaggerReveal style={s.headRow} delay={50} profile="snappy">
          <TouchableOpacity style={s.back} onPress={() => navigation.goBack()}><Text style={s.backText}>Back</Text></TouchableOpacity>
          <Text style={s.badge}>Profile and Preferences</Text>
        </StaggerReveal>

        <StaggerReveal delay={90} profile="smooth">
          <Text style={s.title}>Settings</Text>
          <Text style={s.sub}>Manage account details, reminders, and your data controls.</Text>
        </StaggerReveal>

        <StaggerReveal style={s.section} delay={130} profile="smooth">
          <Text style={s.sectionLabel}>Account</Text>
          <Row label="Email" value={user?.email || "-"} />
          <View style={s.divider} />
          <Row label="Name" value={user?.name || "-"} />
          <View style={s.divider} />
          <Row label="Plan" value={user?.plan === "pro" ? "Pro" : "Free"} onPress={() => navigation.navigate("Pricing")} />
        </StaggerReveal>

        <StaggerReveal style={s.section} delay={160} profile="smooth">
          <Text style={s.sectionLabel}>Preferences</Text>
          <Row
            label="Renewal reminders"
            rightElement={
              <Switch
                value={notificationsEnabled}
                onValueChange={toggleNotifications}
                trackColor={{ false: "#cbd5e1", true: "#8ab0ad" }}
                thumbColor={notificationsEnabled ? colors.primary : "#fff"}
              />
            }
          />
          <Text style={s.prefHint}>
            {Platform.OS === "web"
              ? "Web fallback: renewal reminders are tracked in-app on your dashboard. For device-level alerts, use the mobile app."
              : "Mobile: when enabled, local reminder notifications are scheduled on this device."}
          </Text>
        </StaggerReveal>

        <StaggerReveal style={s.section} delay={190} profile="smooth">
          <Text style={s.sectionLabel}>Data & Support</Text>
          <Row label="Export subscriptions to CSV" onPress={handleExportCSV} />
          <View style={s.divider} />
          <Row label="Open API docs" onPress={() => Linking.openURL("http://localhost:8000/docs")} />
          <View style={s.divider} />
          <Row label="Report a bug" onPress={() => Linking.openURL("https://github.com/paraspahwa/subtrack/issues")} />
        </StaggerReveal>

        <StaggerReveal style={s.section} delay={205} profile="smooth">
          <Text style={s.sectionLabel}>Discovery</Text>
          <Text style={s.discoveryHint}>Mailbox status: {mailboxStatusLabel}</Text>
          {!!mailbox?.provider && <Text style={s.discoveryHint}>Provider: {String(mailbox.provider).toUpperCase()}</Text>}
          {mailboxLoading && <ActivityIndicator style={s.discoveryLoader} color={colors.primary} />}
          {!!mailboxError && <Text style={s.errorText}>{mailboxError}</Text>}

          <View style={s.formRow}>
            <TextInput
              value={mailboxProvider}
              onChangeText={setMailboxProvider}
              placeholder="provider (gmail/outlook)"
              placeholderTextColor={colors.text4}
              style={[s.input, s.inputCompact]}
              autoCapitalize="none"
            />
            <TextInput
              value={mailboxEmail}
              onChangeText={setMailboxEmail}
              placeholder="mailbox email"
              placeholderTextColor={colors.text4}
              style={[s.input, s.inputWide]}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={s.actionRow}>
            <TouchableOpacity
              style={[s.actionBtn, (connectLoading || mailboxLoading) && s.actionBtnDisabled]}
              onPress={handleConnectMailbox}
              disabled={connectLoading || mailboxLoading}
            >
              <Text style={s.actionBtnText}>{connectLoading ? "Connecting..." : "Connect"}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.actionBtn, (disconnectLoading || mailboxLoading || !mailboxConnected) && s.actionBtnDisabled]}
              onPress={handleDisconnectMailbox}
              disabled={disconnectLoading || mailboxLoading || !mailboxConnected}
            >
              <Text style={s.actionBtnText}>{disconnectLoading ? "Disconnecting..." : "Disconnect"}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.actionBtn, (seedLoading || candidatesLoading) && s.actionBtnDisabled]}
              onPress={handleSeedDemoCandidates}
              disabled={seedLoading || candidatesLoading}
            >
              <Text style={s.actionBtnText}>{seedLoading ? "Seeding..." : "Seed Demo"}</Text>
            </TouchableOpacity>
          </View>

          <View style={s.discoveryDivider} />
          <Text style={s.discoverySubLabel}>Pending Candidates</Text>
          {candidatesLoading ? (
            <ActivityIndicator style={s.discoveryLoader} color={colors.primary} />
          ) : candidates.length === 0 ? (
            <Text style={s.emptyText}>No pending candidates.</Text>
          ) : (
            candidates.map((candidate, index) => {
              const id = candidate?.id;
              const isActing = candidateActionId === id;
              const canAct = Boolean(id) && !isActing;
              const merchant = candidate?.merchant || candidate?.merchant_name || candidate?.name || "Unknown merchant";
              const amount = formatCurrency(candidate?.amount, candidate?.currency || "USD");
              const confidence = formatConfidence(candidate?.confidence);

              return (
                <View key={id ? String(id) : `candidate-${index}`} style={s.candidateCard}>
                  <View style={s.candidateTopRow}>
                    <Text style={s.candidateMerchant}>{merchant}</Text>
                    <Text style={s.candidateMeta}>{amount}</Text>
                  </View>
                  <Text style={s.candidateMeta}>Confidence: {confidence}</Text>
                  <View style={s.candidateActionRow}>
                    <TouchableOpacity
                      style={[s.candidateBtn, !canAct && s.actionBtnDisabled]}
                      onPress={() => handleCandidateAction(id, "accept")}
                      disabled={!canAct}
                    >
                      <Text style={s.candidateBtnText}>Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[s.candidateBtn, !canAct && s.actionBtnDisabled]}
                      onPress={() => handleCandidateAction(id, "reject")}
                      disabled={!canAct}
                    >
                      <Text style={s.candidateBtnText}>Reject</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[s.candidateBtn, !canAct && s.actionBtnDisabled]}
                      onPress={() => handleCandidateAction(id, "false-positive")}
                      disabled={!canAct}
                    >
                      <Text style={s.candidateBtnText}>False Positive</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
          {!!candidatesError && <Text style={s.errorText}>{candidatesError}</Text>}
        </StaggerReveal>

        <StaggerReveal style={s.section} delay={220} profile="smooth">
          <Text style={s.sectionLabel}>Account Actions</Text>
          <Row label="Log out" onPress={handleLogout} isDanger />
          <View style={s.divider} />
          <Row label="Delete account permanently" onPress={handleDeleteAccount} isDanger />
        </StaggerReveal>

        <StaggerReveal delay={250} profile="snappy">
          <Text style={s.version}>SubTrack v1.0.0</Text>
        </StaggerReveal>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  bgShapes: { opacity: 0.62 },
  scroll: { padding: 20, paddingBottom: 34 },

  headRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  back: { borderWidth: 1, borderColor: colors.border2, borderRadius: 999, paddingHorizontal: 13, paddingVertical: 8, backgroundColor: "rgba(255,255,255,0.64)" },
  backText: { fontFamily: "Inter_600SemiBold", color: colors.text2, fontSize: 12 },
  badge: { fontFamily: "Inter_600SemiBold", color: colors.primary, fontSize: 11, textTransform: "uppercase", letterSpacing: 1 },

  title: { fontFamily: "Poppins_900Black", fontSize: 34, color: colors.text, marginBottom: 6 },
  sub: { fontFamily: "Inter_400Regular", fontSize: 14, color: colors.text3, lineHeight: 21, marginBottom: 16 },

  section: { borderWidth: 1, borderColor: colors.border2, backgroundColor: colors.card, borderRadius: 18, padding: 14, marginBottom: 12 },
  sectionLabel: { fontFamily: "Inter_700Bold", color: colors.text3, textTransform: "uppercase", letterSpacing: 1, fontSize: 11, marginBottom: 7 },
  divider: { height: 1, backgroundColor: colors.border2, marginHorizontal: 2 },

  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 13, gap: 10 },
  rowLabel: { fontFamily: "Inter_500Medium", color: colors.text, fontSize: 15, flex: 1 },
  rowLabelDanger: { color: colors.error },
  rowValue: { fontFamily: "Inter_500Medium", color: colors.text3, fontSize: 13, maxWidth: "60%" },
  rowChevron: { fontFamily: "Inter_700Bold", color: colors.text4, fontSize: 17 },
  prefHint: { marginTop: 4, fontFamily: "Inter_400Regular", color: colors.text4, fontSize: 12, lineHeight: 18 },

  discoveryHint: { fontFamily: "Inter_400Regular", color: colors.text3, fontSize: 13, marginBottom: 4 },
  discoverySubLabel: { fontFamily: "Inter_600SemiBold", color: colors.text2, fontSize: 13, marginBottom: 8 },
  discoveryLoader: { marginVertical: 10 },
  discoveryDivider: { height: 1, backgroundColor: colors.border2, marginVertical: 10 },
  formRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  input: {
    borderWidth: 1,
    borderColor: colors.border2,
    borderRadius: 12,
    backgroundColor: colors.bg2,
    paddingHorizontal: 10,
    paddingVertical: 9,
    fontFamily: "Inter_400Regular",
    color: colors.text,
    fontSize: 13,
  },
  inputCompact: { flex: 0.8 },
  inputWide: { flex: 1.2 },
  actionRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  actionBtn: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "rgba(18,94,89,0.08)",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  actionBtnDisabled: { opacity: 0.5 },
  actionBtnText: { fontFamily: "Inter_600SemiBold", color: colors.primary, fontSize: 12 },
  emptyText: { fontFamily: "Inter_400Regular", color: colors.text4, fontSize: 13 },
  errorText: { marginTop: 8, fontFamily: "Inter_500Medium", color: colors.error, fontSize: 12 },

  candidateCard: {
    borderWidth: 1,
    borderColor: colors.border2,
    borderRadius: 12,
    backgroundColor: colors.bg2,
    padding: 10,
    marginBottom: 8,
  },
  candidateTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  candidateMerchant: { flex: 1, fontFamily: "Inter_600SemiBold", color: colors.text, fontSize: 14 },
  candidateMeta: { fontFamily: "Inter_400Regular", color: colors.text3, fontSize: 12, marginTop: 4 },
  candidateActionRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 9 },
  candidateBtn: {
    borderWidth: 1,
    borderColor: colors.border2,
    borderRadius: 10,
    backgroundColor: colors.card,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  candidateBtnText: { fontFamily: "Inter_600SemiBold", color: colors.text2, fontSize: 12 },

  version: { fontFamily: "Inter_500Medium", color: colors.text4, textAlign: "center", marginTop: 6, fontSize: 12 },
});
