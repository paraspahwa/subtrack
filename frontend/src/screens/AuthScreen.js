import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colors } from "../theme";
import { api } from "../api";

export default function AuthScreen({ navigation, route }) {
  const [mode, setMode]   = useState(route.params?.mode || "login");
  const [form, setForm]   = useState({ email: "", password: "", fullName: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);

  const set = (key) => (val) => { setForm(p => ({ ...p, [key]: val })); setError(""); };

  const handleSubmit = async () => {
    setError("");
    if (mode === "signup") {
      if (!form.fullName.trim())                         return setError("Please enter your name.");
      if (form.password.length < 6)                     return setError("Password must be at least 6 characters.");
      if (form.password !== form.confirmPassword)        return setError("Passwords do not match.");
    }
    if (!form.email.includes("@"))                       return setError("Enter a valid email address.");

    setLoading(true);
    try {
      const data = mode === "login"
        ? await api.login({ email: form.email, password: form.password })
        : await api.register({ email: form.email, password: form.password, full_name: form.fullName });

      await AsyncStorage.setItem("st_token", data.access_token);
      await AsyncStorage.setItem("st_user", JSON.stringify({ id: data.user_id, email: data.email, name: data.full_name, plan: data.plan }));

      navigation.reset({ index: 0, routes: [{ name: "Dashboard" }] });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

          <TouchableOpacity style={s.back} onPress={() => navigation.navigate("Landing")}>
            <Text style={s.backText}>← Back to Home</Text>
          </TouchableOpacity>

          <View style={s.card}>
            {/* Logo */}
            <View style={s.logo}>
              <Text style={s.logoIcon}>💳</Text>
              <Text style={s.logoText}>SubTrack</Text>
            </View>

            {/* Mode tabs */}
            <View style={s.tabs}>
              {["login", "signup"].map(m => (
                <TouchableOpacity key={m} style={[s.tab, mode === m && s.tabActive]} onPress={() => { setMode(m); setError(""); }}>
                  {mode === m
                    ? <LinearGradient colors={[colors.primary, "#ec4899"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.tabGrad}>
                        <Text style={s.tabActiveText}>{m === "login" ? "Log In" : "Sign Up"}</Text>
                      </LinearGradient>
                    : <Text style={s.tabText}>{m === "login" ? "Log In" : "Sign Up"}</Text>
                  }
                </TouchableOpacity>
              ))}
            </View>

            <Text style={s.title}>{mode === "login" ? "Welcome back 👋" : "Start tracking for free 🚀"}</Text>
            <Text style={s.subtitle}>{mode === "login" ? "Log in to your SubTrack account" : "Create your free account — no credit card needed"}</Text>

            {error ? (
              <View style={s.errorBox}>
                <Text style={s.errorText}>⚠️  {error}</Text>
              </View>
            ) : null}

            {mode === "signup" && (
              <View style={s.field}>
                <Text style={s.label}>Full Name</Text>
                <TextInput
                  style={s.input} placeholder="Your name" placeholderTextColor={colors.text4}
                  value={form.fullName} onChangeText={set("fullName")} autoCapitalize="words"
                />
              </View>
            )}

            <View style={s.field}>
              <Text style={s.label}>Email</Text>
              <TextInput
                style={s.input} placeholder="you@example.com" placeholderTextColor={colors.text4}
                value={form.email} onChangeText={set("email")}
                autoCapitalize="none" keyboardType="email-address" autoComplete="email"
              />
            </View>

            <View style={s.field}>
              <Text style={s.label}>Password</Text>
              <View style={s.passRow}>
                <TextInput
                  style={[s.input, { flex: 1, paddingRight: 44 }]}
                  placeholder={mode === "login" ? "Your password" : "At least 6 characters"}
                  placeholderTextColor={colors.text4}
                  value={form.password} onChangeText={set("password")}
                  secureTextEntry={!showPass} autoCapitalize="none"
                />
                <TouchableOpacity style={s.eyeBtn} onPress={() => setShowPass(p => !p)}>
                  <Text style={{ fontSize: 16 }}>{showPass ? "🙈" : "👁️"}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {mode === "signup" && (
              <View style={s.field}>
                <Text style={s.label}>Confirm Password</Text>
                <TextInput
                  style={s.input} placeholder="Repeat password" placeholderTextColor={colors.text4}
                  value={form.confirmPassword} onChangeText={set("confirmPassword")}
                  secureTextEntry={!showPass} autoCapitalize="none"
                />
              </View>
            )}

            <LinearGradient
              colors={loading ? ["rgba(124,58,237,0.5)", "rgba(6,182,212,0.5)"] : [colors.primary, colors.cyan]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={s.submitBtn}
            >
              <TouchableOpacity style={s.submitInner} onPress={handleSubmit} disabled={loading}>
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={s.submitText}>{mode === "login" ? "🔑  Log In" : "🚀  Create Free Account"}</Text>
                }
              </TouchableOpacity>
            </LinearGradient>

            <View style={s.switchRow}>
              <Text style={s.switchText}>
                {mode === "login" ? "Don't have an account? " : "Already have an account? "}
              </Text>
              <TouchableOpacity onPress={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}>
                <Text style={s.switchLink}>{mode === "login" ? "Sign up free" : "Log in"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: colors.bg },
  scroll:       { padding: 20, paddingTop: 12 },
  back:         { paddingVertical: 8, marginBottom: 16 },
  backText:     { fontFamily: "Inter_500Medium", fontSize: 14, color: colors.text3 },

  card:         { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border2, borderRadius: 24, padding: 28 },
  logo:         { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 24 },
  logoIcon:     { fontSize: 26 },
  logoText:     { fontFamily: "Poppins_800ExtraBold", fontSize: 20, color: colors.primaryLight },

  tabs:         { flexDirection: "row", backgroundColor: colors.bg, borderRadius: 12, padding: 4, marginBottom: 24 },
  tab:          { flex: 1, borderRadius: 9, overflow: "hidden" },
  tabActive:    {},
  tabGrad:      { paddingVertical: 10, alignItems: "center", borderRadius: 9 },
  tabText:      { fontFamily: "Inter_600SemiBold", fontSize: 14, color: colors.text3, textAlign: "center", paddingVertical: 10 },
  tabActiveText:{ fontFamily: "Inter_600SemiBold", fontSize: 14, color: "#fff" },

  title:        { fontFamily: "Poppins_800ExtraBold", fontSize: 22, color: colors.text, textAlign: "center", marginBottom: 6 },
  subtitle:     { fontFamily: "Inter_400Regular", fontSize: 14, color: colors.text3, textAlign: "center", marginBottom: 24 },

  errorBox:     { backgroundColor: "rgba(239,68,68,0.1)", borderWidth: 1, borderColor: "rgba(239,68,68,0.3)", borderRadius: 10, padding: 12, marginBottom: 16 },
  errorText:    { fontFamily: "Inter_500Medium", fontSize: 13, color: "#fca5a5" },

  field:        { marginBottom: 16 },
  label:        { fontFamily: "Inter_600SemiBold", fontSize: 12, color: colors.text3, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 },
  input:        { backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border2, borderRadius: 10, padding: 13, fontSize: 15, color: colors.text, fontFamily: "Inter_400Regular" },
  passRow:      { flexDirection: "row", position: "relative" },
  eyeBtn:       { position: "absolute", right: 12, top: 13, zIndex: 1 },

  submitBtn:    { borderRadius: 12, marginTop: 8 },
  submitInner:  { paddingVertical: 15, alignItems: "center" },
  submitText:   { fontFamily: "Inter_700Bold", fontSize: 16, color: "#fff" },

  switchRow:    { flexDirection: "row", justifyContent: "center", marginTop: 20, flexWrap: "wrap" },
  switchText:   { fontFamily: "Inter_400Regular", fontSize: 14, color: colors.text4 },
  switchLink:   { fontFamily: "Inter_600SemiBold", fontSize: 14, color: colors.primaryLight },
});
