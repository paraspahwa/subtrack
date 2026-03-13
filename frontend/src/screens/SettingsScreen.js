import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, Switch, Linking } from "react-native";
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

  useEffect(() => {
    AsyncStorage.getItem("st_user").then((raw) => {
      if (raw) setUser(JSON.parse(raw));
    });
    AsyncStorage.getItem("st_notifications").then((val) => {
      setNotificationsEnabled(val === "true");
    });
  }, []);

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
        </StaggerReveal>

        <StaggerReveal style={s.section} delay={190} profile="smooth">
          <Text style={s.sectionLabel}>Data & Support</Text>
          <Row label="Export subscriptions to CSV" onPress={handleExportCSV} />
          <View style={s.divider} />
          <Row label="Open API docs" onPress={() => Linking.openURL("http://localhost:8000/docs")} />
          <View style={s.divider} />
          <Row label="Report a bug" onPress={() => Linking.openURL("https://github.com/paraspahwa/subtrack/issues")} />
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

  version: { fontFamily: "Inter_500Medium", color: colors.text4, textAlign: "center", marginTop: 6, fontSize: 12 },
});
