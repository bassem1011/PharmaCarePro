import React, { useEffect } from "react";

export default function Toast({
  message,
  type = "info",
  onClose,
  duration = 3500,
}) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose && onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  let bg, border, icon;
  switch (type) {
    case "success":
      bg = "bg-green-600 text-white";
      border = "border-green-700";
      icon = "✅";
      break;
    case "error":
      bg = "bg-red-600 text-white";
      border = "border-red-700";
      icon = "❌";
      break;
    case "info":
    default:
      bg = "bg-blue-600 text-white";
      border = "border-blue-700";
      icon = "ℹ️";
      break;
  }

  return (
    <div
      className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-xl shadow-lg border-2 ${bg} ${border} flex items-center gap-3 animate-toast-in`}
      role="alert"
      style={{ minWidth: 220 }}
    >
      <span className="text-2xl">{icon}</span>
      <span className="font-bold text-lg">{message}</span>
      <button
        onClick={onClose}
        className="ml-4 text-white hover:text-gray-200 text-xl font-bold focus:outline-none"
        aria-label="إغلاق التنبيه"
      >
        ×
      </button>
      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateY(-20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-toast-in { animation: toast-in 0.3s cubic-bezier(.4,0,.2,1); }
      `}</style>
    </div>
  );
}
