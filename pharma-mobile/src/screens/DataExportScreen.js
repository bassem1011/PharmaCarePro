import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useInventoryData } from "../hooks/useInventoryData";
import { useRoute } from "@react-navigation/native";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { PDFService } from "../services/pdfService";

const DataExportScreen = () => {
  const route = useRoute();
  const { pharmacyId } = route.params || {};

  const { month, year, items, monthlyConsumption, calculateRemainingStock } =
    useInventoryData(pharmacyId);

  const [exporting, setExporting] = useState(false);
  const [exportType, setExportType] = useState("");

  const monthNames = [
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

  // Generate inventory report
  const generateInventoryReport = () => {
    if (!items || items.length === 0) {
      return "لا توجد بيانات مخزون للتصدير";
    }

    let report = `تقرير المخزون - ${monthNames[month]} ${year}\n`;
    report += "=".repeat(50) + "\n\n";

    items.forEach((item, index) => {
      if (!item.name) return;

      const remainingStock = calculateRemainingStock(item);
      const totalIncoming = Math.floor(
        Object.values(item.dailyIncoming || {}).reduce(
          (acc, val) => acc + Number(val || 0),
          0
        )
      );
      const totalDispensed = Math.floor(
        Object.values(item.dailyDispense || {}).reduce(
          (acc, val) => acc + Number(val || 0),
          0
        )
      );

      report += `${index + 1}. ${item.name}\n`;
      report += `   الرصيد الافتتاحي: ${Math.floor(
        Number(item.opening || 0)
      )}\n`;
      report += `   إجمالي الوارد: ${totalIncoming}\n`;
      report += `   إجمالي المنصرف: ${totalDispensed}\n`;
      report += `   المخزون المتبقي: ${remainingStock}\n`;
      report += `   سعر الوحدة: ${item.unitPrice || 0} ج.م\n\n`;
    });

    return report;
  };

  // Generate consumption report
  const generateConsumptionReport = () => {
    if (Object.keys(monthlyConsumption).length === 0) {
      return "لا توجد بيانات استهلاك للتصدير";
    }

    let report = `تقرير الاستهلاك الشهري - ${monthNames[month]} ${year}\n`;
    report += "=".repeat(50) + "\n\n";

    Object.values(monthlyConsumption).forEach((item, index) => {
      report += `${index + 1}. ${item.name}\n`;
      report += `   إجمالي الاستهلاك: ${item.total}\n`;
      report += `   متوسط شهري: ${item.average}\n`;
      report += `   عدد الأشهر: ${Object.keys(item.months).length}\n\n`;
    });

    return report;
  };

  // Generate shortages report
  const generateShortagesReport = () => {
    if (!items || items.length === 0) {
      return "لا توجد بيانات نواقص للتصدير";
    }

    const shortages = items
      .filter((item) => {
        if (!item.name) return false;
        const currentStock = calculateRemainingStock(item);
        const consumption = monthlyConsumption[item.name];
        const averageConsumption = consumption ? consumption.average : 10;
        return currentStock <= averageConsumption;
      })
      .map((item) => {
        const currentStock = calculateRemainingStock(item);
        const consumption = monthlyConsumption[item.name];
        const averageConsumption = consumption ? consumption.average : 10;
        const shortage = Math.max(0, averageConsumption - currentStock);

        return {
          name: item.name,
          currentStock,
          averageConsumption,
          shortage,
          unitPrice: item.unitPrice || 0,
        };
      })
      .sort((a, b) => b.shortage - a.shortage);

    if (shortages.length === 0) {
      return "لا توجد نواقص في المخزون";
    }

    let report = `تقرير النواقص - ${monthNames[month]} ${year}\n`;
    report += "=".repeat(50) + "\n\n";

    shortages.forEach((shortage, index) => {
      report += `${index + 1}. ${shortage.name}\n`;
      report += `   المخزون الحالي: ${shortage.currentStock}\n`;
      report += `   متوسط الاستهلاك: ${shortage.averageConsumption}\n`;
      report += `   الكمية المطلوبة: ${shortage.shortage}\n`;
      report += `   القيمة المطلوبة: ${
        shortage.shortage * shortage.unitPrice
      } ج.م\n\n`;
    });

    return report;
  };

  // Export data to file
  const exportData = async (reportType, reportContent) => {
    try {
      setExporting(true);

      const fileName = `${reportType}_${monthNames[month]}_${year}.txt`;
      const filePath = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(filePath, reportContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filePath, {
          mimeType: "text/plain",
          dialogTitle: `تصدير ${reportType}`,
        });
      } else {
        Alert.alert("نجح", `تم حفظ الملف: ${fileName}`);
      }
    } catch (error) {
      console.error("Error exporting data:", error);
      Alert.alert("خطأ", "فشل في تصدير البيانات");
    } finally {
      setExporting(false);
    }
  };

  // Export PDF
  const exportPDF = async (reportType) => {
    try {
      setExporting(true);
      setExportType(reportType);

      let htmlContent = "";
      let fileName = "";

      switch (reportType) {
        case "inventory":
          htmlContent = PDFService.generateInventoryHTML(
            month,
            year,
            items,
            calculateRemainingStock
          );
          fileName = `تقرير_المخزون_${monthNames[month]}_${year}`;
          break;
        case "consumption":
          htmlContent = PDFService.generateConsumptionHTML(
            month,
            year,
            monthlyConsumption
          );
          fileName = `تقرير_الاستهلاك_${monthNames[month]}_${year}`;
          break;
        case "shortages":
          htmlContent = PDFService.generateShortagesHTML(
            month,
            year,
            items,
            monthlyConsumption,
            calculateRemainingStock
          );
          fileName = `تقرير_النواقص_${monthNames[month]}_${year}`;
          break;
        case "comprehensive":
          htmlContent = PDFService.generateComprehensiveHTML(
            month,
            year,
            items,
            monthlyConsumption,
            calculateRemainingStock
          );
          fileName = `التقرير_الشامل_${monthNames[month]}_${year}`;
          break;
        default:
          throw new Error("نوع تقرير غير معروف");
      }

      await PDFService.generateAndSharePDF(htmlContent, fileName);
      Alert.alert("نجح", "تم إنشاء وتصدير ملف PDF بنجاح");
    } catch (error) {
      console.error("Error exporting PDF:", error);
      Alert.alert("خطأ", "فشل في إنشاء ملف PDF");
    } finally {
      setExporting(false);
      setExportType("");
    }
  };

  const ExportButton = ({ title, icon, onPress, color, isPDF = false }) => (
    <TouchableOpacity
      style={[styles.exportButton, { borderLeftColor: color }]}
      onPress={onPress}
      disabled={exporting}
    >
      <View style={styles.exportButtonContent}>
        <Ionicons name={icon} size={24} color={color} />
        <View style={styles.exportButtonText}>
          <Text style={styles.exportButtonTitle}>{title}</Text>
          <Text style={styles.exportButtonSubtitle}>
            {isPDF ? "تصدير كملف PDF" : "تصدير كملف نصي"}
          </Text>
        </View>
      </View>
      {exporting && exportType === title.toLowerCase() && (
        <ActivityIndicator size="small" color={color} />
      )}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>تصدير البيانات</Text>
        <Text style={styles.subtitle}>
          {monthNames[month]} {year}
        </Text>
      </View>

      {/* Export Options */}
      <View style={styles.exportContainer}>
        <Text style={styles.sectionTitle}>تصدير كملف نصي</Text>

        <ExportButton
          title="تقرير المخزون"
          icon="cube-outline"
          color="#3b82f6"
          onPress={() => {
            const report = generateInventoryReport();
            exportData("تقرير_المخزون", report);
          }}
        />

        <ExportButton
          title="تقرير الاستهلاك"
          icon="bar-chart-outline"
          color="#10b981"
          onPress={() => {
            const report = generateConsumptionReport();
            exportData("تقرير_الاستهلاك", report);
          }}
        />

        <ExportButton
          title="تقرير النواقص"
          icon="warning-outline"
          color="#ef4444"
          onPress={() => {
            const report = generateShortagesReport();
            exportData("تقرير_النواقص", report);
          }}
        />

        <ExportButton
          title="تقرير شامل"
          icon="document-text-outline"
          color="#8b5cf6"
          onPress={() => {
            const inventoryReport = generateInventoryReport();
            const consumptionReport = generateConsumptionReport();
            const shortagesReport = generateShortagesReport();

            const fullReport =
              "تقرير شامل للمخزون\n" +
              "=".repeat(50) +
              "\n\n" +
              inventoryReport +
              "\n" +
              consumptionReport +
              "\n" +
              shortagesReport;

            exportData("تقرير_شامل", fullReport);
          }}
        />
      </View>

      {/* PDF Export Options */}
      <View style={styles.exportContainer}>
        <Text style={styles.sectionTitle}>تصدير كملف PDF</Text>

        <ExportButton
          title="تقرير المخزون"
          icon="cube-outline"
          color="#3b82f6"
          isPDF={true}
          onPress={() => exportPDF("inventory")}
        />

        <ExportButton
          title="تقرير الاستهلاك"
          icon="bar-chart-outline"
          color="#10b981"
          isPDF={true}
          onPress={() => exportPDF("consumption")}
        />

        <ExportButton
          title="تقرير النواقص"
          icon="warning-outline"
          color="#ef4444"
          isPDF={true}
          onPress={() => exportPDF("shortages")}
        />

        <ExportButton
          title="تقرير شامل"
          icon="document-text-outline"
          color="#8b5cf6"
          isPDF={true}
          onPress={() => exportPDF("comprehensive")}
        />
      </View>

      {/* Export Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>معلومات التصدير</Text>
        <View style={styles.infoItem}>
          <Ionicons
            name="information-circle-outline"
            size={20}
            color="#6b7280"
          />
          <Text style={styles.infoText}>
            يمكن تصدير البيانات كملف نصي أو PDF
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="share-outline" size={20} color="#6b7280" />
          <Text style={styles.infoText}>
            يمكن مشاركة الملفات عبر التطبيقات الأخرى
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="calendar-outline" size={20} color="#6b7280" />
          <Text style={styles.infoText}>
            البيانات تعكس حالة المخزون الحالية
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="document-outline" size={20} color="#6b7280" />
          <Text style={styles.infoText}>
            ملفات PDF مناسبة للطباعة والمشاركة الرسمية
          </Text>
        </View>
      </View>

      {/* Data Summary */}
      <View style={styles.summaryContainer}>
        <Text style={styles.sectionTitle}>ملخص البيانات</Text>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>إجمالي الأصناف:</Text>
          <Text style={styles.summaryValue}>{items ? items.length : 0}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>الأصناف المستهلكة:</Text>
          <Text style={styles.summaryValue}>
            {Object.keys(monthlyConsumption).length}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>الأصناف الناقصة:</Text>
          <Text style={styles.summaryValue}>
            {items
              ? items.filter((item) => {
                  if (!item.name) return false;
                  const currentStock = calculateRemainingStock(item);
                  const consumption = monthlyConsumption[item.name];
                  const averageConsumption = consumption
                    ? consumption.average
                    : 10;
                  return currentStock <= averageConsumption;
                }).length
              : 0}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
  header: {
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "#8b5cf6",
  },
  exportContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 16,
  },
  exportButton: {
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  exportButtonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  exportButtonText: {
    marginLeft: 12,
    flex: 1,
  },
  exportButtonTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ffffff",
  },
  exportButtonSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 2,
  },
  infoContainer: {
    padding: 20,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#6b7280",
    marginLeft: 8,
  },
  summaryContainer: {
    padding: 20,
  },
  summaryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: "#6b7280",
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ffffff",
  },
});

export default DataExportScreen;
