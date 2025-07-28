import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import { logout as firebaseLogout } from "../utils/authService";
import { motion, AnimatePresence } from "framer-motion";
import { useSidebar } from "./SidebarContext";
import {
  Building2,
  User2,
  CalendarDays,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Home,
} from "lucide-react";

const navLinks = [
  {
    name: "الرئيسية",
    path: "/lead/home",
    icon: <Home size={20} />,
    description: "لوحة التحكم الرئيسية",
  },
  {
    name: "الصيدليات",
    path: "/lead/pharmacies",
    icon: <Building2 size={20} />,
    description: "إدارة الصيدليات والمراقبة",
  },
  {
    name: "الصيادلة",
    path: "/lead/pharmacists",
    icon: <User2 size={20} />,
    description: "إدارة الصيادلة والتعيينات",
  },
  {
    name: "الحضور",
    path: "/lead/attendance",
    icon: <CalendarDays size={20} />,
    description: "مراقبة الحضور اليومي",
  },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    sidebarCollapsed,
    mobileOpen,
    toggleSidebar,
    toggleMobile,
    closeMobile,
  } = useSidebar();
  const [isHovering, setIsHovering] = useState(false);

  // Auto-collapse on mobile when screen size changes
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        // Reset sidebar state on mobile
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogout = async () => {
    const auth = getAuth();
    if (auth.currentUser) {
      await firebaseLogout();
      navigate("/login");
    } else if (localStorage.getItem("pharmaUser")) {
      localStorage.removeItem("pharmaUser");
      navigate("/login");
    }
  };

  const sidebarVariants = {
    expanded: {
      width: 256,
      transition: {
        duration: 0.3,
        ease: "easeInOut",
      },
    },
    collapsed: {
      width: 80,
      transition: {
        duration: 0.3,
        ease: "easeInOut",
      },
    },
  };

  const contentVariants = {
    expanded: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.2,
        delay: 0.1,
      },
    },
    collapsed: {
      opacity: 0,
      x: -20,
      transition: {
        duration: 0.2,
      },
    },
  };

  const mobileVariants = {
    open: {
      x: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
      },
    },
    closed: {
      x: "100%",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
      },
    },
  };

  return (
    <>
      {/* Enhanced Hamburger for mobile */}
      <motion.button
        className="md:hidden fixed top-4 right-4 z-50 bg-gradient-to-r from-purple-700 to-fuchsia-600 text-white p-3 rounded-xl shadow-2xl focus:outline-none"
        onClick={toggleMobile}
        aria-label="Toggle sidebar"
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.9 }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <AnimatePresence mode="wait">
          {mobileOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X size={24} />
            </motion.div>
          ) : (
            <motion.div
              key="menu"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Menu size={24} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Enhanced Sidebar */}
      <motion.aside
        className={`
          font-sans
          fixed md:static top-0 right-0 z-40 h-full md:h-auto
          bg-gray-950 border-l-2 border-fuchsia-700 flex flex-col min-h-screen
          shadow-2xl backdrop-blur-sm
          ${mobileOpen ? "translate-x-0" : "translate-x-full md:translate-x-0"}
        `}
        variants={sidebarVariants}
        animate={sidebarCollapsed ? "collapsed" : "expanded"}
        style={{ minWidth: sidebarCollapsed ? 80 : 256 }}
        dir="rtl"
        onHoverStart={() => setIsHovering(true)}
        onHoverEnd={() => setIsHovering(false)}
      >
        {/* Enhanced Header */}
        <motion.div
          className="flex items-center gap-3 px-6 py-6 border-b border-fuchsia-700/50"
          variants={contentVariants}
          animate={sidebarCollapsed ? "collapsed" : "expanded"}
        >
          <div className="flex items-center gap-3">
            <motion.span
              className="inline-block w-10 h-10 bg-gradient-to-r from-purple-700 to-fuchsia-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg"
              whileHover={{ scale: 1.1, rotate: 360 }}
              transition={{ duration: 0.3 }}
            >
              💊
            </motion.span>
            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-purple-400">
                    فارماكير برو
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Enhanced Collapse button for desktop */}
          <motion.button
            className="mr-auto hidden md:flex items-center justify-center p-2 rounded-lg hover:bg-gray-900/50 transition-colors"
            onClick={toggleSidebar}
            aria-label="Collapse sidebar"
            whileHover={{
              scale: 1.1,
              backgroundColor: "rgba(139, 92, 246, 0.1)",
            }}
            whileTap={{ scale: 0.9 }}
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
                  <ChevronRight size={20} className="text-fuchsia-400" />
                </motion.div>
              ) : (
                <motion.div
                  key="collapse"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronLeft size={20} className="text-fuchsia-400" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </motion.div>

        {/* Enhanced Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-3">
          {navLinks.map((link, index) => (
            <motion.div
              key={link.path}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link
                to={link.path}
                className={`group relative flex items-center gap-3 px-4 py-4 rounded-xl font-medium transition-all duration-300 font-sans text-base
                  ${sidebarCollapsed ? "justify-center px-2" : ""}
                  ${
                    location.pathname.startsWith(link.path)
                      ? "bg-gradient-to-r from-purple-700 to-fuchsia-600 text-white shadow-lg"
                      : "text-fuchsia-400 hover:bg-gray-900/50 hover:text-white"
                  }
                `}
                title={sidebarCollapsed ? link.name : link.description}
                onClick={closeMobile}
              >
                {/* Hover effect background */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-fuchsia-600/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Icon with animation */}
                <motion.div
                  className="relative z-10"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {link.icon}
                </motion.div>

                {/* Text with slide animation */}
                <AnimatePresence>
                  {!sidebarCollapsed && (
                    <motion.div
                      className="relative z-10"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <span>{link.name}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Active indicator */}
                {location.pathname.startsWith(link.path) && (
                  <motion.div
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-fuchsia-400 rounded-r-full"
                    layoutId="activeIndicator"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </Link>
            </motion.div>
          ))}
        </nav>

        {/* Enhanced Footer */}
        <motion.div
          className="mt-auto px-6 pb-6 space-y-3"
          variants={contentVariants}
          animate={sidebarCollapsed ? "collapsed" : "expanded"}
        >
          {/* Enhanced Logout Button */}
          <motion.button
            onClick={handleLogout}
            className="w-full bg-gradient-to-r from-red-600 to-pink-600 text-white py-4 rounded-xl hover:from-red-700 hover:to-pink-700 font-bold font-sans transition-all duration-300 shadow-lg hover:shadow-red-500/25 flex items-center justify-center gap-3"
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <LogOut size={18} />
            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  تسجيل الخروج
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </motion.div>
      </motion.aside>

      {/* Enhanced Overlay for mobile */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeMobile}
          />
        )}
      </AnimatePresence>
    </>
  );
}
