import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, radii, spacing } from "../../utils/theme";

const monthNamesAr = [
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

export default function MonthYearPicker({
  visible,
  month,
  year,
  onConfirm,
  onCancel,
  // Legacy props for backward compatibility
  setMonth,
  setYear,
}) {
  const [selectedMonth, setSelectedMonth] = useState(month);
  const [selectedYear, setSelectedYear] = useState(year);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);

  // Handle legacy mode (when visible prop is not provided)
  if (visible === undefined) {
    // Legacy simple picker mode
    const label = `${monthNamesAr[month]} ${year}`;

    const changeMonth = (delta) => {
      const d = new Date(year, month + delta, 1);
      if (setMonth && setYear) {
        setMonth(d.getMonth());
        setYear(d.getFullYear());
      }
    };

    return (
      <View style={styles.container}>
        <TouchableOpacity style={styles.navBtn} onPress={() => changeMonth(-1)}>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.label}>{label}</Text>
        <TouchableOpacity style={styles.navBtn} onPress={() => changeMonth(1)}>
          <MaterialCommunityIcons name="chevron-left" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  }

  // Modal picker mode
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.pickerModalContent}>
          <Text style={styles.pickerTitle}>اختر الشهر والسنة</Text>

          <View style={styles.pickerSection}>
            <Text style={styles.pickerLabel}>الشهر:</Text>
            <ScrollView
              style={styles.pickerScrollView}
              showsVerticalScrollIndicator={false}
            >
              {monthNamesAr.map((monthName, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.pickerItem,
                    selectedMonth === index && styles.selectedPickerItem,
                  ]}
                  onPress={() => setSelectedMonth(index)}
                >
                  <Text
                    style={[
                      styles.pickerItemText,
                      selectedMonth === index && styles.selectedPickerItemText,
                    ]}
                  >
                    {monthName}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.pickerSection}>
            <Text style={styles.pickerLabel}>السنة:</Text>
            <ScrollView
              style={styles.pickerScrollView}
              showsVerticalScrollIndicator={false}
            >
              {years.map((yearOption) => (
                <TouchableOpacity
                  key={yearOption}
                  style={[
                    styles.pickerItem,
                    selectedYear === yearOption && styles.selectedPickerItem,
                  ]}
                  onPress={() => setSelectedYear(yearOption)}
                >
                  <Text
                    style={[
                      styles.pickerItemText,
                      selectedYear === yearOption &&
                        styles.selectedPickerItemText,
                    ]}
                  >
                    {yearOption}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelButtonText}>إلغاء</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={() => onConfirm(selectedMonth, selectedYear)}
            >
              <Text style={styles.confirmButtonText}>تأكيد</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // Legacy simple picker styles
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: "#374151",
    marginBottom: 12,
  },
  navBtn: {
    padding: 6,
    backgroundColor: "#374151",
    borderRadius: 999,
    marginHorizontal: 6,
  },
  label: {
    color: colors.textPrimary,
    fontWeight: "700",
    fontSize: 14,
    textAlign: "center",
    minWidth: 140,
  },

  // Modal picker styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  pickerModalContent: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.xl,
    maxWidth: "90%",
    width: "100%",
    maxHeight: "80%",
  },
  pickerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  pickerSection: {
    marginBottom: spacing.lg,
  },
  pickerLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: "right",
  },
  pickerScrollView: {
    maxHeight: 120,
    borderWidth: 1,
    borderColor: "#374151",
    borderRadius: radii.lg,
  },
  pickerItem: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "#374151",
  },
  selectedPickerItem: {
    backgroundColor: colors.brandStart,
  },
  pickerItemText: {
    fontSize: 16,
    color: colors.textPrimary,
    textAlign: "center",
  },
  selectedPickerItemText: {
    color: "#ffffff",
    fontWeight: "700",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.md,
  },
  cancelButton: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: "#374151",
  },
  cancelButtonText: {
    color: colors.textSecondary,
    fontWeight: "700",
  },
  confirmButton: {
    backgroundColor: colors.brandStart,
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  confirmButtonText: {
    color: "#ffffff",
    fontWeight: "700",
  },
});
