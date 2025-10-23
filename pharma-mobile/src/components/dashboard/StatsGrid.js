import React from "react";
import { View, Text, StyleSheet } from "react-native";
import StatCard from "./StatCard";

const StatsGrid = ({ stats, animatedValue, deltas }) => {
  const statItems = [
    {
      icon: "store",
      label: "الصيدليات",
      value: stats.pharmacies,
      color: "#06b6d4",
    },
    {
      icon: "account-group",
      label: "الصيادلة",
      value: stats.pharmacists,
      color: "#10b981",
    },
    {
      icon: "account-star",
      label: "الصيادلة الخبراء",
      value: stats.seniors,
      color: "#f59e0b",
    },
    {
      icon: "account-check",
      label: "الحاضرون اليوم",
      value: stats.present,
      color: "#f43f5e",
    },
  ];

  return (
    <View style={styles.statsContainer}>
      <Text style={styles.sectionTitle}>إحصائيات عامة</Text>
      <View style={styles.statsGrid}>
        {statItems.map((item, index) => {
          const delta = deltas?.[item.label]?.value;
          const progress = deltas?.[item.label]?.progress;
          const progressColor = deltas?.[item.label]?.progressColor;
          const deltaPositive = deltas?.[item.label]?.positive;
          const subtitle = deltas?.[item.label]?.subtitle;
          return (
            <StatCard
              key={index}
              icon={item.icon}
              label={item.label}
              value={item.value}
              color={item.color}
              animatedValue={animatedValue}
              delta={delta}
              deltaPositive={deltaPositive}
              progress={progress}
              progressColor={progressColor}
              subtitle={subtitle}
            />
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  statsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 16,
    textAlign: "right",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
});

export default StatsGrid;
