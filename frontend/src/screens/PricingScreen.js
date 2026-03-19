import { ScrollView, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Platform } from "react-native";
import { useState } from "react";
import * as WebBrowser from "expo-web-browser";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../theme";
import { api, insforge } from "../api";
import { useTheme } from "../ThemeContext";
import StaggerReveal from "../components/StaggerReveal";
import InteractiveButton from "../components/InteractiveButton";
import BrandShapes from "../components/BrandShapes";

const GENIN_FEATURES = [
  "Track up to 3 subscriptions",
  "Renewal timeline",
  "Core analytics",
  "Category organization",
];

const CHUNIN_FEATURES = [
  "Unlimited subscriptions",
  "Advanced spend insights",
  "Priority renewal reminders",
  "Waste detection & savings view",
  "Most expensive service tracking",
  "Shared subscription split-cost",
  "Billing calendar view",
  "Priority support",
];

const JONIN_FEATURES = [
  "Everything in Chunin",
  "Boss Battle gamification",
  "XP & level system",
  "Exclusive achievement badges",
  "Mailbox discovery (email scan)",
  "Early access to new features",
  "CSV export",
  "Dedicated support",
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
  const [loadingPlan, setLoadingPlan] = useState(null);
  const { theme } = useTheme();

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
        currency: order.currency || "USD",
        name: "SubTrack",
        description: "SubTrack Pro — Unlimited subscriptions",
        order_id: order.razorpay_order_id,
        image: "https://i.imgur.com/3g7nmJC.png",
        prefill: { email: order.email || "" },
        theme: { color: theme.primary },
        handler: (response) => resolve(response),
        modal: { ondismiss: () => reject({ code: "PAYMENT_CANCELLED" }) },
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

  const directUpgrade = async (planType) => {
    setLoadingPlan(planType);
    setLoading(true);
    try {
      await api.upgradeToPro(planType);
      Alert.alert("Welcome to Pro! 🎉", "Your plan is now active. Enjoy unlimited tracking!", [
        { text: "Go to Dashboard", onPress: () => navigation.navigate("Dashboard") },
      ]);
    } catch (err) {
      Alert.alert("Upgrade Failed", err?.message || "Could not activate plan. Please try again.");
    } finally {
      setLoading(false);
      setLoadingPlan(null);
    }
  };

  const handleUpgrade = async (planType = "pro", amount = 900) => {
    const { data: userData, error: sessionError } = await insforge.auth.getCurrentUser();
    if (sessionError || !userData?.user?.id) {
      navigation.navigate("Auth", { mode: "signup" });
      return;
    }

    setLoadingPlan(planType);
    setLoading(true);

    let order = null;
    try {
      order = await api.createOrder({ amount, currency: "USD", plan_type: planType });
    } catch {
      // Payment gateway not configured — offer direct upgrade
      setLoading(false);
      setLoadingPlan(null);
      Alert.alert(
        "Activate Plan",
        "Complete your upgrade to unlock all features.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Activate Now", onPress: () => directUpgrade(planType) },
        ]
      );
      return;
    }

    try {
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
            currency: order.currency || "USD",
            key: order.key_id,
            amount: order.amount,
            name: "SubTrack",
            order_id: order.razorpay_order_id,
            prefill: { email: order.email || "" },
            theme: { color: theme.primary },
          });
        } else {
          if (isHttpUrl(WEB_UPGRADE_URL)) {
            Alert.alert("Continue on web", "Native checkout is unavailable in this build. We will open secure web checkout.");
            await WebBrowser.openBrowserAsync(WEB_UPGRADE_URL);
            Alert.alert("Finish in app", "Once payment is complete on web, come back and refresh the app to activate Pro.");
            return;
          }
          // Fallback: direct upgrade
          await directUpgrade(planType);
          return;
        }
      }

      await verifyAndActivatePlan(paymentData, order?.razorpay_order_id);
      Alert.alert("Welcome to Pro! 🎉", "Your plan is now active.", [
        { text: "Go to Dashboard", onPress: () => navigation.navigate("Dashboard") },
      ]);
    } catch (err) {
      if (err?.code !== "PAYMENT_CANCELLED") {
        Alert.alert("Payment failed", err?.message || "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
      setLoadingPlan(null);
    }
  };

  const FeatureList = ({ items, dark }) => (
    <View style={s.featureList}>
      {items.map((item) => (
        <View key={item} style={s.featureRow}>
          <Text style={dark ? s.checkDark : s.check}>✓</Text>
          <Text style={[s.featureText, dark && s.featureTextDark]}>{item}</Text>
        </View>
      ))}
    </View>
  );

  const isLoadingPlan = (plan) => loading && loadingPlan === plan;

  return (
    <SafeAreaView style={s.safe}>
      <BrandShapes variant="pricing" style={s.bgShapes} />
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.topRow}>
          <TouchableOpacity style={s.back} onPress={() => navigation.goBack()}>
            <Text style={s.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={s.topPill}>No hidden fees</Text>
        </View>

        <Text style={s.title}>Choose your{"\n"}ninja rank</Text>
        <Text style={s.sub}>Start as a Genin. Rise through the ranks as you master your finances.</Text>

        {/* Genin — Free */}
        <StaggerReveal delay={80} profile="snappy">
          <View style={s.card}>
            <View style={s.planBadge}><Text style={s.planBadgeText}>GENIN</Text></View>
            <View style={s.priceRow}>
              <Text style={s.price}>₹0</Text>
              <Text style={s.per}>/month</Text>
            </View>
            <Text style={s.desc}>Begin your journey — track your most important subscriptions for free.</Text>
            <FeatureList items={GENIN_FEATURES} />
            <InteractiveButton label="Start as Genin" variant="ghost" onPress={() => navigation.navigate("Auth", { mode: "signup" })} />
          </View>
        </StaggerReveal>

        {/* Chunin — Pro */}
        <StaggerReveal delay={150} profile="smooth">
          <LinearGradient colors={theme.proGradient} style={s.proCard}>
            <View style={s.recommendedBadge}>
              <Text style={s.recommendedText}>Most Popular</Text>
            </View>
            <View style={s.planBadgeWhite}><Text style={s.planBadgeTextWhite}>CHUNIN</Text></View>
            <View style={s.priceRow}>
              <Text style={s.pricePro}>₹99</Text>
              <Text style={s.perPro}>/month</Text>
            </View>
            <Text style={s.descPro}>Unlimited tracking and deep insights — for the dedicated subscription strategist.</Text>
            <FeatureList items={CHUNIN_FEATURES} dark />
            {isLoadingPlan("pro") ? (
              <View style={s.proBtnLoading}><ActivityIndicator color="#fff" /></View>
            ) : (
              <TouchableOpacity
                style={s.proBtn}
                onPress={() => handleUpgrade("pro", 9900)}
                disabled={loading}
              >
                <Text style={s.proBtnText}>Become Chunin →</Text>
              </TouchableOpacity>
            )}
          </LinearGradient>
        </StaggerReveal>

        {/* Jonin — Elite */}
        <StaggerReveal delay={220} profile="smooth">
          <View style={[s.card, s.joninCard]}>
            <View style={s.joninRow}>
              <View style={[s.planBadge, { backgroundColor: "rgba(236,72,153,0.12)" }]}>
                <Text style={[s.planBadgeText, { color: "#DB2777" }]}>JONIN</Text>
              </View>
              <View style={s.eliteBadge}>
                <Text style={s.eliteText}>Elite</Text>
              </View>
            </View>
            <View style={s.priceRow}>
              <Text style={s.price}>₹199</Text>
              <Text style={s.per}>/month</Text>
            </View>
            <Text style={s.desc}>The full arsenal — gamification, boss battles, mailbox discovery, and elite support.</Text>
            <FeatureList items={JONIN_FEATURES} />
            {isLoadingPlan("jonin") ? (
              <View style={[s.ghostBtnLoading]}><ActivityIndicator color={colors.text3} /></View>
            ) : (
              <InteractiveButton
                label="Ascend to Jonin →"
                variant="ghost"
                onPress={() => handleUpgrade("jonin", 19900)}
                disabled={loading}
              />
            )}
          </View>
        </StaggerReveal>

        <Text style={s.footer}>Cancel anytime · Secure checkout via Razorpay</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  bgShapes: { opacity: 0.62 },
  scroll: { padding: 20, paddingBottom: 50 },

  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  back: {
    borderWidth: 1, borderColor: colors.border2, borderRadius: 999,
    paddingHorizontal: 13, paddingVertical: 8,
    backgroundColor: "rgba(255,255,255,0.64)",
  },
  backText: { fontFamily: "Inter_600SemiBold", color: colors.text2, fontSize: 12 },
  topPill: { fontFamily: "Inter_600SemiBold", color: colors.primary, fontSize: 11, textTransform: "uppercase", letterSpacing: 1 },

  title: { fontFamily: "Poppins_800ExtraBold", fontSize: 28, color: colors.text, lineHeight: 34, marginBottom: 8 },
  sub: { fontFamily: "Inter_400Regular", color: colors.text3, fontSize: 15, lineHeight: 22, marginBottom: 20 },

  card: {
    borderWidth: 1, borderColor: colors.border2, borderRadius: 22,
    backgroundColor: colors.card, padding: 20, marginBottom: 14,
  },
  joninCard: { borderColor: "rgba(236,72,153,0.25)", backgroundColor: "#fdf4ff" },

  joninRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 0 },
  eliteBadge: {
    borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4,
    backgroundColor: "rgba(236,72,153,0.12)", borderWidth: 1, borderColor: "rgba(236,72,153,0.3)",
  },
  eliteText: { fontFamily: "Inter_700Bold", color: "#DB2777", fontSize: 11 },

  planBadge: {
    alignSelf: "flex-start", borderRadius: 999,
    paddingHorizontal: 10, paddingVertical: 4,
    backgroundColor: colors.primaryBg, marginBottom: 10,
  },
  planBadgeText: { fontFamily: "Inter_700Bold", color: colors.primary, fontSize: 11, letterSpacing: 1 },
  planBadgeWhite: {
    alignSelf: "flex-start", borderRadius: 999,
    paddingHorizontal: 10, paddingVertical: 4,
    backgroundColor: "rgba(255,255,255,0.2)", marginBottom: 10,
  },
  planBadgeTextWhite: { fontFamily: "Inter_700Bold", color: "rgba(255,255,255,0.9)", fontSize: 11, letterSpacing: 1 },

  priceRow: { flexDirection: "row", alignItems: "flex-end", gap: 2, marginBottom: 8 },
  price: { fontFamily: "Poppins_900Black", color: colors.text, fontSize: 42, lineHeight: 46 },
  per: { fontFamily: "Inter_500Medium", color: colors.text3, fontSize: 14, marginBottom: 7 },
  desc: { fontFamily: "Inter_400Regular", color: colors.text3, fontSize: 14, lineHeight: 20, marginBottom: 14 },

  featureList: { gap: 9, marginBottom: 18 },
  featureRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  check: { fontFamily: "Inter_700Bold", color: colors.primary, fontSize: 14, lineHeight: 20 },
  checkDark: { fontFamily: "Inter_700Bold", color: "rgba(255,255,255,0.8)", fontSize: 14, lineHeight: 20 },
  featureText: { fontFamily: "Inter_500Medium", color: colors.text2, fontSize: 14, flex: 1, lineHeight: 20 },
  featureTextDark: { color: "rgba(255,255,255,0.9)" },

  proCard: { borderRadius: 22, padding: 20, marginBottom: 14 },
  recommendedBadge: {
    alignSelf: "flex-start", borderRadius: 999,
    paddingHorizontal: 10, paddingVertical: 4,
    backgroundColor: "rgba(255,255,255,0.15)", marginBottom: 8,
  },
  recommendedText: { fontFamily: "Inter_700Bold", color: "rgba(255,255,255,0.9)", fontSize: 11 },
  pricePro: { fontFamily: "Poppins_900Black", color: "#fff", fontSize: 42, lineHeight: 46 },
  perPro: { fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.7)", fontSize: 14, marginBottom: 7 },
  descPro: { fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.8)", fontSize: 14, lineHeight: 20, marginBottom: 14 },

  proBtn: {
    borderRadius: 14, paddingVertical: 14, alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.9)",
  },
  proBtnText: { fontFamily: "Inter_800ExtraBold", color: colors.text, fontSize: 15 },
  proBtnLoading: {
    borderRadius: 14, paddingVertical: 14, alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  ghostBtnLoading: {
    borderRadius: 12, paddingVertical: 13, alignItems: "center",
    borderWidth: 1, borderColor: colors.border2, backgroundColor: colors.bg3,
  },

  footer: {
    fontFamily: "Inter_500Medium", color: colors.text4,
    textAlign: "center", marginTop: 8, fontSize: 12, lineHeight: 18,
  },
});
