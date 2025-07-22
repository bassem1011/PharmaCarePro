import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HomeIcon,
  ChartBarIcon,
  ClipboardListIcon,
  DocumentReportIcon,
  CogIcon,
  MenuIcon,
  XIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/outline";

const ICONS = {
  dashboard: HomeIcon,
  dispense: ClipboardListIcon,
  incoming: DocumentReportIcon,
  stock: ChartBarIcon,
  transfer: CogIcon,
  report: ChartBarIcon,
  chart: ChartBarIcon,
  custom: HomeIcon,
};

const TAB_COLORS = {
  dashboard: "from-cyan-500 to-cyan-600",
  dispense: "from-blue-500 to-blue-600",
  incoming: "from-green-500 to-green-600",
  stock: "from-yellow-500 to-yellow-600",
  transfer: "from-orange-500 to-orange-600",
  report: "from-purple-500 to-purple-600",
  chart: "from-indigo-500 to-indigo-600",
  custom: "from-pink-500 to-pink-600",
};

const Sidebar = ({
  tabs,
  activeTab,
  setActiveTab,
  collapsed,
  setCollapsed,
  mobileDrawer,
  setMobileDrawer,
}) => {
  // Responsive: show drawer on mobile
  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) setCollapsed(true);
      else setCollapsed(false);
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, [setCollapsed]);

  // Show FAB to open sidebar if collapsed/hidden
  const showFab = collapsed && !mobileDrawer;

  return (
    <>
      {/* Mobile Drawer Button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <motion.button
          onClick={() => setMobileDrawer(true)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-3 rounded-full shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-400 transition-all duration-200"
          aria-label="فتح القائمة"
        >
          <MenuIcon className="h-6 w-6" />
        </motion.button>
      </div>

      {/* Sidebar (desktop) */}
      <AnimatePresence>
        {(!collapsed || mobileDrawer) && (
          <motion.aside
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
              duration: 0.3,
            }}
            className={`fixed top-0 left-0 h-full z-40 bg-white dark:bg-gray-900 shadow-2xl border-r border-gray-200 dark:border-gray-700 w-72 md:w-64 flex flex-col pt-8 px-4 md:relative md:translate-x-0 md:opacity-100 ${
              mobileDrawer ? "" : "hidden md:flex"
            }`}
            style={{ minHeight: "100vh" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <span className="text-2xl">💊</span>
                <span className="text-lg font-bold text-gray-800 dark:text-gray-200 font-[Cairo]">
                  Pharma
                </span>
              </div>
              <button
                onClick={() => setMobileDrawer(false)}
                className="md:hidden bg-gray-200 dark:bg-gray-700 p-2 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                aria-label="إغلاق القائمة"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Tab Cards */}
            <nav className="flex flex-col gap-3 flex-1">
              {tabs.map((tab) => {
                const Icon = ICONS[tab.key] || HomeIcon;
                const isActive = activeTab === tab.key;
                const colorClass =
                  TAB_COLORS[tab.key] || "from-gray-500 to-gray-600";

                return (
                  <motion.button
                    key={tab.key}
                    onClick={() => {
                      setActiveTab(tab.key);
                      setMobileDrawer(false);
                    }}
                    whileHover={{
                      scale: 1.02,
                      boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
                    }}
                    whileTap={{ scale: 0.98 }}
                    className={`group flex items-center gap-4 px-4 py-4 rounded-xl shadow-lg font-bold text-lg transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-400 font-[Cairo] relative overflow-hidden ${
                      isActive
                        ? `bg-gradient-to-r ${colorClass} text-white shadow-xl`
                        : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600"
                    }`}
                    style={{
                      backdropFilter: "blur(10px)",
                    }}
                    tabIndex={0}
                    aria-label={tab.label}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {/* Active indicator */}
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"
                        initial={false}
                        transition={{
                          type: "spring",
                          stiffness: 500,
                          damping: 30,
                        }}
                      />
                    )}

                    {/* Icon */}
                    <div
                      className={`relative z-10 p-2 rounded-lg ${
                        isActive
                          ? "bg-white/20"
                          : "bg-gray-100 dark:bg-gray-700 group-hover:bg-blue-100 dark:group-hover:bg-blue-900"
                      }`}
                    >
                      <Icon
                        className={`h-6 w-6 ${
                          isActive
                            ? "text-white"
                            : "text-gray-600 dark:text-gray-400"
                        }`}
                      />
                    </div>

                    {/* Label */}
                    <span
                      className={`relative z-10 truncate text-lg font-extrabold tracking-wide leading-relaxed ${
                        isActive
                          ? "text-white"
                          : "text-gray-800 dark:text-gray-200"
                      }`}
                    >
                      {tab.label}
                    </span>

                    {/* Hover effect */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100"
                      initial={false}
                      transition={{ duration: 0.2 }}
                    />
                  </motion.button>
                );
              })}
            </nav>

            {/* Footer */}
            <div className="mt-auto pb-6">
              {/* Collapse Button (desktop) */}
              <div className="hidden md:block">
                <motion.button
                  onClick={() => setCollapsed((c) => !c)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full bg-gray-100 dark:bg-gray-800 p-3 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-600"
                  title="إخفاء القائمة"
                  aria-label="إخفاء القائمة"
                >
                  <ChevronLeftIcon className="h-5 w-5 mx-auto text-gray-600 dark:text-gray-400" />
                </motion.button>
              </div>

              {/* Version info */}
              <div className="text-center mt-4 text-xs text-gray-500 dark:text-gray-400 font-[Cairo]">
                v1.0.0
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Floating Action Button to show sidebar again */}
      {showFab && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setCollapsed(false)}
          className="fixed top-4 right-4 z-50 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-full shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-400 transition-all duration-200"
          title="إظهار القائمة"
          aria-label="إظهار القائمة"
        >
          <ChevronRightIcon className="h-6 w-6" />
        </motion.button>
      )}
    </>
  );
};

export default Sidebar;
