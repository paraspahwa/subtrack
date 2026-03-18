import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Modal } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colors } from "../theme";
import { api } from "../api";
import StaggerReveal from "../components/StaggerReveal";
import InteractiveButton from "../components/InteractiveButton";
import BrandShapes from "../components/BrandShapes";

export default function AuthScreen({ navigation, route }) {
  const [mode, setMode] = useState(route.params?.mode || "login");
  const [form, setForm] = useState({ email: "", password: "", fullName: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetInfo, setResetInfo] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [resetStep, setResetStep] = useState(1);
  const [resetToken, setResetToken] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetDone, setResetDone] = useState(false);

  const [verifyMode, setVerifyMode] = useState(false);
  const [otp, setOtp] = useState("");

  const set = (key) => (val) => {
    setForm((p) => ({ ...p, [key]: val }));
    setError("");
  };

  const handleVerify = async () => {
    if (otp.length < 6) return setError("Enter the 6-digit code.");
    setLoading(true);
    setError("");
    try {
      const data = await api.verifyEmail(form.email.trim().toLowerCase(), otp.trim());
      await saveSession(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const saveSession = async (data) => {
    await AsyncStorage.setItem("st_token", data.access_token);
    await AsyncStorage.setItem(
      "st_user",
      JSON.stringify({ id: data.user_id, email: data.email, name: data.full_name, plan: data.plan })
    );
    navigation.reset({ index: 0, routes: [{ name: "Dashboard" }] });
  };

  const handleSubmit = async () => {
    setError("");
    if (mode === "signup") {
      if (!form.fullName.trim()) return setError("Please enter your name.");
      if (form.password.length < 6) return setError("Password must be at least 6 characters.");
      if (form.password !== form.confirmPassword) return setError("Passwords do not match.");
    }
    if (!form.email.includes("@")) return setError("Enter a valid email address.");

    setLoading(true);
    try {
      const data =
        mode === "login"
          ? await api.login({ email: form.email, password: form.password })
          : await api.register({ email: form.email, password: form.password, full_name: form.fullName });

      if (data.requireEmailVerification) {
        setVerifyMode(true);
      } else {
        await saveSession(data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <LinearGradient colors={["#fdf7eb", "#f6f3ea"]} style={s.bg}>
        <BrandShapes variant="auth" />

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
            <TouchableOpacity style={s.back} onPress={() => navigation.navigate("Landing")} hitSlop={8}>
              <Text style={s.backText}>Back to Home</Text>
            </TouchableOpacity>

            <StaggerReveal style={s.card} delay={80} profile="gentle">
              <View style={s.logoRow}>
                <View style={s.logoBadge}><Text style={s.logoBadgeText}>S</Text></View>
                <Text style={s.logoText}>SubTrack</Text>
              </View>

              {verifyMode ? (
                <>
                  <Text style={s.title}>Verify your email</Text>
                  <Text style={s.subtitle}>We've sent a 6-digit code to {form.email}. Enter it below to continue.</Text>

                  {error ? (
                    <View style={s.errorBox}>
                      <Text style={s.errorText}>{error}</Text>
                    </View>
                  ) : null}

                  <View style={s.field}>
                    <Text style={s.label}>Verification Code</Text>
                    <TextInput
                      style={s.input}
                      placeholder="123456"
                      placeholderTextColor={colors.text4}
                      value={otp}
                      onChangeText={(v) => { setOtp(v); setError(""); }}
                      keyboardType="number-pad"
                      maxLength={6}
                    />
                  </View>

                  {loading ? (
                    <LinearGradient colors={["#7ea8a5", "#7ea8a5"]} style={s.submitBtnLoading}>
                      <View style={s.submitInner}><ActivityIndicator color="#fff" /></View>
                    </LinearGradient>
                  ) : (
                    <InteractiveButton label="Verify & Continue" onPress={handleVerify} style={s.submitBtn} />
                  )}

                  <TouchableOpacity 
                    onPress={() => {
                      setVerifyMode(false);
                      setError("");
                    }} 
                    style={[s.switchRow, { marginTop: 20 }]}
                  >
                    <Text style={s.switchLink}>Back to Sign Up</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <View style={s.tabs}>
                    {["login", "signup"].map((m) => (
                      <TouchableOpacity key={m} style={s.tabBtn} onPress={() => { setMode(m); setError(""); }} hitSlop={8}>
                        <LinearGradient
                          colors={mode === m ? [colors.primary, "#1f7a73"] : ["transparent", "transparent"]}
                          style={[s.tabSurface, mode !== m && s.tabInactive]}
                        >
                          <Text style={[s.tabText, mode === m ? s.tabTextActive : null]}>{m === "login" ? "Log In" : "Sign Up"}</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={s.title}>{mode === "login" ? "Welcome back" : "Create your account"}</Text>
                  <Text style={s.subtitle}>{mode === "login" ? "Access your dashboard and renewals." : "Start tracking subscriptions in under one minute."}</Text>

                  {error ? (
                    <View style={s.errorBox}>
                      <Text style={s.errorText}>{error}</Text>
                    </View>
                  ) : null}

                  {mode === "signup" && (
                    <View style={s.field}>
                      <Text style={s.label}>Full Name</Text>
                      <TextInput
                        style={s.input}
                        placeholder="Your name"
                        placeholderTextColor={colors.text4}
                        value={form.fullName}
                        onChangeText={set("fullName")}
                        autoCapitalize="words"
                      />
                    </View>
                  )}

                  <View style={s.field}>
                    <Text style={s.label}>Email</Text>
                    <TextInput
                      style={s.input}
                      placeholder="you@example.com"
                      placeholderTextColor={colors.text4}
                      value={form.email}
                      onChangeText={set("email")}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      autoComplete="email"
                    />
                  </View>

                  <View style={s.field}>
                    <Text style={s.label}>Password</Text>
                    <View style={s.passWrap}>
                      <TextInput
                        style={[s.input, { flex: 1, paddingRight: 56 }]}
                        placeholder={mode === "login" ? "Your password" : "At least 6 characters"}
                        placeholderTextColor={colors.text4}
                        value={form.password}
                        onChangeText={set("password")}
                        secureTextEntry={!showPass}
                        autoCapitalize="none"
                      />
                      <TouchableOpacity style={s.eyeBtn} onPress={() => setShowPass((p) => !p)} hitSlop={8}>
                        <Text style={s.eyeText}>{showPass ? "Hide" : "Show"}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {mode === "login" && (
                    <TouchableOpacity onPress={() => {
                      setResetMode(true);
                      setResetStep(1);
                      setResetDone(false);
                      setResetToken("");
                      setNewPassword("");
                      setResetError("");
                      setResetInfo("");
                    }} style={s.forgotWrap}>
                      <Text style={s.forgotText}>Forgot password?</Text>
                    </TouchableOpacity>
                  )}

                  {mode === "signup" && (
                    <View style={s.field}>
                      <Text style={s.label}>Confirm Password</Text>
                      <TextInput
                        style={s.input}
                        placeholder="Repeat password"
                        placeholderTextColor={colors.text4}
                        value={form.confirmPassword}
                        onChangeText={set("confirmPassword")}
                        secureTextEntry={!showPass}
                        autoCapitalize="none"
                      />
                    </View>
                  )}

                  {loading ? (
                    <LinearGradient colors={["#7ea8a5", "#7ea8a5"]} style={s.submitBtnLoading}>
                      <View style={s.submitInner}><ActivityIndicator color="#fff" /></View>
                    </LinearGradient>
                  ) : (
                    <InteractiveButton label={mode === "login" ? "Continue" : "Create Account"} onPress={handleSubmit} style={s.submitBtn} />
                  )}

                  <View style={s.switchRow}>
                    <Text style={s.switchText}>{mode === "login" ? "No account yet?" : "Already have an account?"}</Text>
                    <TouchableOpacity onPress={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }} hitSlop={8}>
                      <Text style={s.switchLink}>{mode === "login" ? "Sign up" : "Log in"}</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </StaggerReveal>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>

      <Modal visible={resetMode} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>{resetDone ? "Password updated" : resetStep === 1 ? "Reset your password" : "Set a new password"}</Text>
            {resetError ? (
              <View style={s.errorBox}>
                <Text style={s.errorText}>{resetError}</Text>
              </View>
            ) : null}
            {resetInfo ? (
              <View style={s.infoBox}>
                <Text style={s.infoText}>{resetInfo}</Text>
              </View>
            ) : null}

            {resetDone ? (
              <>
                <Text style={s.modalSub}>You can now sign in with your new password.</Text>
                <TouchableOpacity style={s.outlineBtn} onPress={() => {
                  setResetMode(false);
                  setMode("login");
                  setResetDone(false);
                  setResetStep(1);
                  setResetToken("");
                  setNewPassword("");
                  setResetError("");
                  setResetInfo("");
                }}>
                  <Text style={s.outlineBtnText}>Back to Log In</Text>
                </TouchableOpacity>
              </>
            ) : resetStep === 1 ? (
              <>
                <Text style={s.modalSub}>Enter your email. If an account exists, reset instructions will be sent.</Text>
                <TextInput
                  style={s.input}
                  placeholder="you@example.com"
                  placeholderTextColor={colors.text4}
                  value={resetEmail}
                  onChangeText={(v) => {
                    setResetEmail(v);
                    setResetError("");
                    setResetInfo("");
                  }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
                <LinearGradient colors={[colors.primary, "#1f7a73"]} style={[s.submitBtn, { marginTop: 16 }]}>
                  <TouchableOpacity style={s.submitInner} onPress={handleForgotPassword} disabled={loading}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.submitText}>Send Token</Text>}
                  </TouchableOpacity>
                </LinearGradient>
              </>
            ) : (
              <>
                <Text style={s.modalSub}>Paste your token and choose a stronger password.</Text>
                <TextInput
                  style={[s.input, { marginBottom: 12 }]}
                  placeholder="Reset token"
                  placeholderTextColor={colors.text4}
                  value={resetToken}
                  onChangeText={(v) => {
                    setResetToken(v);
                    setResetError("");
                    setResetInfo("");
                  }}
                  autoCapitalize="none"
                />
                <TextInput
                  style={s.input}
                  placeholder="New password"
                  placeholderTextColor={colors.text4}
                  value={newPassword}
                  onChangeText={(v) => {
                    setNewPassword(v);
                    setResetError("");
                    setResetInfo("");
                  }}
                  secureTextEntry
                  autoCapitalize="none"
                />
                <LinearGradient colors={[colors.primary, "#1f7a73"]} style={[s.submitBtn, { marginTop: 16 }]}>
                  <TouchableOpacity style={s.submitInner} onPress={handleResetPassword} disabled={loading}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.submitText}>Reset Password</Text>}
                  </TouchableOpacity>
                </LinearGradient>
              </>
            )}

            {!resetDone && (
              <TouchableOpacity style={s.cancelWrap} onPress={() => {
                setResetMode(false);
                setResetError("");
                setResetInfo("");
              }}>
                <Text style={s.forgotText}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  bg: { flex: 1 },
  scroll: { padding: 20, paddingTop: 12 },
  back: { alignSelf: "flex-start", paddingVertical: 6, paddingHorizontal: 10, backgroundColor: "rgba(255,255,255,0.66)", borderRadius: 999, borderWidth: 1, borderColor: colors.border2, marginBottom: 12 },
  backText: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: colors.text2 },

  card: { backgroundColor: "rgba(255,250,240,0.88)", borderWidth: 1, borderColor: colors.border2, borderRadius: 24, padding: 22 },
  logoRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginBottom: 18 },
  logoBadge: { width: 36, height: 36, borderRadius: 11, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", marginRight: 10 },
  logoBadgeText: { fontFamily: "Poppins_800ExtraBold", color: "#fff", fontSize: 18 },
  logoText: { fontFamily: "Poppins_800ExtraBold", color: colors.text, fontSize: 22 },

  tabs: { flexDirection: "row", borderRadius: 12, backgroundColor: "rgba(255,255,255,0.7)", borderWidth: 1, borderColor: colors.border2, padding: 4, marginBottom: 16 },
  tabBtn: { flex: 1 },
  tabSurface: { borderRadius: 8, alignItems: "center", paddingVertical: 10 },
  tabInactive: { backgroundColor: "transparent" },
  tabText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: colors.text3 },
  tabTextActive: { color: "#fff" },

  title: { fontFamily: "Poppins_800ExtraBold", fontSize: 26, color: colors.text, textAlign: "center" },
  subtitle: { fontFamily: "Inter_400Regular", color: colors.text3, textAlign: "center", fontSize: 14, marginTop: 5, marginBottom: 18 },

  errorBox: { borderRadius: 12, padding: 11, borderWidth: 1, borderColor: "rgba(220,38,38,0.25)", backgroundColor: "rgba(220,38,38,0.08)", marginBottom: 14 },
  errorText: { fontFamily: "Inter_500Medium", color: colors.error, fontSize: 13 },
  infoBox: { borderRadius: 12, padding: 11, borderWidth: 1, borderColor: "rgba(18,94,89,0.24)", backgroundColor: "rgba(18,94,89,0.09)", marginBottom: 14 },
  infoText: { fontFamily: "Inter_500Medium", color: colors.primaryDark, fontSize: 13 },

  field: { marginBottom: 14 },
  label: { fontFamily: "Inter_600SemiBold", color: colors.text3, fontSize: 12, marginBottom: 6 },
  input: { backgroundColor: "rgba(255,255,255,0.72)", borderWidth: 1, borderColor: colors.border2, borderRadius: 12, paddingHorizontal: 13, paddingVertical: 12, fontFamily: "Inter_400Regular", color: colors.text, fontSize: 15 },
  passWrap: { position: "relative" },
  eyeBtn: { position: "absolute", right: 10, top: 11, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, backgroundColor: "rgba(15,23,42,0.07)" },
  eyeText: { fontFamily: "Inter_600SemiBold", fontSize: 11, color: colors.text3 },

  forgotWrap: { alignSelf: "flex-end", marginTop: -6, marginBottom: 8 },
  forgotText: { fontFamily: "Inter_600SemiBold", color: colors.primaryLight, fontSize: 13 },

  submitBtn: { marginTop: 4 },
  submitBtnLoading: { borderRadius: 13, marginTop: 4 },
  submitInner: { paddingVertical: 14, alignItems: "center" },
  submitText: { fontFamily: "Inter_700Bold", color: "#fff", fontSize: 15 },

  switchRow: { marginTop: 16, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6 },
  switchText: { fontFamily: "Inter_400Regular", color: colors.text3, fontSize: 13 },
  switchLink: { fontFamily: "Inter_700Bold", color: colors.primaryLight, fontSize: 13 },

  modalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(15,23,42,0.38)" },
  modalCard: { backgroundColor: colors.bg2, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 22, paddingBottom: 34 },
  modalTitle: { fontFamily: "Poppins_800ExtraBold", color: colors.text, fontSize: 24, marginBottom: 6 },
  modalSub: { fontFamily: "Inter_400Regular", color: colors.text3, fontSize: 14, lineHeight: 20, marginBottom: 14 },
  outlineBtn: { borderWidth: 1, borderColor: colors.border2, borderRadius: 12, paddingVertical: 13, alignItems: "center", marginTop: 4 },
  outlineBtnText: { fontFamily: "Inter_700Bold", color: colors.text2, fontSize: 14 },
  cancelWrap: { marginTop: 16, alignItems: "center" },
});
