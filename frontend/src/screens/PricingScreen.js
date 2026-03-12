import { ScrollView, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../theme";

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
  const handleUpgrade = () => {
    // Navigate to Auth if not logged in, otherwise in-app purchase flow
    navigation.navigate("Auth", { mode: "signup" });
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
            <TouchableOpacity style={s.proBtnInner} onPress={handleUpgrade}>
              <Text style={s.proBtnText}>⚡  Upgrade to Pro</Text>
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
