import { ScrollView, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Platform, useRef, useEffect } from "react-native";
import { useState } from "react";
import * as WebBrowser from "expo-web-browser";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../theme";
import { api, insforge } from "../api";
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
  "Shared subscription split-cost",
  "Priority support",
];

const WEB_CHECKOUT_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";
const WEB_UPGRADE_URL = (process.env.EXPO_PUBLIC_WEB_UPGRADE_URL || "").trim();

function normalizePaymentPayload(paymentData, fallbackOrderId) {
  return {
    razorpay_order_id: paymentData?.razorpay_order_id || paymentData?.order_id || fallbackOrderId,
    razorpay_payment_id: paymentData?.razorpay_payment_id || paymentData?.payment_id,
    razorpay_signature: paymentData?.razorpay_signature || paymentData?.signature,
  };
}

function isVerificationSuccess(result) {
  return Boolean(
    result?.success ||
    result?.verified ||
    result?.payment_status === "success" ||
    result?.status === "success" ||
    result?.data?.success ||
    result?.data?.verified ||
    result?.data?.payment_status === "success"
  );
}

function isHttpUrl(value) {
  return /^https?:\/\//i.test(value || "");
}

export default function PricingScreen({ navigation }) {
  const [loading, setLoading] = useState(false);

  const ensureWebCheckoutScript = () => {
    return new Promise((resolve, reject) => {
      const win = globalThis.window;
      const existing = win.document.querySelector(`script[src="${WEB_CHECKOUT_SCRIPT}"]`);
      if (existing) {
        if (win.Razorpay) return resolve();
        existing.addEventListener("load", () => resolve());
        existing.addEventListener("error", () => reject(new Error("Could not load checkout script.")));
        return;
      }
      const script = win.document.createElement("script");
      script.src = WEB_CHECKOUT_SCRIPT;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Could not load checkout script."));
      win.document.body.appendChild(script);
    });
  };

  const openWebCheckout = async (order) => {
    await ensureWebCheckoutScript();
    const win = globalThis.window;

    return new Promise((resolve, reject) => {
      const checkout = new win.Razorpay({
        key: order.key_id,
        amount: order.amount,
        currency: order.currency || "INR",
        name: "SubTrack",
        description: "SubTrack Pro — Unlimited subscriptions",
        order_id: order.razorpay_order_id,
        image: "https://i.imgur.com/3g7nmJC.png",
        prefill: { email: order.email || "" },
        theme: { color: colors.primary },
        handler: (response) => resolve(response),
        modal: {
          ondismiss: () => reject({ code: "PAYMENT_CANCELLED" }),
        },
      });

      checkout.on("payment.failed", (response) => {
        reject(new Error(response?.error?.description || "Payment failed. Please try again."));
      });

      checkout.open();
    });
  };

  const verifyAndActivatePlan = async (paymentData, orderId) => {
    const verificationPayload = normalizePaymentPayload(paymentData, orderId);
    if (!verificationPayload.razorpay_order_id || !verificationPayload.razorpay_payment_id || !verificationPayload.razorpay_signature) {
      throw new Error("Payment details were incomplete. Please contact support if payment was deducted.");
    }

    const verifyResult = await api.verifyPayment(verificationPayload);
    if (!isVerificationSuccess(verifyResult)) {
      throw new Error("Payment was initiated but verification is pending. Please refresh in a minute.");
    }
  };

  const handleUpgrade = async () => {
    const { data: userData, error: sessionError } = await insforge.auth.getCurrentUser();
    if (sessionError || !userData?.user?.id) {
      navigation.navigate("Auth", { mode: "signup" });
      return;
    }

    setLoading(true);
    try {
      const order = await api.createOrder({ amount: 900, currency: "INR", plan_type: "pro" });
      let paymentData = null;

      if (Platform.OS === "web") {
        paymentData = await openWebCheckout(order);
      } else {
        let RazorpayCheckout = null;
        try { RazorpayCheckout = require("react-native-razorpay").default; } catch {}

        if (RazorpayCheckout) {
          paymentData = await RazorpayCheckout.open({
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
        } else {
          if (isHttpUrl(WEB_UPGRADE_URL)) {
            Alert.alert(
              "Continue on web",
              "Native checkout is unavailable in this build. We will open secure web checkout. After payment, return to the app and refresh your plan status."
            );
            await WebBrowser.openBrowserAsync(WEB_UPGRADE_URL);
            Alert.alert(
              "Finish in app",
              "Once payment is complete on web, come back and refresh the app to activate Pro."
            );
            return;
          }

          Alert.alert(
            "Checkout unavailable",
            "Native Razorpay checkout is not available in this build. Use a native dev build with Razorpay enabled, or complete checkout on SubTrack web and then refresh this app."
          );
          return;
        }
      }

      await verifyAndActivatePlan(paymentData, order?.razorpay_order_id);

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
              <Text style={s.checkoutHint}>{Platform.OS === "web" ? "Secure web checkout opens in-browser." : "Secure checkout uses Razorpay."}</Text>
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
  bgShapes: { opacity: 0.62 },
  scroll: { padding: 20, paddingBottom: 40 },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  back: { borderWidth: 1, borderColor: colors.border2, borderRadius: 999, paddingHorizontal: 13, paddingVertical: 8, backgroundColor: "rgba(255,255,255,0.64)" },
  backText: { fontFamily: "Inter_600SemiBold", color: colors.text2, fontSize: 12 },
  topPill: { fontFamily: "Inter_600SemiBold", color: colors.primary, fontSize: 11, textTransform: "uppercase", letterSpacing: 1 },
  title: { fontFamily: "Poppins_800ExtraBold", fontSize: 28, color: colors.text, lineHeight: 34, marginBottom: 8 },
  sub: { fontFamily: "Inter_400Regular", color: colors.text3, fontSize: 15, lineHeight: 22, marginBottom: 24 },
  grid: { gap: 16 },
  card: { borderWidth: 1, borderColor: colors.border2, borderRadius: 22, backgroundColor: colors.card, padding: 20 },
  plan: { fontFamily: "Inter_700Bold", color: colors.text3, fontSize: 12, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 },
  priceRow: { flexDirection: "row", alignItems: "flex-end", gap: 2, marginBottom: 8 },
  price: { fontFamily: "Poppins_900Black", color: colors.text, fontSize: 40, lineHeight: 44 },
  per: { fontFamily: "Inter_500Medium", color: colors.text3, fontSize: 14, marginBottom: 6 },
  desc: { fontFamily: "Inter_400Regular", color: colors.text3, fontSize: 14, lineHeight: 20, marginBottom: 16 },
  featureList: { gap: 10, marginBottom: 20 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary },
  featureText: { fontFamily: "Inter_500Medium", color: colors.text2, fontSize: 14, flex: 1 },
  proCard: { borderRadius: 22, padding: 20 },
  badge: { fontFamily: "Inter_700Bold", color: "rgba(255,255,255,0.7)", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 },
  planPro: { fontFamily: "Inter_700Bold", color: "rgba(255,255,255,0.8)", fontSize: 12, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 },
  pricePro: { fontFamily: "Poppins_900Black", color: "#fff", fontSize: 40, lineHeight: 44 },
  perPro: { fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.7)", fontSize: 14, marginBottom: 6 },
  descPro: { fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.8)", fontSize: 14, lineHeight: 20, marginBottom: 16 },
  dotPro: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.7)" },
  featureTextPro: { fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.9)", fontSize: 14, flex: 1 },
  proBtnLoading: { borderRadius: 14, borderWidth: 1.5, borderColor: "rgba(255,255,255,0.5)", paddingVertical: 13, alignItems: "center" },
  proInteractiveText: { color: colors.primaryDark },
  checkoutHint: { fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.55)", fontSize: 12, textAlign: "center", marginTop: 10 },
  footer: { fontFamily: "Inter_500Medium", color: colors.text4, textAlign: "center", marginTop: 20, fontSize: 13 },
});
