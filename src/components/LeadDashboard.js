import React from "react";
import { motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import Sidebar from "./Sidebar";
import { Outlet } from "react-router-dom";
import { useSidebar } from "./SidebarContext";
import { AnimatePresence } from "framer-motion";

export default function LeadDashboard() {
  const { sidebarCollapsed, toggleSidebar } = useSidebar();

  return (
    <div className="flex min-h-screen bg-gray-900">
      <Sidebar />
      <main className="flex-1 p-6 overflow-y-auto relative">
        {/* Sidebar Toggle Button */}
        <motion.button
          className="fixed top-4 left-4 z-50 bg-gradient-to-r from-purple-700 to-fuchsia-600 text-white p-3 rounded-xl shadow-2xl focus:outline-none md:hidden"
          onClick={toggleSidebar}
          whileHover={{ scale: 1.1, rotate: 5 }}
          whileTap={{ scale: 0.9 }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <AnimatePresence mode="wait">
            {sidebarCollapsed ? (
              <motion.div
                key="menu"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Menu size={24} />
              </motion.div>
            ) : (
              <motion.div
                key="close"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <X size={24} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>

        {/* Desktop Sidebar Toggle */}
        <motion.button
          className="hidden md:flex fixed top-4 left-4 z-50 bg-gradient-to-r from-purple-700 to-fuchsia-600 text-white p-3 rounded-xl shadow-2xl focus:outline-none"
          onClick={toggleSidebar}
          whileHover={{ scale: 1.1, rotate: 5 }}
          whileTap={{ scale: 0.9 }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <AnimatePresence mode="wait">
            {sidebarCollapsed ? (
              <motion.div
                key="expand"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Menu size={20} />
              </motion.div>
            ) : (
              <motion.div
                key="collapse"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <X size={20} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>

        <Outlet />
      </main>
    </div>
  );
}
