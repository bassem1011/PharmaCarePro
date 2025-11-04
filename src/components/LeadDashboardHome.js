import React, { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../utils/firebase";
import { useNavigate } from "react-router-dom";
import Spinner from "./ui/Spinner";
import Skeleton from "./ui/Skeleton";
import { motion } from "framer-motion";
import { getAuth } from "firebase/auth";
import { useAuthState } from "react-firebase-hooks/auth";
import { Store, Users, Calendar, ArrowRight, Crown } from "lucide-react";

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
  const navigate = useNavigate();
  const auth = getAuth();
  const [user] = useAuthState(auth);

  useEffect(() => {
    async function fetchStats() {
      try {
        if (!user) {
          setStats({
            pharmacies: 0,
            pharmacists: 0,
            seniors: 0,
            present: 0,
            absent: 0,
            loading: false,
          });
          return;
        }

        let pharmacies = 0,
          pharmacists = 0,
          seniors = 0;

        // Get current user's pharmacies (multi-tenant)
        const pharmaciesQuery = query(
          collection(db, "pharmacies"),
          where("ownerId", "==", user.uid)
        );
        const pharmaciesSnap = await getDocs(pharmaciesQuery);
        pharmacies = pharmaciesSnap.size;

        // Get current user's pharmacists (multi-tenant)
        const usersQuery = query(
          collection(db, "users"),
          where("ownerId", "==", user.uid)
        );
        const usersSnap = await getDocs(usersQuery);
        pharmacists = usersSnap.size;
        seniors = usersSnap.docs.filter(
          (doc) => doc.data().role === "senior"
        ).length;

        // Attendance (today, only user's pharmacies)
        const today = getTodayDateString();
        let presentCount = 0,
          absentCount = 0;

        const processAttendance = (att) => {
          Object.values(att).forEach((val) => {
            if (val === true) presentCount++;
            else if (val === false) absentCount++;
          });
        };

        for (const pharmacyDoc of pharmaciesSnap.docs) {
          try {
            const attSnap = await getDocs(
              collection(db, "pharmacies", pharmacyDoc.id, "attendance")
            );
            const todayDoc = attSnap.docs.find((d) => d.id === today);
            if (todayDoc) {
              const att = todayDoc.data();
              processAttendance(att);
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
  }, [user]);

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

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Pharmacies Card */}
        <motion.div
          className="relative overflow-hidden bg-gradient-to-br from-cyan-600 to-cyan-700 rounded-2xl shadow-2xl border border-cyan-500/30 group"
          whileHover={{ scale: 1.05, y: -5 }}
          transition={{ duration: 0.3 }}
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-cyan-400/10 rounded-full -translate-y-10 translate-x-10"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-cyan-400/5 rounded-full translate-y-8 -translate-x-8"></div>
          <div className="relative p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Store size={24} className="text-white" />
              </div>
              <div className="text-right">
                <div className="text-xs text-cyan-200/80 font-medium">
                  إجمالي
                </div>
                <div className="text-xs text-cyan-200/60">الصيدليات</div>
              </div>
            </div>
            <div className="text-3xl font-black text-white mb-2 group-hover:text-cyan-100 transition-colors">
              {stats.pharmacies}
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-cyan-300 rounded-full animate-pulse"></div>
              <div className="text-xs text-cyan-200/80">نشط</div>
            </div>
          </div>
        </motion.div>

        {/* Pharmacists Card */}
        <motion.div
          className="relative overflow-hidden bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl shadow-2xl border border-emerald-500/30 group"
          whileHover={{ scale: 1.05, y: -5 }}
          transition={{ duration: 0.3 }}
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-400/10 rounded-full -translate-y-10 translate-x-10"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-emerald-400/5 rounded-full translate-y-8 -translate-x-8"></div>
          <div className="relative p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Users size={24} className="text-white" />
              </div>
              <div className="text-right">
                <div className="text-xs text-emerald-200/80 font-medium">
                  إجمالي
                </div>
                <div className="text-xs text-emerald-200/60">الصيادلة</div>
              </div>
            </div>
            <div className="text-3xl font-black text-white mb-2 group-hover:text-emerald-100 transition-colors">
              {stats.pharmacists}
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-300 rounded-full animate-pulse"></div>
              <div className="text-xs text-emerald-200/80">مسجل</div>
            </div>
          </div>
        </motion.div>

        {/* Senior Pharmacists Card */}
        <motion.div
          className="relative overflow-hidden bg-gradient-to-br from-amber-600 to-amber-700 rounded-2xl shadow-2xl border border-amber-500/30 group"
          whileHover={{ scale: 1.05, y: -5 }}
          transition={{ duration: 0.3 }}
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-400/10 rounded-full -translate-y-10 translate-x-10"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-amber-400/5 rounded-full translate-y-8 -translate-x-8"></div>
          <div className="relative p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Crown size={24} className="text-white" />
              </div>
              <div className="text-right">
                <div className="text-xs text-amber-200/80 font-medium">
                  كبار
                </div>
                <div className="text-xs text-amber-200/60">الصيادلة</div>
              </div>
            </div>
            <div className="text-3xl font-black text-white mb-2 group-hover:text-amber-100 transition-colors">
              {stats.seniors}
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-amber-300 rounded-full animate-pulse"></div>
              <div className="text-xs text-amber-200/80">خبراء</div>
            </div>
          </div>
        </motion.div>

        {/* Today's Attendance Card */}
        <motion.div
          className="relative overflow-hidden bg-gradient-to-br from-rose-600 to-rose-700 rounded-2xl shadow-2xl border border-rose-500/30 group"
          whileHover={{ scale: 1.05, y: -5 }}
          transition={{ duration: 0.3 }}
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-rose-400/10 rounded-full -translate-y-10 translate-x-10"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-rose-400/5 rounded-full translate-y-8 -translate-x-8"></div>
          <div className="relative p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Calendar size={24} className="text-white" />
              </div>
              <div className="text-right">
                <div className="text-xs text-rose-200/80 font-medium">
                  الحضور
                </div>
                <div className="text-xs text-rose-200/60">اليوم</div>
              </div>
            </div>
            <div className="text-3xl font-black text-white mb-2 group-hover:text-rose-100 transition-colors">
              {stats.present + stats.absent > 0
                ? `${stats.present}/${stats.present + stats.absent}`
                : "0/0"}
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-rose-300 rounded-full animate-pulse"></div>
              <div className="text-xs text-rose-200/80">
                {stats.present + stats.absent > 0
                  ? `${Math.round(
                      (stats.present / (stats.present + stats.absent)) * 100
                    )}%`
                  : "0%"}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Enhanced Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <motion.button
          className="group relative overflow-hidden bg-gradient-to-br from-purple-600 to-fuchsia-600 text-white p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 border border-purple-500/30"
          onClick={() => navigate("/lead/pharmacies")}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10 group-hover:scale-110 transition-transform duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Store size={20} className="text-white" />
              </div>
              <div className="text-right">
                <div className="text-lg font-bold">إدارة الصيدليات</div>
                <div className="text-sm text-purple-200/80">
                  عرض وإدارة جميع الصيدليات
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <ArrowRight
                size={20}
                className="text-white/80 group-hover:translate-x-1 transition-transform"
              />
              <div className="text-sm text-purple-200/60">انقر للعرض</div>
            </div>
          </div>
        </motion.button>

        <motion.button
          className="group relative overflow-hidden bg-gradient-to-br from-emerald-600 to-teal-600 text-white p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 border border-emerald-500/30"
          onClick={() => navigate("/lead/pharmacists")}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10 group-hover:scale-110 transition-transform duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Users size={20} className="text-white" />
              </div>
              <div className="text-right">
                <div className="text-lg font-bold">إدارة الصيادلة</div>
                <div className="text-sm text-emerald-200/80">
                  إضافة وإدارة الصيادلة
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <ArrowRight
                size={20}
                className="text-white/80 group-hover:translate-x-1 transition-transform"
              />
              <div className="text-sm text-emerald-200/60">انقر للعرض</div>
            </div>
          </div>
        </motion.button>

        <motion.button
          className="group relative overflow-hidden bg-gradient-to-br from-amber-600 to-orange-600 text-white p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 border border-amber-500/30"
          onClick={() => navigate("/lead/attendance")}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10 group-hover:scale-110 transition-transform duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Calendar size={20} className="text-white" />
              </div>
              <div className="text-right">
                <div className="text-lg font-bold">مراقبة الحضور</div>
                <div className="text-sm text-amber-200/80">
                  تتبع حضور الصيادلة
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <ArrowRight
                size={20}
                className="text-white/80 group-hover:translate-x-1 transition-transform"
              />
              <div className="text-sm text-amber-200/60">انقر للعرض</div>
            </div>
          </div>
        </motion.button>
      </div>
    </div>
  );
}
