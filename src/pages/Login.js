import React, { useState, useEffect } from "react";
import { Eye, EyeOff, ArrowRight, User, Lock, Shield, Globe } from "lucide-react";
import AnnouncementBanner from "./AnnouncementBanner";
import { motion } from "framer-motion";

// These would be your actual imports in the real application
import axios from "axios";
import BASE_URL from "../endpoints/endpoints";
import AdminDashboard from "./AdminDashboard";
import UserDashboard from "./UserDashboard";
import Premium from "./Premium";
import OtherDashboard from "./OtherDashboard";
import Superagent from "./SuperAgent";
import Normalagent from "./NormalAgent";
import Logo from "../assets/logo-icon.png";
import { toast } from "react-toastify";
import { Dialog } from "@headlessui/react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState(() => localStorage.getItem("role"));
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState("");
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  useEffect(() => {
    const storedRole = localStorage.getItem("role");
    if (storedRole) {
      setUserRole(storedRole);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await axios.post(`${BASE_URL}/api/auth/login`, {
        email,
        password,
      });

      if (res.data?.user?.isLoggedIn === false) {
        toast.warn(
          "This account is currently in use. Please log out from other devices."
        );
        setLoading(false);
        return;
      }

      const { token, user } = res.data;

      localStorage.setItem("token", token);
      localStorage.setItem("role", user.role);
      localStorage.setItem("name", user.name);
      localStorage.setItem("email", user.email);
      localStorage.setItem("userId", user.id);
      localStorage.setItem("isLoggedIn", true);

      setTimeout(() => {
        setUserRole(user.role);
        setLoading(false);
      }, 500);
    } catch (err) {
      setLoading(false);

      if (err.response?.status === 403) {
        toast.warn(
          "This account is currently in use. Please log out from other devices."
        );
      }

      setError("Login failed");
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Route to appropriate dashboard based on user role
  if (userRole === "ADMIN") {
    return <AdminDashboard setUserRole={setUserRole} />;
  } else if (userRole === "USER") {
    return <UserDashboard setUserRole={setUserRole} userRole={userRole} />;
  } else if (userRole === "PREMIUM") {
    return <Premium setUserRole={setUserRole} userRole={userRole} />;
  } else if (userRole === "SUPER") {
    return <Superagent setUserRole={setUserRole} userRole={userRole} />;
  } else if (userRole === "NORMAL") {
    return <Normalagent setUserRole={setUserRole} userRole={userRole} />;
  } else if (userRole === "Other") {
    return <OtherDashboard setUserRole={setUserRole} userRole={userRole} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Announcement Banner */}
      <AnnouncementBanner />

      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 relative overflow-hidden">
        {/* Geometric patterns */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-32 h-32 border-2 border-white rotate-45"></div>
          <div className="absolute top-40 right-32 w-24 h-24 border-2 border-white rounded-full"></div>
          <div className="absolute bottom-32 left-16 w-40 h-40 border-2 border-white"></div>
          <div className="absolute bottom-20 right-20 w-20 h-20 border-2 border-white rotate-12"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl font-bold mb-6 leading-tight">
              Welcome to<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
                KelisHub
              </span>
            </h1>
            <p className="text-xl mb-8 text-indigo-200 leading-relaxed">
              Your trusted platform for seamless data transactions and digital services.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <span className="text-indigo-200">Secure & Trusted Platform</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <Globe className="w-4 h-4 text-white" />
                </div>
                <span className="text-indigo-200">24/7 Service Availability</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <span className="text-indigo-200">Personalized Experience</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center px-8 py-12 lg:px-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          {/* Logo Section */}
          <div className="text-center mb-8">
            <div className="inline-block relative">
              <img
                src={Logo}
                alt="Logo"
                className="h-20 w-20 rounded-2xl shadow-lg mx-auto mb-4"
              />
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Sign In</h2>
            <p className="text-gray-600">Access your account to continue</p>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-lg"
            >
              <p className="text-sm">{error}</p>
            </motion.div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField("")}
                  className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl text-gray-900 placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-0 ${
                    focusedField === "email"
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField("")}
                  className={`w-full pl-10 pr-12 py-3 border-2 rounded-xl text-gray-900 placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-0 ${
                    focusedField === "password"
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full relative overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <span>Sign In</span>
                  <ArrowRight className="w-5 h-5" />
                </div>
              )}
            </button>

            {/* Request Account Link */}
            <div className="text-center">
              <a
                href="https://wa.me/233244450003"
                className="inline-flex items-center space-x-2 text-sm text-indigo-600 hover:text-indigo-800 transition-colors font-medium"
              >
                <span>Need an account? Request access</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>

            {/* Footer Links */}
            <div className="flex justify-center items-center space-x-6 text-sm text-gray-500">
              <button
                type="button"
                onClick={() => setShowTermsModal(true)}
                className="hover:text-indigo-600 transition-colors"
              >
                Terms of Use
              </button>
              <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
              <button
                type="button"
                onClick={() => setShowPrivacyModal(true)}
                className="hover:text-indigo-600 transition-colors"
              >
                Privacy Policy
              </button>
            </div>
          </form>
        </motion.div>
      </div>

      {/* Terms of Use Modal */}
      <Dialog open={showTermsModal} onClose={() => setShowTermsModal(false)}>
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <Dialog.Panel className="bg-white p-6 rounded-xl shadow-2xl max-w-2xl w-full mx-4 overflow-y-auto max-h-[90vh]">
            <Dialog.Title className="text-2xl font-bold text-indigo-600 mb-4 text-center">
              KELISHUB – TERMS OF USE
            </Dialog.Title>

            <div className="space-y-6 text-sm text-gray-700">
              <section>
                <h3 className="font-semibold text-lg text-gray-800 mb-2">1. DEPOSIT</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>The minimum deposit amount is <span className="font-medium">GHS 50</span>. Deposits below this amount will not be approved.</li>
                  <li>All payments should be made to:</li>
                  <ul className="ml-6">
                    <li>Number: <span className="text-indigo-600">0596316991</span></li>
                    <li>Name: <span className="text-purple-600">Yesu Yhorm Kafui Azago</span></li>
                  </ul>
                  <li>If your top-up does not reflect within 10 minutes, kindly contact an admin for immediate assistance.</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-lg text-gray-800 mb-2">2. LOAN</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>You are eligible to request a loan up to the total amount you've deposited.</li>
                  <li>Only one loan request is permitted per day.</li>
                  <li>A loan that is cleared within the day cannot be requested again on the same day.</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-lg text-gray-800 mb-2">3. REFERRALS</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>To refer a friend, simply share the link: <a href="https://www.kelishub.com" className="text-indigo-500 underline">www.kelishub.com</a>.</li>
                  <li>New users will be guided to contact the official registration agent.</li>
                  <li>Only recommend hardworking and trustworthy individuals to maintain community quality.</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-lg text-gray-800 mb-2">4. WORKING HOURS</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Operating hours are from <span className="font-medium">7:30 AM to 8:50 PM</span>, Monday to Saturday.</li>
                  <li>Orders can be placed anytime but will be processed only during working hours.</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-lg text-gray-800 mb-2">5. PROMOTIONS</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Promotions may be introduced at any time for:</li>
                  <ul className="ml-6 list-disc space-y-1">
                    <li>100GB bundles</li>
                    <li>Tigo non-expiry packages</li>
                    <li>MTN bundles</li>
                  </ul>
                  <li>Check the site regularly for updates on deals and prices.</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-lg text-gray-800 mb-2">6. REFUNDS</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Refund requests are handled only on Sundays.</li>
                  <li>You must present the following details:</li>
                  <ul className="ml-6 list-disc space-y-1">
                    <li>Order ID</li>
                    <li>Data size</li>
                  </ul>
                </ul>
              </section>

              <p className="italic text-gray-500 border-t pt-4">
                If you need clarification on any of these rules, feel free to contact an admin. Thank you for being a valued member of the Kelishub community.
              </p>
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={() => setShowTermsModal(false)}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Close
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Privacy Policy Modal */}
      <Dialog open={showPrivacyModal} onClose={() => setShowPrivacyModal(false)}>
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <Dialog.Panel className="bg-white p-6 rounded-xl shadow-2xl max-w-2xl w-full mx-4 overflow-y-auto max-h-[90vh]">
            <Dialog.Title className="text-2xl font-bold text-indigo-600 mb-4 text-center">
              Privacy Policy for KelisHub
            </Dialog.Title>

            <p className="text-center text-sm text-gray-500 mb-6">
              <span className="italic">Effective Date:</span> 01/06/2025
            </p>

            <div className="space-y-6 text-sm text-gray-700">
              <section>
                <h3 className="font-semibold text-lg text-gray-800 mb-2">1. Information We Collect</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>Personal Information:</strong> Name, phone number, email address, and network provider.</li>
                  <li><strong>Transaction Information:</strong> Data bundle purchases, payment methods (e.g., MoMo – not stored), and transaction history.</li>
                  <li><strong>Device Information:</strong> IP address, device type, browser type, and location data (for security and optimization).</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-lg text-gray-800 mb-2">2. How We Use Your Information</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Process your data bundle orders.</li>
                  <li>Communicate with you regarding purchases, updates, or issues.</li>
                  <li>Improve our services and customer experience.</li>
                  <li>Prevent fraud and ensure account security.</li>
                  <li>Send promotional messages (optional; opt-out available).</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-lg text-gray-800 mb-2">3. Data Sharing</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>We don't sell or share your personal data, except:</li>
                  <ul className="ml-6 list-disc space-y-1">
                    <li>With trusted service providers (e.g., payment gateways).</li>
                    <li>When legally required.</li>
                    <li>To prevent fraud or protect users and our platform.</li>
                  </ul>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-lg text-gray-800 mb-2">4. Data Security</h3>
                <p>We use reasonable industry-standard practices to protect your data. While no system is perfectly secure, we do our best to keep your information safe.</p>
              </section>

              <section>
                <h3 className="font-semibold text-lg text-gray-800 mb-2">5. Your Rights</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Access, update, or delete your personal information.</li>
                  <li>Opt-out of promotional messages.</li>
                  <li>Request us to stop processing your data (with business/legal limitations).</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-lg text-gray-800 mb-2">6. Cookies & Tracking</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Used to enhance browsing, remember preferences, and track site traffic.</li>
                  <li>You can disable cookies in your browser settings.</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-lg text-gray-800 mb-2">7. Third-Party Links</h3>
                <p>Links to third-party websites may exist. We are not responsible for their content or privacy practices.</p>
              </section>

              <section>
                <h3 className="font-semibold text-lg text-gray-800 mb-2">8. Changes to This Policy</h3>
                <p>This policy may be updated periodically. Changes will be reflected with a revised effective date.</p>
              </section>

              <section>
                <h3 className="font-semibold text-lg text-gray-800 mb-2">9. Contact Us</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Email: <a href="mailto:kelisdata22@gmail.com" className="text-indigo-500 underline">kelisdata22@gmail.com</a></li>
                  <li>Phone: <span className="text-indigo-600">0244450003</span></li>
                </ul>
              </section>
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Close
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
};

export default Login;