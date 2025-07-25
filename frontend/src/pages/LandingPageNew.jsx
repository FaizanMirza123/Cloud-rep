import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Bot,
  Phone,
  BarChart3,
  Users,
  MessageSquare,
  Headset,
  Cpu,
} from "lucide-react";

// This is the main component for your new landing page.
const NexusAILandingPage = () => {
  // Countdown timer state and logic from your reference file.
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
        if (seconds > 0) seconds--;
        else if (minutes > 0) { minutes--; seconds = 59; }
        else if (hours > 0) { hours--; minutes = 59; seconds = 59; }
        else if (days > 0) { days--; hours = 23; minutes = 59; seconds = 59; }
        return { days, hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Features adapted from your NexusAI content, using lucide-react icons.
  const features = [
    {
      icon: Phone,
      title: "Live Voice Agents",
      description: "Deploy intelligent virtual assistants that respond to human speech.",
    },
    {
      icon: MessageSquare,
      title: "Live Chat & SMS",
      description: "Manage real-time chats across multiple platforms with conversational AI.",
    },
    {
      icon: BarChart3,
      title: "AI Sales & Marketing",
      description: "Utilize AI to engage, qualify, and nurture leads automatically.",
    },
    {
      icon: Headset,
      title: "AI Agent Assist",
      description: "Enhance human agent performance with real-time AI insights.",
    },
  ];

  // Additional features pulled from your NexusAI page content.
  const additionalFeatures = [
    "Simple Knowledge Base",
    "Unified CRM Integration",
    "Robust Tool Integrations",
    "AI Agent Manager",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white relative overflow-hidden">
      {/* Background decorative elements from your reference file */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-4 left-4 w-16 h-16 bg-white/10 rounded-full"></div>
        <div className="absolute top-8 left-24 w-20 h-20 bg-white/10 rounded-full"></div>
        <div className="absolute top-12 left-48 w-18 h-18 bg-white/10 rounded-full"></div>
        <div className="absolute top-4 right-4 w-16 h-16 bg-white/10 rounded-full"></div>
        <div className="absolute top-8 right-24 w-20 h-20 bg-white/10 rounded-full"></div>
        <div className="absolute top-12 right-48 w-18 h-18 bg-white/10 rounded-full"></div>
      </div>

      {/* Header */}
      <header className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 pt-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/20">
                <Cpu className="w-6 h-6 text-cyan-400" />
              </div>
              <span className="ml-3 text-2xl font-bold text-white">NexusAI</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            
            {/* Left Side - Content */}
            <div className="relative">
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                Say Hello to Your Fully Automated <br />
                <span className="text-cyan-300">AI-Powered Workforce</span>
              </h1>

              <p className="text-xl text-blue-100 mt-6 leading-relaxed">
                Deploy intelligent AI agents that work 24/7—handling customer interactions, managing tasks, and keeping your operations running seamlessly around the clock.
              </p>

              {/* Features List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                {features.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="bg-white/10 backdrop-blur-sm p-2 rounded-lg border border-white/20">
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">
                          {feature.title}
                        </h3>
                        <p className="text-blue-200 text-sm">{feature.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Additional Features Grid */}
              <div className="mt-8 grid grid-cols-2 gap-2">
                {additionalFeatures.map((feature, index) => (
                  <div key={index} className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
                    <span className="text-sm text-white font-medium">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Side - Form */}
            <div className="bg-white rounded-2xl shadow-2xl p-8 relative z-20">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Try Our Live AI Voice Agent Demo</h2>
                <p className="text-gray-500 mt-2">This special offer is ending soon!</p>
              </div>

              {/* Countdown Timer */}
              <div className="flex justify-center items-center space-x-2 mb-6">
                <div className="text-center"><div className="text-3xl font-bold text-red-500">{timeLeft.days.toString().padStart(2, "0")}</div><div className="text-xs text-gray-500 uppercase">days</div></div>
                <div className="text-3xl font-bold text-red-500">:</div>
                <div className="text-center"><div className="text-3xl font-bold text-red-500">{timeLeft.hours.toString().padStart(2, "0")}</div><div className="text-xs text-gray-500 uppercase">hours</div></div>
                <div className="text-3xl font-bold text-red-500">:</div>
                <div className="text-center"><div className="text-3xl font-bold text-red-500">{timeLeft.minutes.toString().padStart(2, "0")}</div><div className="text-xs text-gray-500 uppercase">mins</div></div>
                <div className="text-3xl font-bold text-red-500">:</div>
                <div className="text-center"><div className="text-3xl font-bold text-red-500">{timeLeft.seconds.toString().padStart(2, "0")}</div><div className="text-xs text-gray-500 uppercase">sec</div></div>
              </div>

              {/* Demo Form */}
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input type="text" placeholder="Enter your name" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" placeholder="Enter your email" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input type="tel" placeholder="Enter your phone number" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"/>
                </div>
                <Link to="/get-demo" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition duration-200 flex items-center justify-center mt-6">
                  Get a Call Now
                </Link>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default NexusAILandingPage;