import { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, SafeAreaView
} from "react-native";
import { colors, categoryColors } from "../theme";
import api from "../api";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

export default function CalendarScreen({ navigation }) {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);

  useEffect(() => {
    loadSubs();
  }, []);

  const loadSubs = async () => {
    try {
      const data = await api.listSubs();
      setSubscriptions(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
    setSelectedDay(null);
  };

  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
    setSelectedDay(null);
  };

  const getSubsForDay = useCallback((day) => {
    return subscriptions.filter(sub => {
      if (!sub.next_billing_date) return false;
      const d = new Date(sub.next_billing_date);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth && d.getDate() === day;
    });
  }, [subscriptions, currentYear, currentMonth]);

  const monthTotal = subscriptions.reduce((sum, sub) => {
    if (!sub.next_billing_date) return sum;
    const d = new Date(sub.next_billing_date);
    if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
      return sum + (sub.amount || 0);
    }
    return sum;
  }, 0);

  const monthCount = subscriptions.filter(sub => {
    if (!sub.next_billing_date) return false;
    const d = new Date(sub.next_billing_date);
    return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
  }).length;

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  const calendarCells = [];
  for (let i = 0; i < firstDay; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d);

  const selectedSubs = selectedDay ? getSubsForDay(selectedDay) : [];

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <Text style={s.backBtnText}>← Back</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>Billing Calendar</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Summary */}
        <View style={s.summary}>
          <View style={s.summaryItem}>
            <Text style={s.summaryValue}>{monthCount}</Text>
            <Text style={s.summaryLabel}>due this month</Text>
          </View>
          <View style={s.summaryDivider} />
          <View style={s.summaryItem}>
            <Text style={s.summaryValue}>${monthTotal.toFixed(0)}</Text>
            <Text style={s.summaryLabel}>total charges</Text>
          </View>
        </View>

        {/* Month Nav */}
        <View style={s.monthNav}>
          <TouchableOpacity onPress={prevMonth} style={s.navArrow}>
            <Text style={s.navArrowText}>‹</Text>
          </TouchableOpacity>
          <Text style={s.monthTitle}>{MONTHS[currentMonth]} {currentYear}</Text>
          <TouchableOpacity onPress={nextMonth} style={s.navArrow}>
            <Text style={s.navArrowText}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Day headers */}
        <View style={s.dayHeaders}>
          {DAYS.map(d => (
            <Text key={d} style={s.dayHeader}>{d}</Text>
          ))}
        </View>

        {/* Calendar Grid */}
        <View style={s.grid}>
          {calendarCells.map((day, idx) => {
            const subs = day ? getSubsForDay(day) : [];
            const isToday = day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
            const isSelected = day === selectedDay;
            return (
              <TouchableOpacity
                key={idx}
                style={[s.cell, isSelected && s.cellSelected, isToday && s.cellToday]}
                onPress={() => day && setSelectedDay(day === selectedDay ? null : day)}
                disabled={!day}
              >
                {day ? (
                  <>
                    <Text style={[s.cellDay, isToday && s.cellDayToday, isSelected && s.cellDaySelected]}>
                      {day}
                    </Text>
                    <View style={s.dotsRow}>
                      {subs.slice(0, 3).map((sub, i) => (
                        <View
                          key={i}
                          style={[s.dot, { backgroundColor: categoryColors[sub.category] || colors.primary }]}
                        />
                      ))}
                    </View>
                  </>
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Selected Day Subscriptions */}
        {selectedDay && (
          <View style={s.selectedSection}>
            <Text style={s.selectedTitle}>
              {MONTHS[currentMonth]} {selectedDay} — {selectedSubs.length} subscription{selectedSubs.length !== 1 ? "s" : ""}
            </Text>
            {selectedSubs.length === 0 ? (
              <Text style={s.noSubs}>No subscriptions due this day</Text>
            ) : (
              selectedSubs.map(sub => (
                <View key={sub.id} style={s.subRow}>
                  <View style={[s.subDot, { backgroundColor: categoryColors[sub.category] || colors.primary }]} />
                  <View style={s.subInfo}>
                    <Text style={s.subName}>{sub.name}</Text>
                    <Text style={s.subCat}>{sub.category}</Text>
                  </View>
                  <Text style={s.subAmount}>${sub.amount?.toFixed(2)}</Text>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  backBtn: { padding: 4 },
  backBtnText: { fontFamily: "Inter_600SemiBold", color: colors.primary, fontSize: 15 },
  headerTitle: { fontFamily: "Poppins_800ExtraBold", fontSize: 20, color: colors.text },
  summary: { flexDirection: "row", marginHorizontal: 20, backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border2, padding: 16, marginBottom: 16 },
  summaryItem: { flex: 1, alignItems: "center" },
  summaryValue: { fontFamily: "Poppins_900Black", fontSize: 28, color: colors.primary },
  summaryLabel: { fontFamily: "Inter_400Regular", fontSize: 12, color: colors.text3, marginTop: 2 },
  summaryDivider: { width: 1, backgroundColor: colors.border2, marginVertical: 4 },
  monthNav: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, marginBottom: 12 },
  navArrow: { padding: 8 },
  navArrowText: { fontSize: 28, color: colors.primary, fontFamily: "Inter_700Bold" },
  monthTitle: { fontFamily: "Poppins_800ExtraBold", fontSize: 18, color: colors.text },
  dayHeaders: { flexDirection: "row", paddingHorizontal: 8, marginBottom: 4 },
  dayHeader: { flex: 1, textAlign: "center", fontFamily: "Inter_600SemiBold", fontSize: 11, color: colors.text3 },
  grid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 8, marginBottom: 16 },
  cell: { width: "14.28%", aspectRatio: 0.9, alignItems: "center", justifyContent: "flex-start", paddingTop: 6, borderRadius: 10 },
  cellSelected: { backgroundColor: colors.primaryBg },
  cellToday: { borderWidth: 1.5, borderColor: colors.primary },
  cellDay: { fontFamily: "Inter_500Medium", fontSize: 14, color: colors.text2 },
  cellDayToday: { color: colors.primary, fontFamily: "Inter_700Bold" },
  cellDaySelected: { color: colors.primary },
  dotsRow: { flexDirection: "row", gap: 2, marginTop: 2 },
  dot: { width: 5, height: 5, borderRadius: 3 },
  selectedSection: { marginHorizontal: 20, backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border2, padding: 16, marginBottom: 24 },
  selectedTitle: { fontFamily: "Inter_700Bold", fontSize: 15, color: colors.text, marginBottom: 12 },
  noSubs: { fontFamily: "Inter_400Regular", color: colors.text3, fontSize: 14 },
  subRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border2 },
  subDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  subInfo: { flex: 1 },
  subName: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: colors.text },
  subCat: { fontFamily: "Inter_400Regular", fontSize: 12, color: colors.text3, marginTop: 1 },
  subAmount: { fontFamily: "Inter_700Bold", fontSize: 15, color: colors.primary },
});
