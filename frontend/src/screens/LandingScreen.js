import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../theme";
import StaggerReveal from "../components/StaggerReveal";
import InteractiveButton from "../components/InteractiveButton";
import BrandShapes from "../components/BrandShapes";

const PILLARS = [
  {
    icon: "01",
    title: "One command center",
    desc: "Track streaming, SaaS, memberships, and recurring bills in one clean timeline.",
  },
  {
    icon: "02",
    title: "Spend intelligence",
    desc: "See monthly burn, yearly impact, and category spikes before they become habits.",
  },
  {
    icon: "03",
    title: "Zero-surprise renewals",
    desc: "Upcoming payment signals and reminders make every charge feel intentional.",
  },
];

const METRICS = [
  { value: "$273", label: "avg monthly sub spend" },
  { value: "12+", label: "subscriptions per user" },
  { value: "$89", label: "wasted each month" },
];

export default function LandingScreen({ navigation }) {
  return (
    <SafeAreaView style={s.safe}>
      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={["#fff8eb", "#f6f3ea", "#efe9da"]} style={s.heroWrap}>
          <BrandShapes variant="landing" />

          <View style={s.nav}>
            <View style={s.logoWrap}>
              <View style={s.logoMark}>
                <Text style={s.logoMarkText}>S</Text>
              </View>
              <Text style={s.logoText}>SubTrack</Text>
            </View>
            <TouchableOpacity style={s.navBtn} onPress={() => navigation.navigate("Auth", { mode: "login" })}>
              <Text style={s.navBtnText}>Log In</Text>
            </TouchableOpacity>
          </View>

          <StaggerReveal style={s.heroContent} delay={60} profile="gentle">
            <Text style={s.kicker}>Subscription clarity for modern teams and individuals</Text>
            <Text style={s.heroTitle}>
              Design your cashflow,
              <Text style={s.heroAccent}> stop silent subscription leaks</Text>
            </Text>
            <Text style={s.heroSub}>
              SubTrack transforms recurring charges into a visual control panel. Make smarter cancel, keep, and upgrade decisions in minutes.
            </Text>

            <View style={s.heroActions}>
              <InteractiveButton label="Start Free" onPress={() => navigation.navigate("Auth", { mode: "signup" })} />
              <InteractiveButton label="View Pricing" variant="ghost" onPress={() => navigation.navigate("Pricing")} />
            </View>

            <Text style={s.heroNote}>No credit card required • Free tier available forever</Text>
          </StaggerReveal>
        </LinearGradient>

        <StaggerReveal style={s.metricsRow} delay={130} profile="snappy">
          {METRICS.map((m) => (
            <View key={m.label} style={s.metricCard}>
              <Text style={s.metricValue}>{m.value}</Text>
              <Text style={s.metricLabel}>{m.label}</Text>
            </View>
          ))}
        </StaggerReveal>

        <StaggerReveal style={s.section} delay={190} profile="smooth">
          <Text style={s.sectionTitle}>Built like a product, not a spreadsheet</Text>
          <Text style={s.sectionSub}>A crisp workflow from first add to confident cancellation.</Text>

          {PILLARS.map((p) => (
            <View key={p.title} style={s.pillarCard}>
              <View style={s.pillarIndex}><Text style={s.pillarIndexText}>{p.icon}</Text></View>
              <View style={s.pillarBody}>
                <Text style={s.pillarTitle}>{p.title}</Text>
                <Text style={s.pillarDesc}>{p.desc}</Text>
              </View>
            </View>
          ))}
        </StaggerReveal>

        <StaggerReveal delay={250} profile="smooth">
          <LinearGradient colors={["#0f4b47", "#125e59"]} style={s.ctaWrap}>
          <Text style={s.ctaTitle}>Take back your recurring spend today</Text>
          <Text style={s.ctaSub}>Join SubTrack and turn hidden renewals into predictable, intentional spending.</Text>
          <InteractiveButton
            label="Create My Account"
            variant="ghost"
            onPress={() => navigation.navigate("Auth", { mode: "signup" })}
            style={s.ctaInteractive}
            textStyle={s.ctaInteractiveText}
          />
          </LinearGradient>
        </StaggerReveal>

        <View style={s.footer}>
          <Text style={s.footerText}>SubTrack • Spend better, not harder.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },

  heroWrap: { paddingHorizontal: 20, paddingBottom: 28, overflow: "hidden" },
  nav: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 8, paddingBottom: 18 },
  logoWrap: { flexDirection: "row", alignItems: "center" },
  logoMark: { width: 34, height: 34, borderRadius: 11, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", marginRight: 10 },
  logoMarkText: { fontFamily: "Poppins_800ExtraBold", color: "#fff", fontSize: 17 },
  logoText: { fontFamily: "Poppins_800ExtraBold", fontSize: 20, color: colors.text },
  navBtn: { borderWidth: 1, borderColor: colors.border2, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: "rgba(255,255,255,0.65)" },
  navBtnText: { fontFamily: "Inter_600SemiBold", color: colors.text2, fontSize: 13 },

  heroContent: { paddingVertical: 10 },
  kicker: { fontFamily: "Inter_600SemiBold", color: colors.cyan, textTransform: "uppercase", letterSpacing: 1, fontSize: 11, marginBottom: 10 },
  heroTitle: { fontFamily: "Poppins_900Black", color: colors.text, fontSize: 36, lineHeight: 44, marginBottom: 12 },
  heroAccent: { color: colors.primaryLight },
  heroSub: { fontFamily: "Inter_400Regular", color: colors.text2, fontSize: 16, lineHeight: 24, marginBottom: 24 },

  heroActions: { gap: 12 },
  heroNote: { marginTop: 12, fontFamily: "Inter_400Regular", fontSize: 12, color: colors.text3, textAlign: "center" },

  metricsRow: { flexDirection: "row", paddingHorizontal: 20, marginTop: 18, gap: 10 },
  metricCard: { flex: 1, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border2, borderRadius: 16, padding: 14 },
  metricValue: { fontFamily: "Poppins_900Black", color: colors.primary, fontSize: 28, lineHeight: 32 },
  metricLabel: { fontFamily: "Inter_500Medium", color: colors.text3, fontSize: 12, marginTop: 6 },

  section: { padding: 20, paddingTop: 28 },
  sectionTitle: { fontFamily: "Poppins_800ExtraBold", color: colors.text, fontSize: 26, lineHeight: 31 },
  sectionSub: { fontFamily: "Inter_400Regular", color: colors.text3, fontSize: 15, marginTop: 6, marginBottom: 16 },

  pillarCard: { backgroundColor: colors.card2, borderWidth: 1, borderColor: colors.border2, borderRadius: 18, padding: 16, flexDirection: "row", marginBottom: 10 },
  pillarIndex: { width: 38, height: 38, borderRadius: 11, backgroundColor: "rgba(18,94,89,0.12)", alignItems: "center", justifyContent: "center", marginRight: 12 },
  pillarIndexText: { fontFamily: "Inter_700Bold", color: colors.primary, fontSize: 13 },
  pillarBody: { flex: 1 },
  pillarTitle: { fontFamily: "Inter_700Bold", fontSize: 17, color: colors.text, marginBottom: 3 },
  pillarDesc: { fontFamily: "Inter_400Regular", fontSize: 14, color: colors.text2, lineHeight: 21 },

  ctaWrap: { margin: 20, borderRadius: 24, padding: 24 },
  ctaTitle: { fontFamily: "Poppins_800ExtraBold", fontSize: 27, color: "#f8fafc", lineHeight: 33, marginBottom: 8 },
  ctaSub: { fontFamily: "Inter_400Regular", fontSize: 15, color: "rgba(248,250,252,0.84)", lineHeight: 22, marginBottom: 18 },
  ctaInteractive: { marginTop: 2 },
  ctaInteractiveText: { color: colors.primaryDark },

  footer: { paddingHorizontal: 20, paddingBottom: 30, alignItems: "center" },
  footerText: { fontFamily: "Inter_500Medium", color: colors.text4, fontSize: 12 },
});
