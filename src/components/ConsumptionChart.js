import React from "react";
import { Bar } from "react-chartjs-2";
import { motion } from "framer-motion";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const ConsumptionChart = ({ allMonthsItems }) => {
  const getLastThreeMonthsKeys = () => {
    const keys = Object.keys(allMonthsItems);
    return keys.sort().slice(-3);
  };

  const calculateAverages = () => {
    const keys = getLastThreeMonthsKeys();
    const itemMap = {};

    keys.forEach((monthKey) => {
      const monthItems = allMonthsItems[monthKey] || [];
      if (!Array.isArray(monthItems)) return;
      monthItems.forEach((item) => {
        if (!item.name) return;
        if (!itemMap[item.name]) {
          itemMap[item.name] = {
            totalDispensed: 0,
            totalIncoming: 0,
            count: 0,
          };
        }
        const dispensed = Object.values(item.dailyDispense || {}).reduce(
          (a, b) => a + Number(b || 0),
          0
        );
        const incoming = Object.values(item.dailyIncoming || {}).reduce(
          (a, b) => a + Number(b || 0),
          0
        );
        itemMap[item.name].totalDispensed += dispensed;
        itemMap[item.name].totalIncoming += incoming;
        itemMap[item.name].count += 1;
      });
    });

    return Object.entries(itemMap).map(([name, data]) => ({
      name,
      avgDispensed:
        data.count > 0 ? Math.round(data.totalDispensed / data.count) : 0,
      avgIncoming:
        data.count > 0 ? Math.round(data.totalIncoming / data.count) : 0,
    }));
  };

  const results = calculateAverages();

  const data = {
    labels: results.map((row) => row.name),
    datasets: [
      {
        label: "متوسط المنصرف",
        data: results.map((row) => row.avgDispensed),
        backgroundColor: "rgba(239, 68, 68, 0.7)",
        borderColor: "rgba(239, 68, 68, 1)",
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      },
      {
        label: "متوسط الوارد",
        data: results.map((row) => row.avgIncoming),
        backgroundColor: "rgba(34, 197, 94, 0.7)",
        borderColor: "rgba(34, 197, 94, 1)",
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          font: {
            family: "Cairo",
            size: 14,
            weight: "bold",
          },
          padding: 20,
          usePointStyle: true,
          pointStyle: "circle",
        },
      },
      title: {
        display: true,
        text: "متوسط الاستهلاك والوارد لكل صنف (آخر ٣ شهور)",
        font: {
          family: "Cairo",
          size: 18,
          weight: "bold",
        },
        padding: {
          top: 10,
          bottom: 30,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "الكمية",
          font: {
            family: "Cairo",
            size: 14,
            weight: "bold",
          },
        },
        grid: {
          color: "rgba(156, 163, 175, 0.2)",
        },
        ticks: {
          font: {
            family: "Cairo",
            size: 12,
          },
        },
      },
      x: {
        title: {
          display: true,
          text: "الصنف",
          font: {
            family: "Cairo",
            size: 14,
            weight: "bold",
          },
        },
        grid: {
          color: "rgba(156, 163, 175, 0.2)",
        },
        ticks: {
          font: {
            family: "Cairo",
            size: 12,
          },
        },
      },
    },
    interaction: {
      intersect: false,
      mode: "index",
    },
  };

  return (
    <div className="mt-10 p-8 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border-t-4 border-indigo-200 dark:border-indigo-700 font-[Cairo]">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-extrabold mb-4 text-indigo-700 dark:text-indigo-300 tracking-wide leading-relaxed">
          📈 رسم بياني للاستهلاك
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          متوسط الاستهلاك والوارد لكل صنف (آخر ٣ شهور)
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative h-96"
      >
        {results.length > 0 ? (
          <Bar data={data} options={options} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-6xl mb-4">📈</div>
              <h3 className="text-xl font-bold text-gray-600 dark:text-gray-400 mb-2">
                لا توجد بيانات للعرض
              </h3>
              <p className="text-gray-500 dark:text-gray-500">
                أضف بيانات في الجداول أعلاه لعرض الرسم البياني
              </p>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ConsumptionChart;
