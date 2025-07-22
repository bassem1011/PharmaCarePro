import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { useEffect, useRef, useState } from "react";
import {
  Shield,
  BarChart3,
  Users,
  Smartphone,
  Clock,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  FileText,
  Zap,
  Globe,
  Database,
  Menu,
  X,
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

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);

  return [ref, isVisible];
};

const LandingPage = ({ goToLogin, goToSignUp }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [heroRef, heroVisible] = useScrollAnimation();
  const [statsRef, statsVisible] = useScrollAnimation();
  const [featuresRef, featuresVisible] = useScrollAnimation();
  const [benefitsRef, benefitsVisible] = useScrollAnimation();
  const [ctaRef, ctaVisible] = useScrollAnimation();

  const features = [
    {
      icon: Users,
      title: "Multi-Role Management",
      description:
        "Lead pharmacists oversee multiple locations while senior and regular pharmacists manage daily operations with role-based permissions.",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      icon: BarChart3,
      title: "Real-Time Analytics",
      description:
        "Track daily dispense, incoming stock, and consumption trends with comprehensive monthly and quarterly reports.",
      gradient: "from-purple-500 to-pink-500",
    },
    {
      icon: AlertTriangle,
      title: "Critical Stock Alerts",
      description:
        "Never run out of essential medications with smart threshold monitoring and instant low-stock notifications.",
      gradient: "from-orange-500 to-red-500",
    },
    {
      icon: Smartphone,
      title: "Cross-Platform Access",
      description:
        "Seamlessly manage inventory from web dashboard or mobile app, ensuring 24/7 accessibility for your team.",
      gradient: "from-green-500 to-emerald-500",
    },
    {
      icon: Database,
      title: "Comprehensive Tracking",
      description:
        "Monitor expiry dates, batch numbers, supplier information, and complete audit trails for regulatory compliance.",
      gradient: "from-indigo-500 to-blue-500",
    },
    {
      icon: Zap,
      title: "Smart Automation",
      description:
        "Automate data migration, generate custom reports, and streamline workflows with intelligent task delegation.",
      gradient: "from-yellow-500 to-orange-500",
    },
  ];

  const stats = [
    { number: "99.9%", label: "Uptime Guarantee", icon: Shield },
    { number: "50%", label: "Inventory Efficiency Boost", icon: TrendingUp },
    { number: "24/7", label: "Support & Monitoring", icon: Clock },
    { number: "100+", label: "Pharmacies Managed", icon: Globe },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-700 to-fuchsia-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">💊</span>
              </div>
              <span className="text-xl font-bold text-gray-900">
                PharmaCare Pro
              </span>
            </div>
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <a
                href="#features"
                className="hover:text-fuchsia-600 text-gray-900 transition-colors duration-300"
              >
                Features
              </a>
              <a
                href="#benefits"
                className="hover:text-fuchsia-600 text-gray-900 transition-colors duration-300"
              >
                Benefits
              </a>
              <a
                href="#pricing"
                className="hover:text-fuchsia-600 text-gray-900 transition-colors duration-300"
              >
                Pricing
              </a>
              <a
                href="#contact"
                className="hover:text-fuchsia-600 text-gray-900 transition-colors duration-300"
              >
                Contact
              </a>
            </div>
            {/* CTA Buttons */}
            <div className="hidden md:flex items-center gap-4">
              <Button
                variant="ghost"
                className="hover:text-fuchsia-600 text-gray-900"
                onClick={goToLogin}
              >
                Login
              </Button>
              <Button
                className="bg-gradient-to-r from-purple-700 to-fuchsia-600 text-white shadow-lg"
                onClick={goToSignUp}
              >
                Start Free Trial
              </Button>
            </div>
            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-200 bg-white">
              <div className="flex flex-col gap-4">
                <a
                  href="#features"
                  className="hover:text-fuchsia-600 text-gray-900 transition-colors duration-300"
                >
                  Features
                </a>
                <a
                  href="#benefits"
                  className="hover:text-fuchsia-600 text-gray-900 transition-colors duration-300"
                >
                  Benefits
                </a>
                <a
                  href="#pricing"
                  className="hover:text-fuchsia-600 text-gray-900 transition-colors duration-300"
                >
                  Pricing
                </a>
                <a
                  href="#contact"
                  className="hover:text-fuchsia-600 text-gray-900 transition-colors duration-300"
                >
                  Contact
                </a>
                <div className="flex flex-col gap-2 pt-4 border-t border-gray-200">
                  <Button
                    variant="ghost"
                    className="justify-start text-gray-900 hover:text-fuchsia-600"
                    onClick={goToLogin}
                  >
                    Login
                  </Button>
                  <Button
                    className="bg-gradient-to-r from-purple-700 to-fuchsia-600 text-white shadow-lg"
                    onClick={goToSignUp}
                  >
                    Start Free Trial
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>
      {/* Hero Section */}
      <section
        ref={heroRef}
        className="relative overflow-hidden pt-24 bg-white"
      >
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative container mx-auto px-4 py-24">
          <div className="text-center max-w-4xl mx-auto">
            <Badge
              className={`mb-6 text-sm px-4 py-2 bg-purple-100 text-fuchsia-600 border border-gray-200 transition-all duration-1000 ${
                heroVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-10"
              }`}
            >
              💊 Next-Generation Pharmacy Management
            </Badge>
            <h1
              className={`text-5xl md:text-7xl font-bold mb-6 text-gray-900 transition-all duration-1000 delay-200 ${
                heroVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-10"
              }`}
            >
              PharmaCare Pro
            </h1>
            <p
              className={`text-xl md:text-2xl text-gray-500 mb-8 leading-relaxed transition-all duration-1000 delay-400 ${
                heroVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-10"
              }`}
            >
              Revolutionize your pharmacy operations with intelligent inventory
              management, real-time analytics, and seamless multi-location
              oversight.
            </p>
            <div
              className={`flex flex-col sm:flex-row gap-4 justify-center transition-all duration-1000 delay-600 ${
                heroVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-10"
              }`}
            >
              <Button
                size="lg"
                className="text-lg px-8 py-6 bg-gradient-to-r from-purple-700 to-fuchsia-600 text-white border-0 shadow-lg transition-all duration-300 hover:scale-105"
                onClick={goToSignUp}
              >
                Start Free Trial
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="text-lg px-8 py-6 bg-white text-gray-900 border border-gray-200 transition-all duration-300"
              >
                Watch Demo
              </Button>
            </div>
          </div>
        </div>
      </section>
      {/* Stats Section */}
      <section ref={statsRef} className="py-16 bg-gray-100">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div
                key={index}
                className={`text-center group hover:scale-105 transition-all duration-500 ${
                  statsVisible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-10"
                }`}
                style={{ transitionDelay: `${index * 200}ms` }}
              >
                <div className="flex justify-center mb-4">
                  <stat.icon className="h-8 w-8 text-fuchsia-600 group-hover:text-purple-700 transition-colors duration-300" />
                </div>
                <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-500 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* Features Section */}
      <section ref={featuresRef} id="features" className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div
            className={`text-center mb-16 transition-all duration-1000 ${
              featuresVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-10"
            }`}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
              Powerful Features for Modern Pharmacies
            </h2>
            <p className="text-xl text-gray-500 max-w-3xl mx-auto">
              From inventory tracking to compliance monitoring, PharmaCare Pro
              provides everything you need to manage multiple pharmacy locations
              efficiently.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className={`group hover:shadow-xl transition-all duration-500 border border-gray-200 hover:border-fuchsia-600 hover:-translate-y-2 ${
                  featuresVisible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-10"
                }`}
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                <CardHeader>
                  <div
                    className={`w-14 h-14 rounded-xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <feature.icon className="h-7 w-7 text-white" />
                  </div>
                  <CardTitle className="text-xl group-hover:text-fuchsia-600 transition-colors duration-300">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed text-gray-500">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      {/* Key Benefits Section */}
      <section ref={benefitsRef} id="benefits" className="py-24 bg-gray-100">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div
              className={`transition-all duration-1000 ${
                benefitsVisible
                  ? "opacity-100 translate-x-0"
                  : "opacity-0 -translate-x-10"
              }`}
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-8 text-gray-900">
                Why Choose PharmaCare Pro?
              </h2>
              <div className="space-y-6">
                {[
                  "Complete audit trails for regulatory compliance",
                  "Intelligent slow-moving stock identification",
                  "Custom page creation for specialized tracking",
                  "Seamless data migration between periods",
                  "Multi-pharmacy dashboard oversight",
                  "Role-based task delegation system",
                ].map((benefit, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-4 group transition-all duration-500 ${
                      benefitsVisible
                        ? "opacity-100 translate-x-0"
                        : "opacity-0 -translate-x-10"
                    }`}
                    style={{ transitionDelay: `${index * 100}ms` }}
                  >
                    <CheckCircle className="h-6 w-6 text-green-500 group-hover:scale-110 transition-transform duration-300" />
                    <span className="text-lg text-gray-900">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div
              className={`bg-white rounded-2xl p-8 hover:scale-105 transition-all duration-1000 ${
                benefitsVisible
                  ? "opacity-100 translate-x-0"
                  : "opacity-0 translate-x-10"
              }`}
            >
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-300">
                  <FileText className="h-8 w-8 text-fuchsia-600 mx-auto mb-3" />
                  <div className="text-2xl font-bold text-gray-900">
                    Daily Reports
                  </div>
                  <div className="text-gray-500">Automated</div>
                </div>
                <div className="text-center p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-300">
                  <TrendingUp className="h-8 w-8 text-green-500 mx-auto mb-3" />
                  <div className="text-2xl font-bold text-gray-900">
                    Efficiency
                  </div>
                  <div className="text-gray-500">+50% Boost</div>
                </div>
                <div className="text-center p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-300">
                  <Users className="h-8 w-8 text-blue-500 mx-auto mb-3" />
                  <div className="text-2xl font-bold text-gray-900">
                    Multi-Role
                  </div>
                  <div className="text-gray-500">Management</div>
                </div>
                <div className="text-center p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-300">
                  <Shield className="h-8 w-8 text-purple-700 mx-auto mb-3" />
                  <div className="text-2xl font-bold text-gray-900">
                    Compliant
                  </div>
                  <div className="text-gray-500">& Secure</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* CTA Section */}
      <section ref={ctaRef} className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div
            className={`max-w-4xl mx-auto text-center bg-gray-50 rounded-3xl p-12 transition-all duration-1000 ${
              ctaVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
            }`}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
              Ready to Transform Your Pharmacy Operations?
            </h2>
            <p className="text-xl text-gray-500 mb-8 max-w-2xl mx-auto">
              Join hundreds of pharmacies already using PharmaCare Pro to
              streamline their inventory management and improve operational
              efficiency.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="text-lg px-8 py-6 bg-gradient-to-r from-purple-700 to-fuchsia-600 text-white border-0 shadow-lg transition-all duration-300 hover:scale-105"
                onClick={goToSignUp}
              >
                Start Your Free Trial
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="text-lg px-8 py-6 bg-white text-gray-900 border border-gray-200 transition-all duration-300"
              >
                Schedule a Demo
              </Button>
            </div>
          </div>
        </div>
      </section>
      {/* Footer */}
      <footer className="bg-gray-100 py-12">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-fuchsia-600 mb-4">
              PharmaCare Pro
            </div>
            <p className="text-gray-500 mb-6">
              Intelligent pharmacy inventory management for the modern
              healthcare industry.
            </p>
            <div className="flex justify-center gap-8 text-gray-500">
              <a
                href="#"
                className="hover:text-fuchsia-600 transition-colors duration-300"
              >
                Privacy Policy
              </a>
              <a
                href="#"
                className="hover:text-fuchsia-600 transition-colors duration-300"
              >
                Terms of Service
              </a>
              <a
                href="#"
                className="hover:text-fuchsia-600 transition-colors duration-300"
              >
                Contact Support
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
