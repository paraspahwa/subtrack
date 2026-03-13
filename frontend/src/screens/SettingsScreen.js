import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, Switch, Linking } from "react-native";
import { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colors } from "../theme";
import { api } from "../api";

export default function SettingsScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem("st_user").then(raw => {
      if (raw) setUser(JSON.parse(raw));
    });
    AsyncStorage.getItem("st_notifications").then(val => {
      setNotificationsEnabled(val === "true");
    });
  }, []);

  const handleLogout = () => {
    Alert.alert("Log out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out", style: "destructive", onPress: async () => {
          await AsyncStorage.multiRemove(["st_token", "st_user"]);
          navigation.reset({ index: 0, routes: [{ name: "Landing" }] });
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This will permanently delete your account and all subscription data. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Account", style: "destructive", onPress: async () => {
            try {
              await api.deleteAccount();
              await AsyncStorage.multiRemove(["st_token", "st_user"]);
              navigation.reset({ index: 0, routes: [{ name: "Landing" }] });
            } catch (err) {
              Alert.alert("Error", err.message || "Failed to delete account.");
            }
          },
        },
      ]
    );
  };

  const handleExportCSV = async () => {
    const token = await AsyncStorage.getItem("st_token");
    if (!token) return;
    const url = api.exportCsvUrl();
    // Open the CSV URL in the browser — the Authorization header approach
    // requires a manual download. For Expo, we open via Linking with token in URL param.
    // (In production, use a short-lived signed download URL instead.)
    Linking.openURL(`${url}?token=${token}`).catch(() =>
      Alert.alert("Error", "Could not open export URL.")
    );
  };

  const toggleNotifications = async (val) => {
    setNotificationsEnabled(val);
    await AsyncStorage.setItem("st_notifications", val ? "true" : "false");
  };

  const Row = ({ icon, label, value, onPress, isDestructive, rightElement }) => (
    <TouchableOpacity style={s.row} onPress={onPress} disabled={!onPress && !rightElement}>
      <View style={s.rowLeft}>
        <Text style={s.rowIcon}>{icon}</Text>
        <Text style={[s.rowLabel, isDestructive && { color: colors.error }]}>{label}</Text>
      </View>
      {rightElement || (value ? <Text style={s.rowValue}>{value}</Text> : <Text style={s.chevron}>›</Text>)}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        <TouchableOpacity style={s.back} onPress={() => navigation.goBack()}>
          <Text style={s.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={s.title}>Settings</Text>

        {/* Account */}
        <Text style={s.sectionLabel}>Account</Text>
        <View style={s.section}>
          <Row icon="📧" label="Email" value={user?.email || "—"} />
          <View style={s.divider} />
          <Row icon="👤" label="Name" value={user?.name || "—"} />
          <View style={s.divider} />
          <Row
            icon="⭐"
            label="Plan"
            value={user?.plan === "pro" ? "Pro ✓" : "Free"}
            onPress={() => navigation.navigate("Pricing")}
          />
        </View>

        {/* Preferences */}
        <Text style={s.sectionLabel}>Preferences</Text>
        <View style={s.section}>
          <Row
            icon="🔔"
            label="Renewal Reminders"
            rightElement={
              <Switch
                value={notificationsEnabled}
                onValueChange={toggleNotifications}
                trackColor={{ true: colors.primary }}
                thumbColor={notificationsEnabled ? colors.primaryLight : colors.text4}
              />
            }
          />
        </View>

        {/* Data */}
        <Text style={s.sectionLabel}>Data</Text>
        <View style={s.section}>
          <Row icon="📥" label="Export to CSV" onPress={handleExportCSV} />
        </View>

        {/* Support */}
        <Text style={s.sectionLabel}>Support</Text>
        <View style={s.section}>
          <Row icon="📖" label="API Docs" onPress={() => Linking.openURL("http://localhost:8000/docs")} />
          <View style={s.divider} />
          <Row icon="🐛" label="Report a Bug" onPress={() => Linking.openURL("https://github.com/paraspahwa/subtrack/issues")} />
        </View>

        {/* Danger zone */}
        <Text style={s.sectionLabel}>Account Actions</Text>
        <View style={s.section}>
          <Row icon="🚪" label="Log Out" onPress={handleLogout} />
          <View style={s.divider} />
          <Row icon="🗑️" label="Delete Account" onPress={handleDeleteAccount} isDestructive />
        </View>

        <Text style={s.version}>SubTrack v1.0.0</Text>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: colors.bg },
  scroll:       { padding: 20 },
  back:         { paddingVertical: 8, marginBottom: 8 },
  backText:     { fontFamily: "Inter_500Medium", fontSize: 14, color: colors.text3 },
  title:        { fontFamily: "Poppins_900Black", fontSize: 28, color: colors.text, marginBottom: 24 },

  sectionLabel: { fontFamily: "Inter_600SemiBold", fontSize: 11, color: colors.text4, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, marginTop: 4 },
  section:      { backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border2, marginBottom: 16, overflow: "hidden" },
  divider:      { height: 1, backgroundColor: colors.border2, marginHorizontal: 16 },

  row:          { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16 },
  rowLeft:      { flexDirection: "row", alignItems: "center", gap: 12 },
  rowIcon:      { fontSize: 18, width: 24, textAlign: "center" },
  rowLabel:     { fontFamily: "Inter_500Medium", fontSize: 15, color: colors.text },
  rowValue:     { fontFamily: "Inter_400Regular", fontSize: 14, color: colors.text3 },
  chevron:      { fontSize: 20, color: colors.text4 },

  version:      { fontFamily: "Inter_400Regular", fontSize: 12, color: colors.text4, textAlign: "center", marginTop: 8, marginBottom: 32 },
});
