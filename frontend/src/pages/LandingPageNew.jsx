import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Bot,
  Phone,
  BarChart3,
  Users,
  CheckCircle,
  ArrowRight,
  Star,
  Play,
} from "lucide-react";

const LandingPage = () => {
  const [timeLeft, setTimeLeft] = useState({
    days: 1,
    hours: 17,
    minutes: 43,
    seconds: 8,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        let { days, hours, minutes, seconds } = prev;

        if (seconds > 0) {
          seconds--;
        } else if (minutes > 0) {
          minutes--;
          seconds = 59;
        } else if (hours > 0) {
          hours--;
          minutes = 59;
          seconds = 59;
        } else if (days > 0) {
          days--;
          hours = 23;
          minutes = 59;
          seconds = 59;
        }

        return { days, hours, minutes, seconds };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const features = [
    {
      icon: Phone,
      title: "Operates 24/7 365",
      description: "Your AI agents work around the clock without breaks",
    },
    {
      icon: Bot,
      title: "5-Minute Setup",
      description: "Get your voice AI agent up and running in minutes",
    },
    {
      icon: Users,
      title: "Pre-configured Industry Templates",
      description: "Ready-to-use templates for various business needs",
    },
    {
      icon: BarChart3,
      title: "Voice, SMS and Chatbot",
      description: "Multi-channel communication in one platform",
    },
  ];

  const additionalFeatures = [
    "Live Call Analysis",
    "Smart Call Routing",
    "50+ Ways to Choose From",
    "Supports Over 30 Languages",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 relative overflow-hidden">
      {/* Background People Images */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-0 w-full h-full">
          {/* Simulated people silhouettes - in real implementation, these would be actual photos */}
          <div className="absolute top-4 left-4 w-16 h-16 bg-white/10 rounded-full"></div>
          <div className="absolute top-8 left-24 w-20 h-20 bg-white/10 rounded-full"></div>
          <div className="absolute top-12 left-48 w-18 h-18 bg-white/10 rounded-full"></div>
          <div className="absolute top-4 right-4 w-16 h-16 bg-white/10 rounded-full"></div>
          <div className="absolute top-8 right-24 w-20 h-20 bg-white/10 rounded-full"></div>
          <div className="absolute top-12 right-48 w-18 h-18 bg-white/10 rounded-full"></div>
        </div>
      </div>

      {/* Header */}
      <header className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 pt-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/20">
                <div className="w-6 h-6 bg-gradient-to-br from-cyan-400 to-blue-500 rounded"></div>
              </div>
              <span className="ml-3 text-2xl font-bold text-white">CLOUD</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            {/* Left Side - Content */}
            <div className="text-white relative">
              {/* Testimonial Bubble */}
              <div className="absolute -top-8 right-0 lg:right-16 bg-white rounded-lg p-4 shadow-lg max-w-xs z-20">
                <p className="text-gray-800 text-sm font-medium">
                  "A law office increased their sales intake by 35% within the
                  first two weeks of using the system."
                </p>
              </div>

              <h1 className="text-5xl lg:text-6xl font-bold leading-tight mt-12">
                Get <span className="text-yellow-300">$25 Free</span>
                <br />
                AI Calling Credits
              </h1>

              <p className="text-xl text-blue-100 mt-6 leading-relaxed">
                Test drive our AI agents with $25 in free calling credits. Book
                appointments, qualify leads, and handle customer service while
                you sleep. Setup takes 5 minutes.
              </p>

              {/* Features */}
              <div className="grid grid-cols-1 gap-4 mt-8">
                {features.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="bg-white/10 backdrop-blur-sm p-2 rounded-lg border border-white/20">
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white text-sm">
                          {feature.title}
                        </h3>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Additional Features */}
              <div className="mt-8 grid grid-cols-2 gap-2">
                {additionalFeatures.map((feature, index) => (
                  <div
                    key={index}
                    className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20"
                  >
                    <span className="text-sm text-white font-medium">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Side - Registration Form */}
            <div className="bg-white rounded-2xl shadow-2xl p-8 relative z-20">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Register Now
                </h2>

                {/* Countdown Timer */}
                <div className="flex justify-center items-center space-x-2 mb-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-red-500">
                      {timeLeft.days.toString().padStart(2, "0")}
                    </div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide">
                      days
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-red-500">:</div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-red-500">
                      {timeLeft.hours.toString().padStart(2, "0")}
                    </div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide">
                      hours
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-red-500">:</div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-red-500">
                      {timeLeft.minutes.toString().padStart(2, "0")}
                    </div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide">
                      mins
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-red-500">:</div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-red-500">
                      {timeLeft.seconds.toString().padStart(2, "0")}
                    </div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide">
                      sec
                    </div>
                  </div>
                </div>
              </div>

              {/* Google Sign Up Button */}
              <button className="w-full bg-gray-50 hover:bg-gray-100 text-gray-700 py-3 rounded-lg mb-4 border border-gray-200 flex items-center justify-center space-x-3 transition duration-200">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span className="font-medium">Continue with Google</span>
              </button>

              <div className="text-center text-gray-400 mb-4 text-sm">or</div>

              {/* Registration Form */}
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    className="w-full px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-yellow-100 border border-yellow-200"
                    defaultValue="sana@shiftgroup.ca"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <div className="flex">
                    <select className="px-3 py-3 border border-gray-300 rounded-l-lg bg-gray-50 text-sm">
                      <option value="+1">🇺🇸 +1</option>
                    </select>
                    <input
                      type="tel"
                      className="flex-1 px-4 py-3 border border-l-0 border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    className="w-full px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-yellow-100 border border-yellow-200"
                    defaultValue="••••••••"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  />
                </div>

                <label className="flex items-start space-x-3 pt-2">
                  <input
                    type="checkbox"
                    className="mt-1 rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-600 leading-relaxed">
                    I agree to the{" "}
                    <a
                      href="#"
                      className="text-blue-600 hover:underline font-medium"
                    >
                      Terms and Conditions
                    </a>
                  </span>
                </label>

                <Link
                  to="/register"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition duration-200 flex items-center justify-center mt-6"
                >
                  Register
                </Link>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
