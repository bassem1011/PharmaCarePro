import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

// PDF Service for generating professional reports
export class PDFService {
  // Generate HTML template for inventory report
  static generateInventoryHTML(month, year, items, calculateRemainingStock) {
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

    const currentDate = new Date().toLocaleDateString("ar-EG");
    const currentTime = new Date().toLocaleTimeString("ar-EG");

    let itemsHTML = "";
    let totalItems = 0;
    let totalValue = 0;

    if (items && items.length > 0) {
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
        const itemValue = remainingStock * (item.unitPrice || 0);

        totalItems++;
        totalValue += itemValue;

        itemsHTML += `
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${
              index + 1
            }</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${
              item.name
            }</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${Math.floor(
              Number(item.opening || 0)
            )}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${totalIncoming}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${totalDispensed}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center; font-weight: bold; color: ${
              remainingStock > 0 ? "#28a745" : "#dc3545"
            };">${remainingStock}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${
              item.unitPrice || 0
            } ج.م</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${itemValue.toFixed(
              2
            )} ج.م</td>
          </tr>
        `;
      });
    }

    return `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>تقرير المخزون</title>
        <style>
          body {
            font-family: 'Arial', sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #ffffff;
            direction: rtl;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 3px solid #8b5cf6;
            padding-bottom: 20px;
          }
          .title {
            color: #8b5cf6;
            font-size: 28px;
            font-weight: bold;
            margin: 0;
          }
          .subtitle {
            color: #666;
            font-size: 16px;
            margin: 10px 0 0 0;
          }
          .info-section {
            margin-bottom: 20px;
            padding: 15px;
            background-color: #f8f9fa;
            border-radius: 8px;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
          }
          .info-label {
            font-weight: bold;
            color: #333;
          }
          .info-value {
            color: #666;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            font-size: 12px;
          }
          th {
            background-color: #8b5cf6;
            color: white;
            padding: 12px 8px;
            text-align: center;
            font-weight: bold;
          }
          .summary {
            margin-top: 30px;
            padding: 20px;
            background-color: #e9ecef;
            border-radius: 8px;
          }
          .summary-title {
            font-size: 18px;
            font-weight: bold;
            color: #333;
            margin-bottom: 15px;
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            color: #666;
            font-size: 12px;
            border-top: 1px solid #ddd;
            padding-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="title">تقرير المخزون</h1>
          <p class="subtitle">نظام إدارة الصيدليات</p>
        </div>

        <div class="info-section">
          <div class="info-row">
            <span class="info-label">الفترة:</span>
            <span class="info-value">${monthNames[month]} ${year}</span>
          </div>
          <div class="info-row">
            <span class="info-label">تاريخ التقرير:</span>
            <span class="info-value">${currentDate}</span>
          </div>
          <div class="info-row">
            <span class="info-label">وقت التقرير:</span>
            <span class="info-value">${currentTime}</span>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>اسم الصنف</th>
              <th>الرصيد الافتتاحي</th>
              <th>إجمالي الوارد</th>
              <th>إجمالي المنصرف</th>
              <th>المخزون المتبقي</th>
              <th>سعر الوحدة</th>
              <th>القيمة الإجمالية</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHTML}
          </tbody>
        </table>

        <div class="summary">
          <div class="summary-title">ملخص التقرير</div>
          <div class="info-row">
            <span class="info-label">إجمالي الأصناف:</span>
            <span class="info-value">${totalItems}</span>
          </div>
          <div class="info-row">
            <span class="info-label">القيمة الإجمالية للمخزون:</span>
            <span class="info-value">${totalValue.toFixed(2)} ج.م</span>
          </div>
        </div>

        <div class="footer">
          <p>تم إنشاء هذا التقرير بواسطة نظام إدارة الصيدليات</p>
          <p>جميع الحقوق محفوظة © ${new Date().getFullYear()}</p>
        </div>
      </body>
      </html>
    `;
  }

  // Generate HTML template for consumption report
  static generateConsumptionHTML(month, year, monthlyConsumption) {
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

    const currentDate = new Date().toLocaleDateString("ar-EG");
    const currentTime = new Date().toLocaleTimeString("ar-EG");

    let itemsHTML = "";
    let totalConsumption = 0;
    let totalAverage = 0;

    if (monthlyConsumption && Object.keys(monthlyConsumption).length > 0) {
      Object.values(monthlyConsumption).forEach((item, index) => {
        totalConsumption += item.total;
        totalAverage += item.average;

        itemsHTML += `
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${
              index + 1
            }</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${
              item.name
            }</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${
              item.total
            }</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${
              item.average
            }</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${
              Object.keys(item.months).length
            }</td>
          </tr>
        `;
      });
    }

    return `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>تقرير الاستهلاك</title>
        <style>
          body {
            font-family: 'Arial', sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #ffffff;
            direction: rtl;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 3px solid #10b981;
            padding-bottom: 20px;
          }
          .title {
            color: #10b981;
            font-size: 28px;
            font-weight: bold;
            margin: 0;
          }
          .subtitle {
            color: #666;
            font-size: 16px;
            margin: 10px 0 0 0;
          }
          .info-section {
            margin-bottom: 20px;
            padding: 15px;
            background-color: #f8f9fa;
            border-radius: 8px;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
          }
          .info-label {
            font-weight: bold;
            color: #333;
          }
          .info-value {
            color: #666;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            font-size: 12px;
          }
          th {
            background-color: #10b981;
            color: white;
            padding: 12px 8px;
            text-align: center;
            font-weight: bold;
          }
          .summary {
            margin-top: 30px;
            padding: 20px;
            background-color: #e9ecef;
            border-radius: 8px;
          }
          .summary-title {
            font-size: 18px;
            font-weight: bold;
            color: #333;
            margin-bottom: 15px;
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            color: #666;
            font-size: 12px;
            border-top: 1px solid #ddd;
            padding-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="title">تقرير الاستهلاك الشهري</h1>
          <p class="subtitle">نظام إدارة الصيدليات</p>
        </div>

        <div class="info-section">
          <div class="info-row">
            <span class="info-label">الفترة:</span>
            <span class="info-value">${monthNames[month]} ${year}</span>
          </div>
          <div class="info-row">
            <span class="info-label">تاريخ التقرير:</span>
            <span class="info-value">${currentDate}</span>
          </div>
          <div class="info-row">
            <span class="info-label">وقت التقرير:</span>
            <span class="info-value">${currentTime}</span>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>اسم الصنف</th>
              <th>إجمالي الاستهلاك</th>
              <th>متوسط شهري</th>
              <th>عدد الأشهر</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHTML}
          </tbody>
        </table>

        <div class="summary">
          <div class="summary-title">ملخص التقرير</div>
          <div class="info-row">
            <span class="info-label">إجمالي الأصناف المستهلكة:</span>
            <span class="info-value">${
              Object.keys(monthlyConsumption || {}).length
            }</span>
          </div>
          <div class="info-row">
            <span class="info-label">إجمالي الاستهلاك:</span>
            <span class="info-value">${totalConsumption}</span>
          </div>
          <div class="info-row">
            <span class="info-label">متوسط الاستهلاك الشهري:</span>
            <span class="info-value">${totalAverage.toFixed(2)}</span>
          </div>
        </div>

        <div class="footer">
          <p>تم إنشاء هذا التقرير بواسطة نظام إدارة الصيدليات</p>
          <p>جميع الحقوق محفوظة © ${new Date().getFullYear()}</p>
        </div>
      </body>
      </html>
    `;
  }

  // Generate HTML template for shortages report
  static generateShortagesHTML(
    month,
    year,
    items,
    monthlyConsumption,
    calculateRemainingStock
  ) {
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

    const currentDate = new Date().toLocaleDateString("ar-EG");
    const currentTime = new Date().toLocaleTimeString("ar-EG");

    // Calculate shortages
    const shortages = items
      ? items
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
          .sort((a, b) => b.shortage - a.shortage)
      : [];

    let itemsHTML = "";
    let totalShortageValue = 0;

    shortages.forEach((shortage, index) => {
      const shortageValue = shortage.shortage * shortage.unitPrice;
      totalShortageValue += shortageValue;

      itemsHTML += `
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${
            index + 1
          }</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${
            shortage.name
          }</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center; color: #dc3545; font-weight: bold;">${
            shortage.currentStock
          }</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${
            shortage.averageConsumption
          }</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center; color: #dc3545; font-weight: bold;">${
            shortage.shortage
          }</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${
            shortage.unitPrice
          } ج.م</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center; color: #dc3545; font-weight: bold;">${shortageValue.toFixed(
            2
          )} ج.م</td>
        </tr>
      `;
    });

    return `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>تقرير النواقص</title>
        <style>
          body {
            font-family: 'Arial', sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #ffffff;
            direction: rtl;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 3px solid #dc3545;
            padding-bottom: 20px;
          }
          .title {
            color: #dc3545;
            font-size: 28px;
            font-weight: bold;
            margin: 0;
          }
          .subtitle {
            color: #666;
            font-size: 16px;
            margin: 10px 0 0 0;
          }
          .info-section {
            margin-bottom: 20px;
            padding: 15px;
            background-color: #f8f9fa;
            border-radius: 8px;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
          }
          .info-label {
            font-weight: bold;
            color: #333;
          }
          .info-value {
            color: #666;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            font-size: 12px;
          }
          th {
            background-color: #dc3545;
            color: white;
            padding: 12px 8px;
            text-align: center;
            font-weight: bold;
          }
          .summary {
            margin-top: 30px;
            padding: 20px;
            background-color: #e9ecef;
            border-radius: 8px;
          }
          .summary-title {
            font-size: 18px;
            font-weight: bold;
            color: #333;
            margin-bottom: 15px;
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            color: #666;
            font-size: 12px;
            border-top: 1px solid #ddd;
            padding-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="title">تقرير النواقص</h1>
          <p class="subtitle">نظام إدارة الصيدليات</p>
        </div>

        <div class="info-section">
          <div class="info-row">
            <span class="info-label">الفترة:</span>
            <span class="info-value">${monthNames[month]} ${year}</span>
          </div>
          <div class="info-row">
            <span class="info-label">تاريخ التقرير:</span>
            <span class="info-value">${currentDate}</span>
          </div>
          <div class="info-row">
            <span class="info-label">وقت التقرير:</span>
            <span class="info-value">${currentTime}</span>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>اسم الصنف</th>
              <th>المخزون الحالي</th>
              <th>متوسط الاستهلاك</th>
              <th>الكمية المطلوبة</th>
              <th>سعر الوحدة</th>
              <th>القيمة المطلوبة</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHTML}
          </tbody>
        </table>

        <div class="summary">
          <div class="summary-title">ملخص التقرير</div>
          <div class="info-row">
            <span class="info-label">عدد الأصناف الناقصة:</span>
            <span class="info-value">${shortages.length}</span>
          </div>
          <div class="info-row">
            <span class="info-label">إجمالي القيمة المطلوبة:</span>
            <span class="info-value" style="color: #dc3545; font-weight: bold;">${totalShortageValue.toFixed(
              2
            )} ج.م</span>
          </div>
        </div>

        <div class="footer">
          <p>تم إنشاء هذا التقرير بواسطة نظام إدارة الصيدليات</p>
          <p>جميع الحقوق محفوظة © ${new Date().getFullYear()}</p>
        </div>
      </body>
      </html>
    `;
  }

  // Generate comprehensive HTML report
  static generateComprehensiveHTML(
    month,
    year,
    items,
    monthlyConsumption,
    calculateRemainingStock
  ) {
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

    const currentDate = new Date().toLocaleDateString("ar-EG");
    const currentTime = new Date().toLocaleTimeString("ar-EG");

    // Calculate statistics
    const totalItems = items ? items.length : 0;
    const totalValue = items
      ? items.reduce((sum, item) => {
          const remainingStock = calculateRemainingStock(item);
          return sum + remainingStock * (item.unitPrice || 0);
        }, 0)
      : 0;

    const shortages = items
      ? items.filter((item) => {
          if (!item.name) return false;
          const currentStock = calculateRemainingStock(item);
          const consumption = monthlyConsumption[item.name];
          const averageConsumption = consumption ? consumption.average : 10;
          return currentStock <= averageConsumption;
        }).length
      : 0;

    const totalConsumption = Object.values(monthlyConsumption || {}).reduce(
      (sum, item) => sum + item.total,
      0
    );

    return `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>التقرير الشامل</title>
        <style>
          body {
            font-family: 'Arial', sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #ffffff;
            direction: rtl;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 3px solid #8b5cf6;
            padding-bottom: 20px;
          }
          .title {
            color: #8b5cf6;
            font-size: 28px;
            font-weight: bold;
            margin: 0;
          }
          .subtitle {
            color: #666;
            font-size: 16px;
            margin: 10px 0 0 0;
          }
          .info-section {
            margin-bottom: 20px;
            padding: 15px;
            background-color: #f8f9fa;
            border-radius: 8px;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
          }
          .info-label {
            font-weight: bold;
            color: #333;
          }
          .info-value {
            color: #666;
          }
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin: 20px 0;
          }
          .stat-card {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            border-left: 4px solid #8b5cf6;
          }
          .stat-number {
            font-size: 24px;
            font-weight: bold;
            color: #8b5cf6;
            margin-bottom: 5px;
          }
          .stat-label {
            color: #666;
            font-size: 14px;
          }
          .section-title {
            font-size: 20px;
            font-weight: bold;
            color: #333;
            margin: 30px 0 15px 0;
            padding-bottom: 10px;
            border-bottom: 2px solid #8b5cf6;
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            color: #666;
            font-size: 12px;
            border-top: 1px solid #ddd;
            padding-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="title">التقرير الشامل</h1>
          <p class="subtitle">نظام إدارة الصيدليات</p>
        </div>

        <div class="info-section">
          <div class="info-row">
            <span class="info-label">الفترة:</span>
            <span class="info-value">${monthNames[month]} ${year}</span>
          </div>
          <div class="info-row">
            <span class="info-label">تاريخ التقرير:</span>
            <span class="info-value">${currentDate}</span>
          </div>
          <div class="info-row">
            <span class="info-label">وقت التقرير:</span>
            <span class="info-value">${currentTime}</span>
          </div>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-number">${totalItems}</div>
            <div class="stat-label">إجمالي الأصناف</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${totalValue.toFixed(2)} ج.م</div>
            <div class="stat-label">القيمة الإجمالية</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${shortages}</div>
            <div class="stat-label">الأصناف الناقصة</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${totalConsumption}</div>
            <div class="stat-label">إجمالي الاستهلاك</div>
          </div>
        </div>

        <div class="footer">
          <p>تم إنشاء هذا التقرير بواسطة نظام إدارة الصيدليات</p>
          <p>جميع الحقوق محفوظة © ${new Date().getFullYear()}</p>
        </div>
      </body>
      </html>
    `;
  }

  // Generate and share PDF
  static async generateAndSharePDF(htmlContent, fileName) {
    try {
      // Generate PDF
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
      });

      // Share PDF
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: `تصدير ${fileName}`,
        });
      } else {
      }

      return uri;
    } catch (error) {
      console.error("Error generating PDF:", error);
      throw error;
    }
  }
}
