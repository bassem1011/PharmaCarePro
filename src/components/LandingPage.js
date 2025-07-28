import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  BarChart3,
  Users,
  Smartphone,
  Clock,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  Database,
  Menu,
  X,
  ArrowRight,
  Star,
  DollarSign,
} from "lucide-react";

// Scroll animation hook
const useScrollAnimation = () => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new window.IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  return [ref, isVisible];
};

const LandingPage = ({ goToLogin, goToSignUp }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [billingCycle, setBillingCycle] = useState("monthly"); // monthly or annual
  const [heroRef, heroVisible] = useScrollAnimation();
  const [statsRef, statsVisible] = useScrollAnimation();
  const [featuresRef, featuresVisible] = useScrollAnimation();
  const [benefitsRef, benefitsVisible] = useScrollAnimation();
  const [pricingRef, pricingVisible] = useScrollAnimation();
  const [testimonialsRef, testimonialsVisible] = useScrollAnimation();
  const [ctaRef, ctaVisible] = useScrollAnimation();

  const pricingPlans = [
    {
      name: "الخطة المجانية",
      icon: "🎁",
      price: { monthly: 0, annual: 0 },
      description: "مثالية للصيدليات الصغيرة للبدء",
      features: [
        "صيدلية واحدة",
        "20 حساب صيدلي",
        "إدارة المخزون الأساسية",
        "التقارير اليومية",
        "دعم البريد الإلكتروني",
        "تحديثات النظام",
      ],
      limitations: [
        "لا تتضمن المميزات المتقدمة",
        "تقارير محدودة",
        "دعم فني أساسي",
      ],
      popular: false,
      gradient: "from-gray-500 to-gray-600",
      buttonText: "ابدأ مجاناً",
      buttonAction: goToSignUp,
    },
    {
      name: "الخطة الاحترافية",
      icon: "⚡",
      price: { monthly: 200, annual: 2160 }, // 200 * 12 * 0.9 (10% discount)
      description: "مثالية للصيدليات المتوسطة والمتعددة",
      features: [
        "3 صيدليات",
        "50 حساب صيدلي",
        "جميع مميزات الخطة المجانية",
        "التقارير المتقدمة",
        "تحليلات الاستهلاك",
        "تنبيهات المخزون الذكية",
        "دعم فني متقدم",
        "نسخ احتياطية تلقائية",
        "واجهة API",
        "تصدير البيانات",
      ],
      limitations: [],
      popular: true,
      gradient: "from-purple-500 to-fuchsia-600",
      buttonText: "ابدأ التجربة المجانية",
      buttonAction: goToSignUp,
    },
    {
      name: "الخطة الشاملة",
      icon: "👑",
      price: { monthly: 500, annual: 5400 }, // 500 * 12 * 0.9 (10% discount)
      description: "مثالية للشبكات الكبيرة والمستشفيات",
      features: [
        "صيدليات غير محدودة",
        "صيادلة غير محدودين",
        "جميع مميزات الخطة الاحترافية",
        "لوحة تحكم متقدمة",
        "إدارة متعددة المستويات",
        "تقارير مخصصة",
        "تكامل مع الأنظمة الخارجية",
        "دعم فني مخصص 24/7",
        "تدريب مخصص",
        "إعداد مخصص",
        "أولوية في التحديثات",
        "مدير حساب مخصص",
      ],
      limitations: [],
      popular: false,
      gradient: "from-yellow-500 to-orange-600",
      buttonText: "تواصل معنا",
      buttonAction: () => window.open("mailto:sales@pharmacare.com", "_blank"),
    },
  ];

  const features = [
    {
      icon: Users,
      title: "إدارة متعددة الأدوار",
      description:
        "يمكن للمسؤولين إدارة عدة فروع بينما يدير الصيادلة العمليات اليومية مع صلاحيات مخصصة.",
      gradient: "from-blue-500 to-cyan-500",
      stats: "99.9%",
      label: "موثوقية النظام",
    },
    {
      icon: BarChart3,
      title: "تحليلات فورية",
      description:
        "تتبع الصرف اليومي، المخزون الوارد، واتجاهات الاستهلاك مع تقارير شهرية وربع سنوية شاملة.",
      gradient: "from-purple-500 to-pink-500",
      stats: "24/7",
      label: "مراقبة مستمرة",
    },
    {
      icon: AlertTriangle,
      title: "تنبيهات المخزون الحرجة",
      description:
        "لا تقلق من نفاد الأدوية الأساسية مع مراقبة ذكية وحد تنبيه فوري عند انخفاض المخزون.",
      gradient: "from-orange-500 to-red-500",
      stats: "0",
      label: "نفاد المخزون",
    },
    {
      icon: Smartphone,
      title: "الوصول من أي مكان",
      description:
        "إدارة المخزون من لوحة التحكم على الويب أو التطبيق، لضمان سهولة الوصول على مدار الساعة.",
      gradient: "from-green-500 to-emerald-500",
      stats: "100%",
      label: "متوافق مع جميع الأجهزة",
    },
    {
      icon: Database,
      title: "تتبع شامل",
      description:
        "راقب تواريخ الانتهاء، أرقام الدُفعات، بيانات الموردين، وسجلات كاملة للامتثال التنظيمي.",
      gradient: "from-indigo-500 to-blue-500",
      stats: "∞",
      label: "سجلات غير محدودة",
    },
    {
      icon: Shield,
      title: "أمان متقدم",
      description:
        "حماية شاملة للبيانات مع تشفير متقدم ونسخ احتياطية تلقائية لضمان أمان معلوماتك.",
      gradient: "from-red-500 to-pink-500",
      stats: "256-bit",
      label: "تشفير متقدم",
    },
  ];

  const benefits = [
    {
      icon: TrendingUp,
      title: "زيادة الكفاءة",
      description: "تحسين العمليات بنسبة 300% مع تقليل الأخطاء البشرية",
      color: "text-green-400",
    },
    {
      icon: Clock,
      title: "توفير الوقت",
      description: "توفير 8 ساعات يومياً في إدارة المخزون والتقارير",
      color: "text-blue-400",
    },
    {
      icon: DollarSign,
      title: "توفير التكاليف",
      description: "تقليل تكاليف المخزون بنسبة 25% مع تحسين التخطيط",
      color: "text-purple-400",
    },
    {
      icon: CheckCircle,
      title: "دقة عالية",
      description: "99.9% دقة في تتبع المخزون والتنبؤ بالاحتياجات",
      color: "text-orange-400",
    },
  ];

  const testimonials = [
    {
      name: "د. أحمد محمد",
      role: "مدير صيدلية المستلزمات",
      content:
        "فارماكير برو غير طريقة إدارتنا للمخزون تماماً. الآن نحن أكثر كفاءة وأقل توتراً.",
      rating: 5,
      avatar: "👨‍⚕️",
    },
    {
      name: "د. فاطمة علي",
      role: "صيدلي أول - صيدلية النور",
      content:
        "النظام سهل الاستخدام ويوفر لنا الوقت والجهد. التقارير مفصلة ومفيدة جداً.",
      rating: 5,
      avatar: "👩‍⚕️",
    },
    {
      name: "د. خالد عبدالله",
      role: "مدير شبكة صيدليات",
      content: "أفضل استثمار قمنا به. النظام يدير 5 فروع بسهولة وبدقة عالية.",
      rating: 5,
      avatar: "👨‍💼",
    },
  ];

  const stats = [
    { number: "500+", label: "صيدلية تستخدم النظام", icon: "🏥" },
    { number: "10,000+", label: "صيدلي نشط", icon: "👨‍⚕️" },
    { number: "1M+", label: "معاملة يومية", icon: "📊" },
    { number: "99.9%", label: "وقت تشغيل النظام", icon: "⚡" },
  ];

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"
      dir="rtl"
    >
      {/* Enhanced Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-gray-950/80 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                className="w-12 h-12 bg-gradient-to-r from-purple-700 to-fuchsia-600 rounded-xl flex items-center justify-center cursor-pointer"
                whileHover={{ scale: 1.1, rotate: 360 }}
                transition={{ duration: 0.3 }}
                onClick={() => (window.location.href = "/")}
              >
                <span className="text-white font-bold text-xl">💊</span>
              </motion.div>
              <span
                className="text-2xl font-black text-white cursor-pointer hover:text-fuchsia-400 transition-colors"
                onClick={() => (window.location.href = "/")}
              >
                فارماكير برو
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <a
                href="#features"
                className="text-gray-300 hover:text-white transition-colors"
              >
                المميزات
              </a>
              <a
                href="#benefits"
                className="text-gray-300 hover:text-white transition-colors"
              >
                الفوائد
              </a>
              <a
                href="#pricing"
                className="text-gray-300 hover:text-white transition-colors"
              >
                الأسعار
              </a>
              <a
                href="#testimonials"
                className="text-gray-300 hover:text-white transition-colors"
              >
                آراء العملاء
              </a>
            </div>

            <div className="flex items-center gap-4">
              <motion.button
                onClick={goToLogin}
                className="px-6 py-2 text-gray-300 hover:text-white transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                تسجيل الدخول
              </motion.button>
              <motion.button
                onClick={goToSignUp}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white rounded-xl hover:from-purple-700 hover:to-fuchsia-700 transition-all duration-300 font-bold shadow-lg hover:shadow-purple-500/25"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                البدء مجاناً
              </motion.button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-white"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Menu */}
          <motion.div
            className={`md:hidden ${isMenuOpen ? "block" : "hidden"}`}
            initial={{ opacity: 0, height: 0 }}
            animate={{
              opacity: isMenuOpen ? 1 : 0,
              height: isMenuOpen ? "auto" : 0,
            }}
            transition={{ duration: 0.3 }}
          >
            <div className="py-4 space-y-4 border-t border-gray-800 mt-4">
              <a
                href="#features"
                className="block text-gray-300 hover:text-white transition-colors"
              >
                المميزات
              </a>
              <a
                href="#benefits"
                className="block text-gray-300 hover:text-white transition-colors"
              >
                الفوائد
              </a>
              <a
                href="#pricing"
                className="block text-gray-300 hover:text-white transition-colors"
              >
                الأسعار
              </a>
              <a
                href="#testimonials"
                className="block text-gray-300 hover:text-white transition-colors"
              >
                آراء العملاء
              </a>
            </div>
          </motion.div>
        </div>
      </nav>

      {/* Enhanced Hero Section with Animated Background */}
      <section
        ref={heroRef}
        className="pt-32 pb-20 px-6 relative overflow-hidden"
      >
        {/* Animated Background Particles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-fuchsia-500/20 rounded-full"
              animate={{
                x: [0, 100, 0],
                y: [0, -100, 0],
                opacity: [0.2, 0.8, 0.2],
              }}
              transition={{
                duration: 10 + i * 0.5,
                repeat: Infinity,
                delay: i * 0.3,
              }}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
            />
          ))}
        </div>

        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={heroVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            <motion.div
              className="text-8xl mb-6"
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0],
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              💊
            </motion.div>
            <h1 className="text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 via-purple-400 to-pink-400 mb-6 leading-tight">
              فارماكير برو
            </h1>
            <p className="text-2xl md:text-3xl text-gray-300 mb-8 max-w-4xl mx-auto leading-relaxed">
              نظام إدارة الصيدليات المتقدم الذي يغير طريقة إدارة المخزون
              والتقارير
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <motion.button
                onClick={goToSignUp}
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white rounded-2xl hover:from-purple-700 hover:to-fuchsia-700 transition-all duration-300 font-bold text-xl shadow-2xl hover:shadow-purple-500/25 flex items-center gap-3 group"
                whileHover={{ scale: 1.05, y: -3 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="group-hover:animate-bounce">🚀</span>
                <span>ابدأ مجاناً الآن</span>
                <ArrowRight
                  size={24}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </motion.button>
              <motion.button
                onClick={goToLogin}
                className="px-8 py-4 border-2 border-fuchsia-600 text-fuchsia-400 rounded-2xl hover:bg-fuchsia-600 hover:text-white transition-all duration-300 font-bold text-xl"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                تسجيل الدخول
              </motion.button>
            </div>
          </motion.div>

          {/* Floating Stats with Enhanced Animations */}
          <motion.div
            ref={statsRef}
            initial={{ opacity: 0, y: 50 }}
            animate={statsVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                className="bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 rounded-2xl p-6 border border-fuchsia-700/50 backdrop-blur-sm group"
                whileHover={{
                  scale: 1.05,
                  y: -5,
                  rotateY: 5,
                  boxShadow: "0 20px 40px rgba(168, 85, 247, 0.3)",
                }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <div className="text-3xl mb-2 group-hover:scale-110 transition-transform duration-300">
                  {stat.icon}
                </div>
                <div className="text-3xl font-black text-fuchsia-400 mb-2 group-hover:text-fuchsia-300 transition-colors">
                  {stat.number}
                </div>
                <div className="text-gray-400 text-sm group-hover:text-gray-300 transition-colors">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Enhanced Features Section with 3D Effects */}
      <section
        id="features"
        ref={featuresRef}
        className="py-20 px-6 bg-gray-950/50"
      >
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={featuresVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-purple-400 mb-6">
              مميزات متقدمة
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              اكتشف كيف يمكن لفارماكير برو أن يحول إدارة صيدليتك إلى تجربة سلسة
              ومتطورة
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={featuresVisible ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="group"
              >
                <div className="bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 rounded-2xl p-8 border border-gray-800 hover:border-fuchsia-700/50 transition-all duration-300 h-full relative overflow-hidden">
                  {/* Animated background gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                  <div
                    className={`w-16 h-16 bg-gradient-to-r ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 relative z-10`}
                  >
                    <feature.icon size={32} className="text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4 relative z-10">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 mb-6 leading-relaxed relative z-10">
                    {feature.description}
                  </p>
                  <div className="flex items-center justify-between relative z-10">
                    <div className="text-3xl font-black text-fuchsia-400 group-hover:text-fuchsia-300 transition-colors">
                      {feature.stats}
                    </div>
                    <div className="text-sm text-gray-500 group-hover:text-gray-400 transition-colors">
                      {feature.label}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Benefits Section with Floating Elements */}
      <section
        id="benefits"
        ref={benefitsRef}
        className="py-20 px-6 relative overflow-hidden"
      >
        {/* Floating background elements */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-green-500/20 rounded-full"
              animate={{
                x: [0, 50, 0],
                y: [0, -50, 0],
                opacity: [0.1, 0.5, 0.1],
              }}
              transition={{
                duration: 8 + i * 0.5,
                repeat: Infinity,
                delay: i * 0.2,
              }}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
            />
          ))}
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={benefitsVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400 mb-6">
              فوائد ملموسة
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              شاهد التحسينات الفورية في كفاءة صيدليتك وأرباحها
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={benefitsVisible ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center group"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-gray-950 to-gray-900 rounded-full flex items-center justify-center mx-auto mb-6 border border-fuchsia-700/50 group-hover:border-fuchsia-500 transition-colors duration-300 group-hover:scale-110 transition-transform duration-300">
                  <benefit.icon
                    size={40}
                    className={`${benefit.color} group-hover:scale-110 transition-transform duration-300`}
                  />
                </div>
                <h3 className="text-xl font-bold text-white mb-4 group-hover:text-fuchsia-300 transition-colors">
                  {benefit.title}
                </h3>
                <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors">
                  {benefit.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Pricing Section */}
      <section ref={pricingRef} className="py-20 px-6 bg-gray-950/50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={pricingVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400 mb-6">
              أسعارنا
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
              اختر الخطة التي تناسب احتياجاتك وابدأ رحلتك معنا
            </p>

            {/* Billing Cycle Toggle */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <span
                className={`text-lg font-bold transition-colors ${
                  billingCycle === "monthly" ? "text-white" : "text-gray-400"
                }`}
              >
                شهرياً
              </span>
              <motion.button
                onClick={() =>
                  setBillingCycle(
                    billingCycle === "monthly" ? "annual" : "monthly"
                  )
                }
                className={`relative w-16 h-8 rounded-full p-1 transition-colors ${
                  billingCycle === "annual" ? "bg-fuchsia-600" : "bg-gray-600"
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  className="w-6 h-6 bg-white rounded-full shadow-md"
                  animate={{ x: billingCycle === "annual" ? 32 : 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </motion.button>
              <span
                className={`text-lg font-bold transition-colors ${
                  billingCycle === "annual" ? "text-white" : "text-gray-400"
                }`}
              >
                سنوياً
                {billingCycle === "annual" && (
                  <span className="ml-2 inline-block bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                    خصم 10%
                  </span>
                )}
              </span>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={pricingVisible ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`relative bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 rounded-2xl p-8 border border-gray-800 hover:border-fuchsia-700/50 transition-all duration-300 h-full group ${
                  plan.popular ? "ring-2 ring-fuchsia-500/50 scale-105" : ""
                }`}
                whileHover={{
                  y: -10,
                  boxShadow: "0 20px 40px rgba(168, 85, 247, 0.2)",
                }}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white px-4 py-2 rounded-full text-sm font-bold">
                      الأكثر شعبية
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 mb-6">
                  <div
                    className={`text-4xl group-hover:scale-110 transition-transform duration-300`}
                  >
                    {plan.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
                </div>

                <div className="flex items-baseline gap-2 mb-6">
                  <span className="text-6xl font-bold text-fuchsia-400">
                    {billingCycle === "monthly"
                      ? `EGP ${plan.price.monthly}`
                      : `EGP ${plan.price.annual}`}
                  </span>
                  {billingCycle === "monthly" && (
                    <span className="text-gray-400 text-lg">/شهر</span>
                  )}
                  {billingCycle === "annual" && (
                    <span className="text-gray-400 text-lg">/سنة</span>
                  )}
                </div>

                {/* Money Savings Badge for Annual */}
                {billingCycle === "annual" && plan.price.monthly > 0 && (
                  <div className="mb-6">
                    <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-full text-sm font-bold inline-flex items-center gap-2">
                      <span>💰</span>
                      <span>
                        وفر {Math.round(plan.price.monthly * 12 * 0.1)} جنيه
                        سنوياً
                      </span>
                    </div>
                  </div>
                )}

                <p className="text-gray-400 mb-6 leading-relaxed">
                  {plan.description}
                </p>

                <ul className="space-y-3 mb-6 text-gray-300">
                  {plan.features.map((feature, fIndex) => (
                    <li
                      key={fIndex}
                      className="flex items-center gap-2 group/item"
                    >
                      <CheckCircle
                        size={20}
                        className="text-green-400 group-hover/item:scale-110 transition-transform"
                      />
                      <span className="group-hover/item:text-white transition-colors">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {plan.limitations.length > 0 && (
                  <ul className="space-y-3 text-gray-500 text-sm mb-6">
                    {plan.limitations.map((limitation, lIndex) => (
                      <li key={lIndex} className="flex items-center gap-2">
                        <span className="w-1 h-1 bg-gray-500 rounded-full"></span>
                        {limitation}
                      </li>
                    ))}
                  </ul>
                )}

                <motion.button
                  onClick={plan.buttonAction}
                  className={`mt-8 w-full px-6 py-3 rounded-xl text-white font-bold transition-all duration-300 ${
                    plan.popular
                      ? "bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 shadow-lg hover:shadow-purple-500/25"
                      : "bg-fuchsia-600 hover:bg-fuchsia-700"
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {plan.buttonText}
                </motion.button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Testimonials Section with Interactive Cards */}
      <section
        id="testimonials"
        ref={testimonialsRef}
        className="py-20 px-6 bg-gray-950/50 relative overflow-hidden"
      >
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(10)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-yellow-500/10 rounded-full"
              animate={{
                x: [0, 30, 0],
                y: [0, -30, 0],
                opacity: [0.1, 0.3, 0.1],
              }}
              transition={{
                duration: 6 + i * 0.5,
                repeat: Infinity,
                delay: i * 0.3,
              }}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
            />
          ))}
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={testimonialsVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400 mb-6">
              آراء عملائنا
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              انضم إلى آلاف الصيادلة الذين يثقون بفارماكير برو
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={testimonialsVisible ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="group"
              >
                <div className="bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 rounded-2xl p-8 border border-gray-800 hover:border-fuchsia-700/50 transition-all duration-300 h-full relative overflow-hidden">
                  {/* Animated background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                  <div className="flex items-center gap-3 mb-6 relative z-10">
                    <div className="text-4xl group-hover:scale-110 transition-transform duration-300">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-white group-hover:text-fuchsia-300 transition-colors">
                        {testimonial.name}
                      </h4>
                      <p className="text-gray-400 text-sm group-hover:text-gray-300 transition-colors">
                        {testimonial.role}
                      </p>
                    </div>
                  </div>
                  <p className="text-gray-300 mb-6 leading-relaxed relative z-10 group-hover:text-white transition-colors">
                    "{testimonial.content}"
                  </p>
                  <div className="flex gap-1 relative z-10">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                      >
                        <Star
                          size={20}
                          className="text-yellow-400 fill-current group-hover:scale-110 transition-transform duration-300"
                        />
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced CTA Section with Particle Effects */}
      <section ref={ctaRef} className="py-20 px-6 relative overflow-hidden">
        {/* Animated background particles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(25)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-fuchsia-500/30 rounded-full"
              animate={{
                x: [0, 100, 0],
                y: [0, -100, 0],
                opacity: [0.1, 0.8, 0.1],
              }}
              transition={{
                duration: 12 + i * 0.3,
                repeat: Infinity,
                delay: i * 0.2,
              }}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
            />
          ))}
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={ctaVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              className="text-6xl mb-6"
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 10, -10, 0],
              }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              🚀
            </motion.div>
            <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-purple-400 mb-6">
              ابدأ رحلتك اليوم
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              انضم إلى آلاف الصيادلة الذين يثقون بفارماكير برو لإدارة صيدلياتهم
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <motion.button
                onClick={goToSignUp}
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white rounded-2xl hover:from-purple-700 hover:to-fuchsia-700 transition-all duration-300 font-bold text-xl shadow-2xl hover:shadow-purple-500/25 flex items-center gap-3 group"
                whileHover={{ scale: 1.05, y: -3 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="group-hover:animate-bounce">🚀</span>
                <span>ابدأ مجاناً الآن</span>
                <ArrowRight
                  size={24}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </motion.button>
              <motion.button
                onClick={goToLogin}
                className="px-8 py-4 border-2 border-fuchsia-600 text-fuchsia-400 rounded-2xl hover:bg-fuchsia-600 hover:text-white transition-all duration-300 font-bold text-xl"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                تسجيل الدخول
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Enhanced Footer with Modern Design */}
      <footer className="bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 border-t border-gray-800 py-16 px-6 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-fuchsia-500/10 rounded-full"
              animate={{
                x: [0, 50, 0],
                y: [0, -50, 0],
                opacity: [0.1, 0.3, 0.1],
              }}
              transition={{
                duration: 8 + i * 0.5,
                repeat: Infinity,
                delay: i * 0.2,
              }}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
            />
          ))}
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Main Footer Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-12">
            {/* Company Info Section */}
            <div className="lg:col-span-1">
              <div className="flex items-center gap-4 mb-6">
                <motion.div
                  className="w-16 h-16 bg-gradient-to-r from-purple-700 to-fuchsia-600 rounded-2xl flex items-center justify-center shadow-lg"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ duration: 0.3 }}
                >
                  <span className="text-white font-bold text-2xl">💊</span>
                </motion.div>
                <div>
                  <h3 className="text-2xl font-black text-white mb-1">
                    فارماكير برو
                  </h3>
                  <p className="text-fuchsia-400 text-sm font-semibold">
                    نظام إدارة الصيدليات المتقدم
                  </p>
                </div>
              </div>
              <p className="text-gray-400 leading-relaxed mb-6 text-lg">
                نحن نغير طريقة إدارة الصيدليات من خلال تقنيات متقدمة وحلول ذكية
                تضمن الكفاءة والدقة في كل عملية.
              </p>

              {/* Social Media Links */}
              <div className="flex items-center gap-4">
                <motion.a
                  href="#"
                  className="w-12 h-12 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl flex items-center justify-center text-white hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-blue-500/25"
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="text-xl font-bold">F</span>
                </motion.a>
                <motion.a
                  href="#"
                  className="w-12 h-12 bg-gradient-to-r from-blue-400 to-blue-500 rounded-xl flex items-center justify-center text-white hover:from-blue-500 hover:to-blue-600 transition-all duration-300 shadow-lg hover:shadow-blue-400/25"
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="text-xl font-bold">T</span>
                </motion.a>
                <motion.a
                  href="#"
                  className="w-12 h-12 bg-gradient-to-r from-pink-600 to-pink-700 rounded-xl flex items-center justify-center text-white hover:from-pink-700 hover:to-pink-800 transition-all duration-300 shadow-lg hover:shadow-pink-500/25"
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="text-xl font-bold">I</span>
                </motion.a>
                <motion.a
                  href="#"
                  className="w-12 h-12 bg-gradient-to-r from-green-600 to-green-700 rounded-xl flex items-center justify-center text-white hover:from-green-700 hover:to-green-800 transition-all duration-300 shadow-lg hover:shadow-green-500/25"
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="text-xl font-bold">W</span>
                </motion.a>
              </div>
            </div>

            {/* Quick Links Section */}
            <div className="lg:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Features Links */}
                <div>
                  <h4 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
                    <span className="w-2 h-2 bg-fuchsia-500 rounded-full"></span>
                    المميزات
                  </h4>
                  <ul className="space-y-3">
                    <li>
                      <motion.a
                        href="#features"
                        className="text-gray-400 hover:text-fuchsia-400 transition-colors duration-300 flex items-center gap-2 group"
                        whileHover={{ x: -5 }}
                      >
                        <span className="w-1 h-1 bg-gray-500 rounded-full group-hover:bg-fuchsia-400 transition-colors"></span>
                        إدارة متعددة الأدوار
                      </motion.a>
                    </li>
                    <li>
                      <motion.a
                        href="#features"
                        className="text-gray-400 hover:text-fuchsia-400 transition-colors duration-300 flex items-center gap-2 group"
                        whileHover={{ x: -5 }}
                      >
                        <span className="w-1 h-1 bg-gray-500 rounded-full group-hover:bg-fuchsia-400 transition-colors"></span>
                        تحليلات فورية
                      </motion.a>
                    </li>
                    <li>
                      <motion.a
                        href="#features"
                        className="text-gray-400 hover:text-fuchsia-400 transition-colors duration-300 flex items-center gap-2 group"
                        whileHover={{ x: -5 }}
                      >
                        <span className="w-1 h-1 bg-gray-500 rounded-full group-hover:bg-fuchsia-400 transition-colors"></span>
                        تنبيهات المخزون
                      </motion.a>
                    </li>
                  </ul>
                </div>

                {/* Benefits Links */}
                <div>
                  <h4 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    الفوائد
                  </h4>
                  <ul className="space-y-3">
                    <li>
                      <motion.a
                        href="#benefits"
                        className="text-gray-400 hover:text-green-400 transition-colors duration-300 flex items-center gap-2 group"
                        whileHover={{ x: -5 }}
                      >
                        <span className="w-1 h-1 bg-gray-500 rounded-full group-hover:bg-green-400 transition-colors"></span>
                        زيادة الكفاءة
                      </motion.a>
                    </li>
                    <li>
                      <motion.a
                        href="#benefits"
                        className="text-gray-400 hover:text-green-400 transition-colors duration-300 flex items-center gap-2 group"
                        whileHover={{ x: -5 }}
                      >
                        <span className="w-1 h-1 bg-gray-500 rounded-full group-hover:bg-green-400 transition-colors"></span>
                        توفير الوقت
                      </motion.a>
                    </li>
                    <li>
                      <motion.a
                        href="#benefits"
                        className="text-gray-400 hover:text-green-400 transition-colors duration-300 flex items-center gap-2 group"
                        whileHover={{ x: -5 }}
                      >
                        <span className="w-1 h-1 bg-gray-500 rounded-full group-hover:bg-green-400 transition-colors"></span>
                        توفير التكاليف
                      </motion.a>
                    </li>
                  </ul>
                </div>

                {/* Pricing & Support Links */}
                <div>
                  <h4 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                    الأسعار والدعم
                  </h4>
                  <ul className="space-y-3">
                    <li>
                      <motion.a
                        href="#pricing"
                        className="text-gray-400 hover:text-yellow-400 transition-colors duration-300 flex items-center gap-2 group"
                        whileHover={{ x: -5 }}
                      >
                        <span className="w-1 h-1 bg-gray-500 rounded-full group-hover:bg-yellow-400 transition-colors"></span>
                        خطط الأسعار
                      </motion.a>
                    </li>
                    <li>
                      <motion.a
                        href="#testimonials"
                        className="text-gray-400 hover:text-yellow-400 transition-colors duration-300 flex items-center gap-2 group"
                        whileHover={{ x: -5 }}
                      >
                        <span className="w-1 h-1 bg-gray-500 rounded-full group-hover:bg-yellow-400 transition-colors"></span>
                        آراء العملاء
                      </motion.a>
                    </li>
                    <li>
                      <motion.a
                        href="#"
                        className="text-gray-400 hover:text-yellow-400 transition-colors duration-300 flex items-center gap-2 group"
                        whileHover={{ x: -5 }}
                      >
                        <span className="w-1 h-1 bg-gray-500 rounded-full group-hover:bg-yellow-400 transition-colors"></span>
                        الدعم الفني
                      </motion.a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Copyright Section */}
          <div className="border-t border-gray-800 pt-8 text-center">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-gray-400">
                &copy; 2024 فارماكير برو. جميع الحقوق محفوظة.
              </p>
              <div className="flex items-center gap-6 text-sm text-gray-500">
                <a
                  href="#"
                  className="hover:text-fuchsia-400 transition-colors"
                >
                  سياسة الخصوصية
                </a>
                <a
                  href="#"
                  className="hover:text-fuchsia-400 transition-colors"
                >
                  شروط الاستخدام
                </a>
                <a
                  href="#"
                  className="hover:text-fuchsia-400 transition-colors"
                >
                  خريطة الموقع
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
