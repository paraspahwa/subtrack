import { ScrollView, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../theme";
import { api } from "../api";

const FREE_FEATURES = [
  "Up to 10 subscriptions",
  "Monthly & yearly spend summary",
  "Category organization",
  "Renewal date tracking",
  "Basic analytics",
];

const PRO_FEATURES = [
  "Unlimited subscriptions",
  "Full analytics dashboard",
  "Renewal alerts (30-day view)",
  "Most expensive breakdown",
  "Spend by category charts",
  "Priority support",
  "Everything in Free",
];

export default function PricingScreen({ navigation }) {
  const [loading, setLoading] = useState(false);

  const loadCheckout = () => {
    try {
      return require("react-native-razorpay").default;
    } catch {
      return null;
    }
  };

  const handleUpgrade = async () => {
    // 1. Check if user is logged in
    const token = await AsyncStorage.getItem("st_token");
    if (!token) {
      navigation.navigate("Auth", { mode: "signup" });
      return;
    }

    setLoading(true);
    try {
      // 2. Create a Razorpay order on the backend (900 paise = ₹9 / $9 equivalent)
      const order = await api.createOrder({ amount: 900, currency: "INR", plan_type: "pro" });

      // 3. Open Razorpay native checkout
      const RazorpayCheckout = loadCheckout();
      if (!RazorpayCheckout) {
        throw new Error("Native checkout is unavailable in this build. Use an Android/iOS dev build for payment testing.");
      }
      const options = {
        description: "SubTrack Pro — Unlimited subscriptions",
        image: "https://i.imgur.com/3g7nmJC.png",
        currency: order.currency || "INR",
        key: order.key_id,
        amount: order.amount,
        name: "SubTrack",
        order_id: order.razorpay_order_id,
        prefill: { email: order.email || "" },
        theme: { color: colors.primary },
      };

      const paymentData = await RazorpayCheckout.open(options);

      // 4. Verify payment on the backend
      await api.verifyPayment({
        razorpay_order_id:   paymentData.razorpay_order_id,
        razorpay_payment_id: paymentData.razorpay_payment_id,
        razorpay_signature:  paymentData.razorpay_signature,
      });

      const me = await api.me();
      await AsyncStorage.setItem("st_user", JSON.stringify({
        id: me.user_id,
        email: me.email,
        name: me.full_name,
        plan: me.plan,
      }));

      Alert.alert(
        "🎉 Welcome to Pro!",
        "Your subscription is now active. Enjoy unlimited tracking.",
        [{ text: "Go to Dashboard", onPress: () => navigation.navigate("Dashboard") }]
      );
    } catch (err) {
      if (err?.code === "PAYMENT_CANCELLED") {
        // User dismissed — no alert needed
      } else {
        Alert.alert("Payment failed", err?.message || "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        <TouchableOpacity style={s.back} onPress={() => navigation.goBack()}>
          <Text style={s.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={s.title}>Simple, honest pricing</Text>
        <Text style={s.sub}>Start free. Upgrade when you need more.</Text>

        {/* Free */}
        <View style={s.card}>
          <Text style={s.planLabel}>Free</Text>
          <View style={s.priceRow}>
            <Text style={s.price}>$0</Text>
            <Text style={s.pricePer}>/month</Text>
          </View>
          <Text style={s.planDesc}>Perfect for getting started</Text>

          <View style={s.divider} />

          {FREE_FEATURES.map(f => (
            <View key={f} style={s.featureRow}>
              <Text style={s.check}>✓</Text>
              <Text style={s.featureText}>{f}</Text>
            </View>
          ))}

          <TouchableOpacity style={s.freeBtn} onPress={() => navigation.navigate("Auth", { mode: "signup" })}>
            <Text style={s.freeBtnText}>Get Started Free</Text>
          </TouchableOpacity>
        </View>

        {/* Pro */}
        <View style={[s.card, s.proCard]}>
          <LinearGradient colors={[colors.primary, colors.cyan]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.badge}>
            <Text style={s.badgeText}>MOST POPULAR</Text>
          </LinearGradient>

          <Text style={[s.planLabel, { color: colors.primaryLight }]}>Pro</Text>
          <View style={s.priceRow}>
            <Text style={[s.price, s.proPrice]}>$9</Text>
            <Text style={s.pricePer}>/month</Text>
          </View>
          <Text style={s.planDesc}>For power users who want full control</Text>

          <View style={s.divider} />

          {PRO_FEATURES.map(f => (
            <View key={f} style={s.featureRow}>
              <Text style={s.check}>✓</Text>
              <Text style={s.featureText}>{f}</Text>
            </View>
          ))}

          <LinearGradient colors={[colors.primary, colors.cyan]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.proBtn}>
            <TouchableOpacity style={s.proBtnInner} onPress={handleUpgrade} disabled={loading}>
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.proBtnText}>⚡  Upgrade to Pro — $9/mo</Text>
              }
            </TouchableOpacity>
          </LinearGradient>
        </View>

        <Text style={s.footer}>14-day money-back guarantee · Cancel anytime</Text>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: colors.bg },
  scroll:     { padding: 20 },
  back:       { paddingVertical: 8, marginBottom: 16 },
  backText:   { fontFamily: "Inter_500Medium", fontSize: 14, color: colors.text3 },
  title:      { fontFamily: "Poppins_900Black", fontSize: 28, color: colors.text, marginBottom: 8 },
  sub:        { fontFamily: "Inter_400Regular", fontSize: 15, color: colors.text3, marginBottom: 28 },

  card:       { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border2, borderRadius: 24, padding: 28, marginBottom: 20 },
  proCard:    { borderColor: "rgba(124,58,237,0.5)" },
  badge:      { alignSelf: "flex-start", borderRadius: 100, paddingHorizontal: 14, paddingVertical: 5, marginBottom: 16 },
  badgeText:  { fontFamily: "Inter_700Bold", fontSize: 11, color: "#fff", letterSpacing: 1 },

  planLabel:  { fontFamily: "Inter_600SemiBold", fontSize: 12, color: colors.text4, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 },
  priceRow:   { flexDirection: "row", alignItems: "flex-end", gap: 4, marginBottom: 4 },
  price:      { fontFamily: "Poppins_900Black", fontSize: 48, color: colors.text, lineHeight: 52 },
  proPrice:   { color: colors.primaryLight },
  pricePer:   { fontFamily: "Inter_400Regular", fontSize: 16, color: colors.text3, marginBottom: 8 },
  planDesc:   { fontFamily: "Inter_400Regular", fontSize: 14, color: colors.text3, marginBottom: 4 },

  divider:    { height: 1, backgroundColor: colors.border2, marginVertical: 20 },

  featureRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 12 },
  check:      { fontFamily: "Inter_700Bold", fontSize: 14, color: colors.success, marginTop: 1 },
  featureText:{ fontFamily: "Inter_400Regular", fontSize: 14, color: colors.text2, flex: 1 },

  freeBtn:    { borderWidth: 1, borderColor: colors.border2, borderRadius: 12, paddingVertical: 14, alignItems: "center", marginTop: 8 },
  freeBtnText:{ fontFamily: "Inter_700Bold", fontSize: 15, color: colors.text2 },

  proBtn:     { borderRadius: 12, marginTop: 8 },
  proBtnInner:{ paddingVertical: 15, alignItems: "center" },
  proBtnText: { fontFamily: "Inter_700Bold", fontSize: 15, color: "#fff" },

  footer:     { fontFamily: "Inter_400Regular", fontSize: 13, color: colors.text4, textAlign: "center", marginBottom: 32 },
});
