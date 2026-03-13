import { ScrollView, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../theme";
import { api } from "../api";
import StaggerReveal from "../components/StaggerReveal";
import InteractiveButton from "../components/InteractiveButton";
import BrandShapes from "../components/BrandShapes";

const FREE_FEATURES = [
  "Up to 10 subscriptions",
  "Renewal timeline",
  "Core analytics",
  "Category organization",
  "CSV export",
];

const PRO_FEATURES = [
  "Unlimited subscriptions",
  "Advanced spend insights",
  "Priority renewal reminders",
  "Waste detection and savings view",
  "Most expensive service tracking",
  "Priority support",
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
    const token = await AsyncStorage.getItem("st_token");
    if (!token) {
      navigation.navigate("Auth", { mode: "signup" });
      return;
    }

    setLoading(true);
    try {
      const order = await api.createOrder({ amount: 900, currency: "INR", plan_type: "pro" });
      const RazorpayCheckout = loadCheckout();
      if (!RazorpayCheckout) {
        throw new Error("Native checkout is unavailable in this build. Use an Android/iOS dev build for payment testing.");
      }

      const paymentData = await RazorpayCheckout.open({
        description: "SubTrack Pro — Unlimited subscriptions",
        image: "https://i.imgur.com/3g7nmJC.png",
        currency: order.currency || "INR",
        key: order.key_id,
        amount: order.amount,
        name: "SubTrack",
        order_id: order.razorpay_order_id,
        prefill: { email: order.email || "" },
        theme: { color: colors.primary },
      });

      await api.verifyPayment({
        razorpay_order_id: paymentData.razorpay_order_id,
        razorpay_payment_id: paymentData.razorpay_payment_id,
        razorpay_signature: paymentData.razorpay_signature,
      });

      const me = await api.me();
      await AsyncStorage.setItem("st_user", JSON.stringify({
        id: me.user_id,
        email: me.email,
        name: me.full_name,
        plan: me.plan,
      }));

      Alert.alert("Welcome to Pro", "Your Pro subscription is active.", [{ text: "Go to Dashboard", onPress: () => navigation.navigate("Dashboard") }]);
    } catch (err) {
      if (err?.code !== "PAYMENT_CANCELLED") {
        Alert.alert("Payment failed", err?.message || "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const FeatureList = ({ items }) => (
    <View style={s.featureList}>
      {items.map((item) => (
        <View key={item} style={s.featureRow}>
          <View style={s.dot} />
          <Text style={s.featureText}>{item}</Text>
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={s.safe}>
      <BrandShapes variant="pricing" style={s.bgShapes} />
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.topRow}>
          <TouchableOpacity style={s.back} onPress={() => navigation.goBack()}>
            <Text style={s.backText}>Back</Text>
          </TouchableOpacity>
          <Text style={s.topPill}>No hidden fees</Text>
        </View>

        <Text style={s.title}>Simple pricing for better spending habits</Text>
        <Text style={s.sub}>Choose free to start. Move to Pro when your stack grows.</Text>

        <View style={s.grid}>
          <StaggerReveal delay={90} profile="snappy">
            <View style={s.card}>
            <Text style={s.plan}>Free</Text>
            <View style={s.priceRow}><Text style={s.price}>$0</Text><Text style={s.per}>/month</Text></View>
            <Text style={s.desc}>For individuals getting visibility into recurring spend.</Text>
            <FeatureList items={FREE_FEATURES} />
            <InteractiveButton label="Start Free" variant="ghost" onPress={() => navigation.navigate("Auth", { mode: "signup" })} />
            </View>
          </StaggerReveal>

          <StaggerReveal delay={170} profile="smooth">
            <LinearGradient colors={["#0f4b47", "#125e59"]} style={s.proCard}>
            <Text style={s.badge}>Recommended</Text>
            <Text style={s.planPro}>Pro</Text>
            <View style={s.priceRow}><Text style={s.pricePro}>$9</Text><Text style={s.perPro}>/month</Text></View>
            <Text style={s.descPro}>For power users who optimize every renewal decision.</Text>
            <View style={s.featureList}>
              {PRO_FEATURES.map((item) => (
                <View key={item} style={s.featureRow}>
                  <View style={s.dotPro} />
                  <Text style={s.featureTextPro}>{item}</Text>
                </View>
              ))}
            </View>
            {loading ? (
              <TouchableOpacity style={s.proBtnLoading} disabled>
                <ActivityIndicator color={colors.primaryDark} />
              </TouchableOpacity>
            ) : (
              <InteractiveButton label="Upgrade to Pro" variant="ghost" onPress={handleUpgrade} textStyle={s.proInteractiveText} />
            )}
            </LinearGradient>
          </StaggerReveal>
        </View>

        <Text style={s.footer}>Cancel anytime • 14-day money-back guarantee</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  bgShapes: { opacity: 0.72 },
  scroll: { padding: 20, paddingBottom: 34 },

  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  back: { borderWidth: 1, borderColor: colors.border2, borderRadius: 999, paddingHorizontal: 13, paddingVertical: 8, backgroundColor: "rgba(255,255,255,0.62)" },
  backText: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: colors.text2 },
  topPill: { fontFamily: "Inter_600SemiBold", fontSize: 11, color: colors.primary, textTransform: "uppercase", letterSpacing: 1 },

  title: { fontFamily: "Poppins_900Black", color: colors.text, fontSize: 33, lineHeight: 39, marginBottom: 8 },
  sub: { fontFamily: "Inter_400Regular", color: colors.text3, fontSize: 15, lineHeight: 22, marginBottom: 20 },

  grid: { gap: 14 },
  card: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border2, borderRadius: 22, padding: 20 },
  plan: { fontFamily: "Inter_700Bold", fontSize: 13, color: colors.text3, textTransform: "uppercase", letterSpacing: 1 },
  priceRow: { flexDirection: "row", alignItems: "flex-end", gap: 4, marginVertical: 6 },
  price: { fontFamily: "Poppins_900Black", color: colors.text, fontSize: 50, lineHeight: 52 },
  per: { fontFamily: "Inter_500Medium", color: colors.text3, fontSize: 15, marginBottom: 7 },
  desc: { fontFamily: "Inter_400Regular", color: colors.text3, fontSize: 14, lineHeight: 20, marginBottom: 8 },

  featureList: { marginTop: 8, marginBottom: 14 },
  featureRow: { flexDirection: "row", alignItems: "center", marginBottom: 9 },
  dot: { width: 7, height: 7, borderRadius: 7, backgroundColor: colors.primary, marginRight: 10 },
  featureText: { fontFamily: "Inter_500Medium", color: colors.text2, fontSize: 14, flex: 1 },

  proCard: { borderRadius: 22, padding: 20 },
  badge: { alignSelf: "flex-start", backgroundColor: "rgba(248,250,252,0.15)", borderWidth: 1, borderColor: "rgba(248,250,252,0.38)", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, fontFamily: "Inter_700Bold", color: "#f8fafc", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 },
  planPro: { fontFamily: "Inter_700Bold", fontSize: 13, color: "rgba(248,250,252,0.88)", textTransform: "uppercase", letterSpacing: 1 },
  pricePro: { fontFamily: "Poppins_900Black", color: "#f8fafc", fontSize: 50, lineHeight: 52 },
  perPro: { fontFamily: "Inter_500Medium", color: "rgba(248,250,252,0.78)", fontSize: 15, marginBottom: 7 },
  descPro: { fontFamily: "Inter_400Regular", color: "rgba(248,250,252,0.82)", fontSize: 14, lineHeight: 20, marginBottom: 8 },
  dotPro: { width: 7, height: 7, borderRadius: 7, backgroundColor: "#fde68a", marginRight: 10 },
  featureTextPro: { fontFamily: "Inter_500Medium", color: "#f8fafc", fontSize: 14, flex: 1 },
  proBtnLoading: { marginTop: 4, borderRadius: 12, backgroundColor: "#f8fafc", paddingVertical: 13, alignItems: "center" },
  proInteractiveText: { color: colors.primaryDark },

  footer: { marginTop: 16, textAlign: "center", fontFamily: "Inter_500Medium", color: colors.text4, fontSize: 12 },
});
