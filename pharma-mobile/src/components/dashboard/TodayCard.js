import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const TodayCard = ({ attendanceData, animatedValue }) => {
  const getTodayInfo = () => {
    const today = new Date();
    const weekdays = [
      "الأحد",
      "الإثنين",
      "الثلاثاء",
      "الأربعاء",
      "الخميس",
      "الجمعة",
      "السبت",
    ];
    const months = [
      "يناير",
      "فبراير",
      "مارس",
      "أبريل",
      "مايو",
      "يونيو",
      "يوليو",
      "أغسطس",
      "سبتمبر",
      "أكتوبر",
      "نوفمبر",
      "ديسمبر",
    ];

    return {
      weekday: weekdays[today.getDay()],
      date: `${today.getDate()} ${
        months[today.getMonth()]
      } ${today.getFullYear()}`,
    };
  };

  const todayInfo = getTodayInfo();
  const { present = 0, absent = 0 } = attendanceData || {};
  const total = present + absent;
  const attendanceRate = total > 0 ? Math.round((present / total) * 100) : 0;

  return (
    <View style={styles.todayCard}>
      <View style={styles.todayHeader}>
        <MaterialCommunityIcons
          name="calendar-today"
          size={24}
          color="#8b5cf6"
        />
        <View style={styles.todayInfo}>
          <Text style={styles.todayWeekday}>{todayInfo.weekday}</Text>
          <Text style={styles.todayDate}>{todayInfo.date}</Text>
        </View>
      </View>
      <View style={styles.attendanceStats}>
        <Text style={styles.attendanceCount}>{attendanceRate}%</Text>
        <Text style={styles.attendanceLabel}>معدل الحضور</Text>
        <Text style={styles.attendanceDetails}>
          {present} حاضر • {absent} غائب
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  todayCard: {
    backgroundColor: "#1f2937",
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#8b5cf6",
  },
  todayHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  todayInfo: {
    marginRight: 12,
    flex: 1,
    alignItems: "flex-end",
  },
  todayWeekday: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#8b5cf6",
    textAlign: "right",
  },
  todayDate: {
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "right",
  },
  attendanceStats: {
    alignItems: "center",
  },
  attendanceCount: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 4,
  },
  attendanceLabel: {
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "center",
  },
  attendanceDetails: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
    textAlign: "center",
  },
});

export default TodayCard;
