import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../theme";

const { width } = Dimensions.get("window");

const FEATURES = [
  { icon: "📋", title: "Track Everything",    desc: "Add all subscriptions in seconds — streaming, SaaS, fitness, all in one place." },
  { icon: "📊", title: "Spending Analytics",  desc: "See your true monthly and yearly spend, broken down by category." },
  { icon: "🔔", title: "Renewal Alerts",      desc: "Know what's due in the next 30 days. No more surprise charges." },
  { icon: "✂️", title: "Spot the Waste",      desc: "Identify subscriptions you forgot about and cancel with confidence." },
  { icon: "📁", title: "Organize by Category",desc: "Group by Entertainment, Productivity, Health, Finance, and more." },
  { icon: "🔒", title: "Private & Secure",    desc: "Your data stays yours. Encrypted storage, no ads, no data selling." },
];

const STATS = [
  { value: "$273",  label: "avg. monthly spend on subscriptions" },
  { value: "12+",   label: "subscriptions the average person has" },
  { value: "$89",   label: "wasted monthly on forgotten subs"     },
];

const MARKET = [
  { value: "$1.8T", label: "Global subscription market",        color: colors.primary },
  { value: "4.2B",  label: "Digital subscription users",        color: colors.cyan    },
  { value: "47%",   label: "Consumers who overpay monthly",     color: colors.success },
  { value: "$89",   label: "Average monthly waste per user",    color: colors.warning },
];

const STACK_COLS = [
  { layer: "Frontend",       color: colors.cyan,    items: ["React Native", "Expo SDK 51", "React Navigation"] },
  { layer: "Backend",        color: colors.primary, items: ["FastAPI (Python)", "SQLAlchemy ORM", "JWT Auth"] },
  { layer: "Database",       color: colors.success, items: ["PostgreSQL 15", "Indexed queries", "JSON columns"] },
  { layer: "Infrastructure", color: colors.warning, items: ["Docker Compose", "Nginx (web)", "Razorpay"] },
];

export default function LandingScreen({ navigation }) {
  return (
    <SafeAreaView style={s.safe}>
      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>

        {/* NAV */}
        <View style={s.nav}>
          <View style={s.logo}>
            <Text style={s.logoIcon}>💳</Text>
            <Text style={s.logoText}>SubTrack</Text>
          </View>
          <TouchableOpacity style={s.loginBtn} onPress={() => navigation.navigate("Auth", { mode: "login" })}>
            <Text style={s.loginBtnText}>Log In</Text>
          </TouchableOpacity>
        </View>

        {/* HERO */}
        <View style={s.hero}>
          <View style={s.heroBadge}>
            <Text style={s.heroBadgeText}>💡 The average person wastes $89/month on forgotten subscriptions</Text>
          </View>

          <Text style={s.heroTitle}>
            Stop Losing Money to{" "}
            <Text style={s.heroGrad}>Forgotten Subscriptions</Text>
          </Text>

          <Text style={s.heroSub}>
            Track every subscription in one place. See your true monthly spend, catch renewals before they hit.
          </Text>

          <LinearGradient colors={[colors.primary, colors.cyan]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.heroBtn}>
            <TouchableOpacity onPress={() => navigation.navigate("Auth", { mode: "signup" })} style={s.heroBtnInner}>
              <Text style={s.heroBtnText}>Start Tracking Free →</Text>
            </TouchableOpacity>
          </LinearGradient>

          <TouchableOpacity onPress={() => navigation.navigate("Pricing")} style={s.heroSecondBtn}>
            <Text style={s.heroSecondBtnText}>See Pricing</Text>
          </TouchableOpacity>

          <Text style={s.heroCaveat}>Free forever • No credit card required</Text>
        </View>

        {/* STATS */}
        <View style={s.statsRow}>
          {STATS.map((s2, i) => (
            <View key={i} style={s.statCard}>
              <Text style={s.statValue}>{s2.value}</Text>
              <Text style={s.statLabel}>{s2.label}</Text>
            </View>
          ))}
        </View>

        {/* FEATURES */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Everything you need to take control</Text>
          <Text style={s.sectionSub}>Simple, powerful tools to protect your budget.</Text>
          {FEATURES.map((f, i) => (
            <View key={i} style={s.featureCard}>
              <Text style={s.featureIcon}>{f.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.featureTitle}>{f.title}</Text>
                <Text style={s.featureDesc}>{f.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* TECH STACK */}
        <View style={[s.section, { backgroundColor: colors.bg2 }]}>
          <Text style={s.sectionTitle}>Built to be fast, reliable, and secure</Text>
          <Text style={s.sectionSub}>Production-grade stack. No vendor lock-in.</Text>
          {STACK_COLS.map((col) => (
            <View key={col.layer} style={[s.stackCard, { borderColor: col.color + "33" }]}>
              <Text style={[s.stackLayer, { color: col.color }]}>{col.layer}</Text>
              {col.items.map(item => (
                <View key={item} style={s.stackRow}>
                  <Text style={s.stackDot}>•</Text>
                  <Text style={s.stackItem}>{item}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>

        {/* MARKET STRATEGY */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>A massive, underserved market</Text>
          <Text style={s.sectionSub}>$1.8 trillion globally in subscriptions. Most people have no idea what they're paying.</Text>

          <View style={s.marketGrid}>
            {MARKET.map((m, i) => (
              <View key={i} style={[s.marketCard, { borderColor: m.color + "33" }]}>
                <Text style={[s.marketValue, { color: m.color }]}>{m.value}</Text>
                <Text style={s.marketLabel}>{m.label}</Text>
              </View>
            ))}
          </View>

          <View style={s.strategyCard}>
            <Text style={s.strategyTitle}>🎯  Target Audience</Text>
            {["Remote workers juggling 10+ SaaS tools", "Households with shared streaming accounts", "Freelancers tracking business vs personal subs", "Finance-conscious millennials and Gen Z"].map((p, i) => (
              <Text key={i} style={s.strategyPoint}>→  {p}</Text>
            ))}
          </View>

          <View style={s.strategyCard}>
            <Text style={[s.strategyTitle, { color: colors.cyan }]}>🚀  Go-to-Market</Text>
            {["Free tier drives viral word-of-mouth", "SEO content: 'best subscription tracker'", "Reddit / HN launch for tech early adopters", "Personal finance YouTube & newsletter placements"].map((p, i) => (
              <Text key={i} style={s.strategyPoint}>→  {p}</Text>
            ))}
          </View>

          <View style={s.strategyCard}>
            <Text style={[s.strategyTitle, { color: colors.success }]}>💰  Revenue Model</Text>
            {["Free: up to 10 subs — builds trust & habit", "Pro ($9/mo): unlimited + full analytics", "Annual plan discount drives LTV", "B2B teams plan (future): shared dashboards"].map((p, i) => (
              <Text key={i} style={s.strategyPoint}>→  {p}</Text>
            ))}
          </View>

        </View>

        {/* COMPETITOR COMPARISON TABLE */}
        <View style={[s.section, { backgroundColor: colors.bg2 }]}>
          <Text style={s.sectionTitle}>Why SubTrack wins</Text>
          <Text style={s.sectionSub}>We built the tool we wished existed — focused, honest, and actually useful.</Text>

          {/* Table header */}
          <View style={s.tableWrap}>
            <View style={s.tableHead}>
              <Text style={[s.thCell, s.thFeature]}>Feature</Text>
              <Text style={[s.thCell, s.thSubTrack]}>SubTrack ✓</Text>
              <Text style={s.thCell}>Bobby</Text>
              <Text style={s.thCell}>Mint/YNAB</Text>
              <Text style={s.thCell}>Spreadsheet</Text>
            </View>

            {[
              { feature: "No bank linking",     st: true,  bobby: true,  mint: false, sheet: true  },
              { feature: "Mobile app",          st: true,  bobby: true,  mint: true,  sheet: false },
              { feature: "Waste detection",     st: true,  bobby: false, mint: false, sheet: false },
              { feature: "Cancel direct links", st: true,  bobby: false, mint: false, sheet: false },
              { feature: "Service templates",   st: true,  bobby: true,  mint: false, sheet: false },
              { feature: "Free tier (10 subs)", st: true,  bobby: false, mint: true,  sheet: true  },
              { feature: "No ads / data selling",st: true, bobby: true,  mint: false, sheet: true  },
              { feature: "Open source backend", st: true,  bobby: false, mint: false, sheet: false },
              { feature: "Savings calculator",  st: true,  bobby: false, mint: true,  sheet: false },
              { feature: "Pro price",           st: "$9",  bobby: "$19", mint: "$15", sheet: "$0"  },
            ].map((row, i) => (
              <View key={i} style={[s.tableRow, i % 2 === 0 ? s.tableRowAlt : {}]}>
                <Text style={[s.tdCell, s.tdFeature]} numberOfLines={1}>{row.feature}</Text>
                <Text style={[s.tdCell, s.tdSubTrack]}>{typeof row.st === "boolean" ? (row.st ? "✅" : "❌") : row.st}</Text>
                <Text style={s.tdCell}>{typeof row.bobby === "boolean" ? (row.bobby ? "✅" : "❌") : row.bobby}</Text>
                <Text style={s.tdCell}>{typeof row.mint === "boolean" ? (row.mint ? "✅" : "❌") : row.mint}</Text>
                <Text style={s.tdCell}>{typeof row.sheet === "boolean" ? (row.sheet ? "✅" : "❌") : row.sheet}</Text>
              </View>
            ))}
          </View>

          <Text style={s.tableNote}>
            * Bobby is closest competitor. SubTrack adds waste detection + cancel links that no other tracker has.
          </Text>
        </View>

        {/* CTA */}
        <View style={s.cta}>
          <Text style={s.ctaIcon}>💳</Text>
          <Text style={s.ctaTitle}>Start saving money today</Text>
          <Text style={s.ctaSub}>Free forever for up to 10 subscriptions.</Text>
          <LinearGradient colors={[colors.primary, colors.cyan]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.ctaBtn}>
            <TouchableOpacity onPress={() => navigation.navigate("Auth", { mode: "signup" })} style={s.heroBtnInner}>
              <Text style={s.heroBtnText}>Get Started — It's Free →</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* FOOTER */}
        <View style={s.footer}>
          <Text style={s.footerText}>© 2025 SubTrack. All rights reserved.</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: colors.bg },
  scroll:          { flex: 1 },

  nav:             { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, paddingBottom: 12 },
  logo:            { flexDirection: "row", alignItems: "center", gap: 8 },
  logoIcon:        { fontSize: 22 },
  logoText:        { fontFamily: "Poppins_800ExtraBold", fontSize: 20, color: colors.primaryLight },
  loginBtn:        { borderWidth: 1, borderColor: colors.border2, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 },
  loginBtnText:    { fontFamily: "Inter_600SemiBold", fontSize: 14, color: colors.text2 },

  hero:            { padding: 24, paddingTop: 16, alignItems: "center" },
  heroBadge:       { backgroundColor: "rgba(124,58,237,0.15)", borderWidth: 1, borderColor: "rgba(124,58,237,0.3)", borderRadius: 100, paddingHorizontal: 14, paddingVertical: 6, marginBottom: 24 },
  heroBadgeText:   { fontFamily: "Inter_600SemiBold", fontSize: 12, color: colors.primaryLight, textAlign: "center" },
  heroTitle:       { fontFamily: "Poppins_900Black", fontSize: 32, color: colors.text, textAlign: "center", lineHeight: 40, marginBottom: 16 },
  heroGrad:        { color: colors.primaryLight },
  heroSub:         { fontFamily: "Inter_400Regular", fontSize: 16, color: colors.text2, textAlign: "center", lineHeight: 24, marginBottom: 32 },
  heroBtn:         { borderRadius: 14, width: "100%", marginBottom: 12 },
  heroBtnInner:    { paddingVertical: 16, alignItems: "center" },
  heroBtnText:     { fontFamily: "Inter_700Bold", fontSize: 16, color: "#fff" },
  heroSecondBtn:   { borderWidth: 1, borderColor: colors.border2, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32, marginBottom: 16, width: "100%", alignItems: "center" },
  heroSecondBtnText:{ fontFamily: "Inter_600SemiBold", fontSize: 16, color: colors.text2 },
  heroCaveat:      { fontFamily: "Inter_400Regular", fontSize: 13, color: colors.text4 },

  statsRow:        { flexDirection: "row", flexWrap: "wrap", padding: 16, gap: 12, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.border2, backgroundColor: colors.bg2 },
  statCard:        { flex: 1, minWidth: 100, alignItems: "center", padding: 12 },
  statValue:       { fontFamily: "Poppins_900Black", fontSize: 32, color: colors.primaryLight },
  statLabel:       { fontFamily: "Inter_400Regular", fontSize: 12, color: colors.text3, textAlign: "center", marginTop: 4 },

  section:         { padding: 24 },
  sectionTitle:    { fontFamily: "Poppins_800ExtraBold", fontSize: 24, color: colors.text, marginBottom: 8 },
  sectionSub:      { fontFamily: "Inter_400Regular", fontSize: 15, color: colors.text3, marginBottom: 24, lineHeight: 22 },

  featureCard:     { flexDirection: "row", gap: 16, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border2, borderRadius: 16, padding: 18, marginBottom: 12, alignItems: "flex-start" },
  featureIcon:     { fontSize: 28, marginTop: 2 },
  featureTitle:    { fontFamily: "Inter_700Bold", fontSize: 16, color: colors.text, marginBottom: 4 },
  featureDesc:     { fontFamily: "Inter_400Regular", fontSize: 14, color: colors.text3, lineHeight: 20 },

  stackCard:       { backgroundColor: colors.card, borderWidth: 1, borderRadius: 14, padding: 18, marginBottom: 12 },
  stackLayer:      { fontFamily: "Inter_700Bold", fontSize: 12, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 },
  stackRow:        { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  stackDot:        { color: colors.text4, fontSize: 14 },
  stackItem:       { fontFamily: "Inter_500Medium", fontSize: 14, color: colors.text2 },

  marketGrid:      { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 20 },
  marketCard:      { flex: 1, minWidth: "45%", backgroundColor: colors.card, borderWidth: 1, borderRadius: 14, padding: 16, alignItems: "center" },
  marketValue:     { fontFamily: "Poppins_900Black", fontSize: 28, lineHeight: 34 },
  marketLabel:     { fontFamily: "Inter_400Regular", fontSize: 12, color: colors.text3, textAlign: "center", marginTop: 6, lineHeight: 16 },

  strategyCard:    { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border2, borderRadius: 16, padding: 20, marginBottom: 12 },
  strategyTitle:   { fontFamily: "Inter_700Bold", fontSize: 16, color: colors.primaryLight, marginBottom: 14 },
  strategyPoint:   { fontFamily: "Inter_400Regular", fontSize: 14, color: colors.text2, lineHeight: 22, marginBottom: 6 },
  compRow:         { marginBottom: 10 },
  compLabel:       { fontFamily: "Inter_700Bold", fontSize: 13, color: colors.primaryLight, marginBottom: 3 },
  compNote:        { fontFamily: "Inter_400Regular", fontSize: 13, color: colors.text3, lineHeight: 18 },

  tableWrap:       { borderWidth: 1, borderColor: colors.border2, borderRadius: 14, overflow: "hidden", marginBottom: 12 },
  tableHead:       { flexDirection: "row", backgroundColor: "rgba(124,58,237,0.15)", paddingVertical: 10 },
  thCell:          { flex: 1, fontFamily: "Inter_700Bold", fontSize: 10, color: colors.text3, textAlign: "center", textTransform: "uppercase", letterSpacing: 0.3 },
  thFeature:       { flex: 2, textAlign: "left", paddingLeft: 12 },
  thSubTrack:      { color: colors.primaryLight },
  tableRow:        { flexDirection: "row", paddingVertical: 10, alignItems: "center" },
  tableRowAlt:     { backgroundColor: "rgba(255,255,255,0.02)" },
  tdCell:          { flex: 1, fontFamily: "Inter_400Regular", fontSize: 12, color: colors.text3, textAlign: "center" },
  tdFeature:       { flex: 2, fontFamily: "Inter_500Medium", fontSize: 12, color: colors.text2, textAlign: "left", paddingLeft: 12 },
  tdSubTrack:      { fontFamily: "Inter_700Bold", color: colors.success },
  tableNote:       { fontFamily: "Inter_400Regular", fontSize: 12, color: colors.text4, lineHeight: 18, marginTop: 4 },

  cta:             { padding: 40, alignItems: "center", backgroundColor: colors.bg2 },
  ctaIcon:         { fontSize: 48, marginBottom: 12 },
  ctaTitle:        { fontFamily: "Poppins_900Black", fontSize: 28, color: colors.text, textAlign: "center", marginBottom: 8 },
  ctaSub:          { fontFamily: "Inter_400Regular", fontSize: 16, color: colors.text3, textAlign: "center", marginBottom: 28 },
  ctaBtn:          { borderRadius: 14, width: "100%" },

  footer:          { padding: 24, alignItems: "center", borderTopWidth: 1, borderColor: colors.border2 },
  footerText:      { fontFamily: "Inter_400Regular", fontSize: 13, color: colors.text4 },
});
