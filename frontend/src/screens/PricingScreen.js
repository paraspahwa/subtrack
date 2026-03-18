import { ScrollView, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Platform } from "react-native";
import "tailwindcss/tailwind.css";
import { useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as WebBrowser from "expo-web-browser";
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
  // Accessibility: focus management
  const pricingHeaderRef = useRef(null);
  useEffect(() => {
    if (pricingHeaderRef.current) {
      pricingHeaderRef.current.focus();
    }
  }, []);

  const loadCheckout = () => {
    try {
      <SafeAreaView accessible={true} accessibilityLabel="Pricing screen" className="relative min-h-screen bg-white">
        <BrandShapes variant="pricing" style={{ position: "absolute", width: "100%", height: "100%" }} />
        <ScrollView className="flex flex-col gap-6 px-4 py-6" showsVerticalScrollIndicator={false} accessibilityRole="scrollbar">
          <View ref={pricingHeaderRef} accessible={true} accessibilityRole="header" accessibilityLabel="Pricing & Plans">
            <StaggerReveal delay={50} profile="snappy">
              <Text className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">Pricing & Plans</Text>
            </StaggerReveal>
            <StaggerReveal delay={80} profile="gentle">
              <Text className="text-2xl font-bold text-gray-900">Choose your plan</Text>
              <Text className="text-base text-gray-500">Upgrade for unlimited tracking and advanced analytics.</Text>
            </StaggerReveal>
          </View>
          {/* ...existing code... */}
        </ScrollView>
      </SafeAreaView>
      const existing = win.document.querySelector(`script[src="${WEB_CHECKOUT_SCRIPT}"]`);
      if (existing) {
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

    if (!win.Razorpay) {
      throw new Error("Web checkout did not initialize.");
    }
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
    // InsForge profile is updated by the razorpay-verify edge function.
    // No local cache write needed.
  };

  const handleUpgrade = async () => {
    const { data: sessionData, error: sessionError } = await insforge.auth.getCurrentSession();
    if (sessionError || !sessionData?.session?.user?.id) throw sessionError || new Error("No active session");
    const data = { user: sessionData.session.user };
    if (!data?.user) {
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
        const RazorpayCheckout = loadCheckout();
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






  // Removed StyleSheet styles in favor of Tailwind utility classes
});
