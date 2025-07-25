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

  const testimonials = [
    {
      quote:
        "A law office increased their sales intake by 35% within the first two weeks of using the system.",
      author: "Legal Firm Client",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <span className="ml-2 text-xl font-bold text-gray-900">
                VoiceFlow
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium"
              >
                Log In
              </Link>
              <Link
                to="/register"
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl font-bold text-gray-900 leading-tight">
                Get <span className="text-yellow-400">$25 Free</span>
                <br />
                AI Calling Credits
              </h1>
              <p className="text-xl text-gray-600 mt-6 leading-relaxed">
                Test drive our AI agents with $25 in free calling credits. Book
                appointments, qualify leads, and handle customer service while
                you sleep. Setup takes 5 minutes.
              </p>

              {/* Features Grid */}
              <div className="grid grid-cols-2 gap-4 mt-8">
                {features.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <Icon className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 text-sm">
                          {feature.title}
                        </h3>
                        <p className="text-gray-600 text-xs mt-1">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Additional Features */}
              <div className="mt-8 space-y-2">
                {additionalFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="bg-blue-100 p-1 rounded">
                      <CheckCircle className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="text-sm text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Registration Form */}
            <div className="bg-white rounded-xl shadow-xl p-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Register Now
                </h2>
                <div className="flex justify-center space-x-4 mt-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-red-600">
                      {timeLeft.days.toString().padStart(2, "0")}
                    </div>
                    <div className="text-xs text-gray-500">days</div>
                  </div>
                  <div className="text-2xl font-bold text-gray-400">:</div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">
                      {timeLeft.hours.toString().padStart(2, "0")}
                    </div>
                    <div className="text-xs text-gray-500">hours</div>
                  </div>
                  <div className="text-2xl font-bold text-gray-400">:</div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">
                      {timeLeft.minutes.toString().padStart(2, "0")}
                    </div>
                    <div className="text-xs text-gray-500">mins</div>
                  </div>
                  <div className="text-2xl font-bold text-gray-400">:</div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">
                      {timeLeft.seconds.toString().padStart(2, "0")}
                    </div>
                    <div className="text-xs text-gray-500">sec</div>
                  </div>
                </div>
              </div>

              <button className="w-full bg-gray-100 text-gray-600 py-3 rounded-lg mb-4 border flex items-center justify-center space-x-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              <div className="text-center text-gray-500 mb-4">or</div>

              <form className="space-y-4">
                <input
                  type="text"
                  placeholder="Full Name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="email"
                  placeholder="Email"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  defaultValue="sana@shiftgroup.ca"
                />
                <div className="flex">
                  <select className="px-3 py-3 border border-gray-300 rounded-l-lg bg-gray-50">
                    <option value="+1">🇺🇸 +1</option>
                  </select>
                  <input
                    type="tel"
                    placeholder="Phone Number"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <input
                  type="password"
                  placeholder="Password"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="password"
                  placeholder="Confirm Password"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded" />
                  <span className="text-sm text-gray-600">
                    I agree to the{" "}
                    <a href="#" className="text-blue-600 hover:underline">
                      Terms and Conditions
                    </a>
                  </span>
                </label>
                <Link
                  to="/register"
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-200 flex items-center justify-center"
                >
                  Register
                </Link>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-blue-50 rounded-lg p-8 inline-block">
            <blockquote className="text-lg text-gray-700 italic">
              "{testimonials[0].quote}"
            </blockquote>
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Try Our Live 📞 Voice Agent Demo
          </h2>
          <button className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition duration-200 flex items-center space-x-2 mx-auto">
            <Play className="w-5 h-5" />
            <span>Start Demo Call</span>
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <span className="ml-2 text-xl font-bold">VoiceFlow</span>
              </div>
              <p className="text-gray-400">
                Transform your business with AI-powered voice agents.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Demo
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Careers
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2025 VoiceFlow. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
