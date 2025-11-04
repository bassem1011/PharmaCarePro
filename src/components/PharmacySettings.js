import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useToast } from "../App";
import {
  updatePharmacySettings,
  getPharmacySettings,
} from "../utils/firestoreService";
import { Settings, Save, X } from "lucide-react";

const PharmacySettings = ({ pharmacyId, onClose }) => {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    enableDispenseCategories: false,
    enableCostCalculationToggle: false,
    dispenseCategories: {
      patient: "منصرف للمريض",
      scissors: "منصرف للمقص",
    },
  });

  useEffect(() => {
    const loadSettings = async () => {
    try {
      setLoading(true);
      const pharmacySettings = await getPharmacySettings(pharmacyId);
      if (pharmacySettings) {
        setSettings(pharmacySettings);
      }
    } catch (error) {
      console.error("Error loading pharmacy settings:", error);
      toast("فشل تحميل إعدادات الصيدلية", "error");
    } finally {
      setLoading(false);
    }
    };
    
    loadSettings();
  }, [pharmacyId, toast]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await updatePharmacySettings(pharmacyId, settings);
      toast("تم حفظ الإعدادات بنجاح!", "success");
      onClose();
    } catch (error) {
      console.error("Error saving pharmacy settings:", error);
      toast("فشل حفظ الإعدادات", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (setting) => {
    setSettings((prev) => ({
      ...prev,
      [setting]: !prev[setting],
    }));
  };

  const handleCategoryChange = (category, value) => {
    setSettings((prev) => ({
      ...prev,
      dispenseCategories: {
        ...prev.dispenseCategories,
        [category]: value,
      },
    }));
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">جاري تحميل الإعدادات...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings className="w-6 h-6" />
              <h2 className="text-2xl font-bold">إعدادات الصيدلية</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Dispense Categories Toggle */}
          <div className="bg-gray-50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-800">
                  فصل أنواع المنصرف
                </h3>
                <p className="text-sm text-gray-600">
                  فصل المنصرف إلى "منصرف للمريض" و "منصرف للمقص"
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enableDispenseCategories}
                  onChange={() => handleToggle("enableDispenseCategories")}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            {settings.enableDispenseCategories && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    اسم منصرف المريض
                  </label>
                  <input
                    type="text"
                    value={settings.dispenseCategories.patient}
                    onChange={(e) =>
                      handleCategoryChange("patient", e.target.value)
                    }
                    className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-500"
                    placeholder="منصرف للمريض"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    اسم منصرف المقص
                  </label>
                  <input
                    type="text"
                    value={settings.dispenseCategories.scissors}
                    onChange={(e) =>
                      handleCategoryChange("scissors", e.target.value)
                    }
                    className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-500"
                    placeholder="منصرف للمقص"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Cost Calculation Toggle */}
          <div className="bg-gray-50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-800">
                  تبديل حساب التكلفة
                </h3>
                <p className="text-sm text-gray-600">
                  إمكانية اختيار ما إذا كان المنصرف سيُحسب في التكلفة أم لا
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enableCostCalculationToggle}
                  onChange={() => handleToggle("enableCostCalculationToggle")}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="text-blue-600 text-xl">ℹ️</div>
              <div>
                <h4 className="font-bold text-blue-800 mb-2">معلومات مهمة</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• هذه الإعدادات ستؤثر على جميع الأصناف في الصيدلية</li>
                  <li>• يمكن تغيير الإعدادات في أي وقت</li>
                  <li>• البيانات السابقة ستبقى كما هي</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-2xl flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg font-bold hover:bg-gray-50 transition-colors"
          >
            إلغاء
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-bold hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                جاري الحفظ...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                حفظ الإعدادات
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default PharmacySettings;
