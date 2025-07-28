import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../utils/firebase";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { useNavigate } from "react-router-dom";
import Spinner from "./ui/Spinner";
import Skeleton from "./ui/Skeleton";
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function getTodayDateString() {
  const d = new Date();
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

export default function LeadDashboardHome() {
  const [stats, setStats] = useState({
    pharmacies: 0,
    pharmacists: 0,
    seniors: 0,
    present: 0,
    absent: 0,
    loading: true,
  });
  const [trend, setTrend] = useState({
    labels: [],
    present: [],
    absent: [],
    loading: true,
  });
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchStats() {
      try {
        let pharmacies = 0,
          pharmacists = 0,
          seniors = 0;
        // Pharmacies
        const pharmaciesSnap = await getDocs(collection(db, "pharmacies"));
        pharmacies = pharmaciesSnap.size;
        // Pharmacists
        const usersSnap = await getDocs(collection(db, "users"));
        pharmacists = usersSnap.size;
        seniors = usersSnap.docs.filter(
          (doc) => doc.data().role === "senior"
        ).length;
        // Attendance (today, all pharmacies)
        const today = getTodayDateString();
        let presentCount = 0,
          absentCount = 0;
        for (const pharmacyDoc of pharmaciesSnap.docs) {
          try {
            const attSnap = await getDocs(
              collection(db, "pharmacies", pharmacyDoc.id, "attendance")
            );
            const todayDoc = attSnap.docs.find((d) => d.id === today);
            if (todayDoc) {
              const att = todayDoc.data();
              Object.values(att).forEach((val) => {
                if (val === true) presentCount++;
                else if (val === false) absentCount++;
              });
            }
          } catch (error) {
            console.warn(
              `Error fetching attendance for pharmacy ${pharmacyDoc.id}:`,
              error
            );
          }
        }
        setStats({
          pharmacies,
          pharmacists,
          seniors,
          present: presentCount,
          absent: absentCount,
          loading: false,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
        setStats({
          pharmacies: 0,
          pharmacists: 0,
          seniors: 0,
          present: 0,
          absent: 0,
          loading: false,
        });
      }
    }
    fetchStats();
  }, []);

  useEffect(() => {
    async function fetchTrend() {
      try {
        const pharmaciesSnap = await getDocs(collection(db, "pharmacies"));
        const pharmacies = pharmaciesSnap.docs.map((doc) => doc.id);

        // Use July 2025 specifically
        const currentYear = 2025;
        const currentMonth = 7; // July

        // Get number of days in July (31 days)
        const daysInMonth = 31;

        // Create array of day numbers (1-31)
        const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

        let presentArr = [],
          absentArr = [];

        for (const day of days) {
          let present = 0,
            absent = 0;
          for (const pid of pharmacies) {
            try {
              const attDoc = await getDocs(
                collection(db, "pharmacies", pid, "attendance")
              );
              // Create date string for this day
              const dateString = `${currentYear}-${String(
                currentMonth
              ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const todayDoc = attDoc.docs.find((d) => d.id === dateString);
              if (todayDoc) {
                const att = todayDoc.data();
                Object.values(att).forEach((val) => {
                  if (val === true) present++;
                  else if (val === false) absent++;
                });
              }
            } catch (error) {
              console.warn(
                `Error fetching attendance for pharmacy ${pid} on day ${day}:`,
                error
              );
            }
          }
          presentArr.push(present);
          absentArr.push(absent);
        }
        setTrend({
          labels: days,
          present: presentArr,
          absent: absentArr,
          loading: false,
        });
      } catch (error) {
        console.error("Error fetching trend:", error);
        setTrend({
          labels: [],
          present: [],
          absent: [],
          loading: false,
        });
      }
    }
    fetchTrend();
  }, []);

  // Function to get day name from day number for July 2025
  const getDayName = (dayNumber) => {
    const currentYear = 2025;
    const currentMonth = 7; // July

    // Create date for this day in July 2025
    const date = new Date(currentYear, currentMonth - 1, dayNumber);

    // Get day name in English (Gregorian)
    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];

    return dayNames[date.getDay()];
  };

  if (stats.loading)
    return (
      <div className="text-center py-8 flex flex-col items-center justify-center">
        <Spinner size={56} className="mb-4" />
        <Skeleton width={200} height={24} className="mb-2" />
        <Skeleton width={300} height={18} />
      </div>
    );

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-fuchsia-400 mb-2">
          لوحة تحكم الصيدلي الأول
        </h1>
        <p className="text-gray-300">نظرة عامة على جميع الصيدليات والصيادلة</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Today's Attendance Card */}
        <div className="bg-gradient-to-br from-fuchsia-900/50 to-purple-900/50 rounded-lg shadow-lg p-6 border border-fuchsia-600">
          <div className="text-center">
            <div className="text-4xl mb-2">📅</div>
            <div className="text-lg font-bold text-fuchsia-300 mb-1">
              {new Date().toLocaleDateString("en-US", { weekday: "long" })}
            </div>
            <div className="text-sm text-gray-300 mb-3">
              {new Date().toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {stats.present + stats.absent > 0
                ? `${stats.present}/${stats.present + stats.absent}`
                : "0/0"}
            </div>
            <div className="text-xs text-gray-400">الحضور اليوم</div>
          </div>
        </div>

        <div className="bg-gray-950 rounded-lg shadow-lg p-6 border border-fuchsia-700">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-fuchsia-400 mb-2">
                {stats.pharmacies}
              </div>
              <div className="text-gray-300">إجمالي الصيدليات</div>
            </div>
            <div className="text-4xl">🏥</div>
          </div>
        </div>
        <div className="bg-gray-950 rounded-lg shadow-lg p-6 border border-fuchsia-700">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-fuchsia-400 mb-2">
                {stats.pharmacists}
              </div>
              <div className="text-gray-300">إجمالي الصيادلة</div>
            </div>
            <div className="text-4xl">👨‍⚕️</div>
          </div>
        </div>
        <div className="bg-gray-950 rounded-lg shadow-lg p-6 border border-fuchsia-700">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-fuchsia-400 mb-2">
                {stats.seniors}
              </div>
              <div className="text-gray-300">كبار الصيادلة</div>
            </div>
            <div className="text-4xl">👨‍⚕️</div>
          </div>
        </div>
      </div>

      {/* Attendance Trends Chart */}
      <div className="bg-gray-950 rounded-lg shadow-lg p-6 border border-fuchsia-700 mb-8">
        <h3 className="text-xl font-semibold mb-6 text-fuchsia-400">
          اتجاه الحضور (July 2025)
        </h3>
        {trend.loading ? (
          <div className="text-center py-8 flex flex-col items-center justify-center">
            <Spinner size={56} className="mb-4" />
            <Skeleton width={200} height={24} className="mb-2" />
            <Skeleton width={300} height={18} />
          </div>
        ) : trend.labels.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">📊</div>
            <p className="text-gray-400">لا توجد بيانات متاحة للعرض</p>
          </div>
        ) : (
          <div className="h-80">
            <Bar
              data={{
                labels: trend.labels.map((day) => `${day} ${getDayName(day)}`),
                datasets: [
                  {
                    label: "حاضر",
                    data: trend.present,
                    backgroundColor: "#7c3aed",
                    borderColor: "#7c3aed",
                    borderWidth: 1,
                  },
                  {
                    label: "غائب",
                    data: trend.absent,
                    backgroundColor: "#ef4444",
                    borderColor: "#ef4444",
                    borderWidth: 1,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: "top",
                    labels: {
                      color: "#f3f4f6",
                      font: {
                        family: "Cairo, Tajawal, Noto Sans Arabic, sans-serif",
                      },
                    },
                  },
                  title: { display: false },
                },
                scales: {
                  x: {
                    title: {
                      display: true,
                      text: "اليوم",
                      color: "#f3f4f6",
                      font: {
                        family: "Cairo, Tajawal, Noto Sans Arabic, sans-serif",
                      },
                    },
                    ticks: {
                      color: "#f3f4f6",
                      font: {
                        family: "Cairo, Tajawal, Noto Sans Arabic, sans-serif",
                      },
                    },
                  },
                  y: {
                    title: {
                      display: true,
                      text: "عدد الصيادلة",
                      color: "#f3f4f6",
                      font: {
                        family: "Cairo, Tajawal, Noto Sans Arabic, sans-serif",
                      },
                    },
                    ticks: {
                      color: "#f3f4f6",
                      font: {
                        family: "Cairo, Tajawal, Noto Sans Arabic, sans-serif",
                      },
                    },
                    beginAtZero: true,
                  },
                },
              }}
            />
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-4 mb-8">
        <button
          className="bg-gradient-to-r from-purple-700 to-fuchsia-600 text-white px-6 py-3 rounded-lg hover:opacity-90 transition-all font-medium"
          onClick={() => navigate("/lead/pharmacies")}
        >
          عرض كل الصيدليات
        </button>
        <button
          className="bg-gradient-to-r from-purple-700 to-fuchsia-600 text-white px-6 py-3 rounded-lg hover:opacity-90 transition-all font-medium"
          onClick={() => navigate("/lead/pharmacists")}
        >
          عرض كل الصيادلة
        </button>
        <button
          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
          onClick={() => navigate("/lead/pharmacies")}
        >
          + إضافة صيدلية
        </button>
        <button
          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
          onClick={() => navigate("/lead/pharmacists")}
        >
          + إضافة صيدلي
        </button>
        <button
          className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors font-medium"
          onClick={() => navigate("/lead/attendance")}
        >
          مراقبة الحضور
        </button>
      </div>
    </div>
  );
}
