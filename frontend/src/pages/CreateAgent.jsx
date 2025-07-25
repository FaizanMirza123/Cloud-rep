import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Bot,
  Save,
  Play,
  Settings,
  MessageSquare,
  Palette,
  Users,
  Mic,
  Shield,
  Check,
} from "lucide-react";

const CreateAgent = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [agentData, setAgentData] = useState({
    name: "",
    industry: "",
    role: "Assistant",
    description: "",
    firstMessage: "",
    systemPrompt: "",
    voice: "alloy",
    model: "gpt-4",
    language: "en-US",
  });

  const steps = [
    { id: 1, name: "General", icon: Settings, completed: false },
    { id: 2, name: "Context", icon: MessageSquare, completed: false },
    { id: 3, name: "Appearance", icon: Palette, completed: false },
    { id: 4, name: "Personality", icon: Users, completed: false },
    { id: 5, name: "Speech", icon: Mic, completed: false },
    { id: 6, name: "Privacy", icon: Shield, completed: false },
  ];

  const industries = [
    "HVAC",
    "Fast Food Chains",
    "Full Service Integrative Health Clinic",
    "Affiliate Marketing Agencies",
    "Baggage Tracking & Claims",
    "Hotels & Resorts",
    "General",
    "Customer Support",
    "Sales",
    "Healthcare",
    "Education",
    "Real Estate",
    "Legal Services",
    "Financial Services",
  ];

  const voices = [
    { id: "alloy", name: "Alloy", description: "Neutral, professional" },
    { id: "echo", name: "Echo", description: "Warm, friendly" },
    { id: "fable", name: "Fable", description: "Expressive, storytelling" },
    { id: "onyx", name: "Onyx", description: "Deep, authoritative" },
    { id: "nova", name: "Nova", description: "Clear, energetic" },
    { id: "shimmer", name: "Shimmer", description: "Bright, cheerful" },
  ];

  const models = [
    { id: "gpt-4", name: "GPT-4", description: "Most capable model" },
    {
      id: "gpt-3.5-turbo",
      name: "GPT-3.5 Turbo",
      description: "Fast and efficient",
    },
    {
      id: "claude-3-sonnet",
      name: "Claude 3 Sonnet",
      description: "Anthropic model",
    },
  ];

  const handleInputChange = (field, value) => {
    setAgentData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSave = async () => {
    try {
      // Here you would make the API call to create the agent
      console.log("Creating agent with data:", agentData);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      alert("Agent created successfully!");
      navigate("/agents");
    } catch (error) {
      console.error("Error creating agent:", error);
      alert("Failed to create agent. Please try again.");
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1: // General
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Agent Name *
              </label>
              <input
                type="text"
                value={agentData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter agent name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Industry/Use Case *
              </label>
              <select
                value={agentData.industry}
                onChange={(e) => handleInputChange("industry", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select an industry</option>
                {industries.map((industry) => (
                  <option key={industry} value={industry}>
                    {industry}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role
              </label>
              <select
                value={agentData.role}
                onChange={(e) => handleInputChange("role", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Assistant">Assistant</option>
                <option value="Sales Rep">Sales Rep</option>
                <option value="Support Agent">Support Agent</option>
                <option value="Receptionist">Receptionist</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={agentData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                placeholder="Describe what this agent does..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        );

      case 2: // Context
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                System Prompt
              </label>
              <textarea
                value={agentData.systemPrompt}
                onChange={(e) =>
                  handleInputChange("systemPrompt", e.target.value)
                }
                placeholder="You are a helpful AI assistant for..."
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-500 mt-1">
                Define the agent's role, personality, and how it should respond
                to users.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Message
              </label>
              <textarea
                value={agentData.firstMessage}
                onChange={(e) =>
                  handleInputChange("firstMessage", e.target.value)
                }
                placeholder="Hello! How can I help you today?"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-500 mt-1">
                The first message users will hear when they call.
              </p>
            </div>
          </div>
        );

      case 3: // Appearance
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                AI Model
              </label>
              <div className="space-y-3">
                {models.map((model) => (
                  <label
                    key={model.id}
                    className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="model"
                      value={model.id}
                      checked={agentData.model === model.id}
                      onChange={(e) =>
                        handleInputChange("model", e.target.value)
                      }
                      className="text-blue-600"
                    />
                    <div>
                      <div className="font-medium text-gray-900">
                        {model.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {model.description}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      case 4: // Personality
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Personality Settings
              </h3>
              <p className="text-gray-600 mb-6">
                Configure how your agent should behave and interact with users.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tone
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option>Professional</option>
                    <option>Friendly</option>
                    <option>Casual</option>
                    <option>Formal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Response Style
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option>Concise</option>
                    <option>Detailed</option>
                    <option>Conversational</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        );

      case 5: // Speech
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Voice
              </label>
              <div className="space-y-3">
                {voices.map((voice) => (
                  <label
                    key={voice.id}
                    className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="voice"
                      value={voice.id}
                      checked={agentData.voice === voice.id}
                      onChange={(e) =>
                        handleInputChange("voice", e.target.value)
                      }
                      className="text-blue-600"
                    />
                    <div>
                      <div className="font-medium text-gray-900">
                        {voice.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {voice.description}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Language
              </label>
              <select
                value={agentData.language}
                onChange={(e) => handleInputChange("language", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="en-US">English (US)</option>
                <option value="en-GB">English (UK)</option>
                <option value="es-ES">Spanish</option>
                <option value="fr-FR">French</option>
                <option value="de-DE">German</option>
                <option value="it-IT">Italian</option>
              </select>
            </div>
          </div>
        );

      case 6: // Privacy
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Privacy & Security
              </h3>
              <p className="text-gray-600 mb-6">
                Configure privacy and security settings for your agent.
              </p>

              <div className="space-y-4">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    className="rounded text-blue-600"
                    defaultChecked
                  />
                  <span className="text-sm text-gray-700">
                    Enable call recording
                  </span>
                </label>

                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    className="rounded text-blue-600"
                    defaultChecked
                  />
                  <span className="text-sm text-gray-700">
                    Store conversation logs
                  </span>
                </label>

                <label className="flex items-center space-x-3">
                  <input type="checkbox" className="rounded text-blue-600" />
                  <span className="text-sm text-gray-700">
                    Enable analytics tracking
                  </span>
                </label>

                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    className="rounded text-blue-600"
                    defaultChecked
                  />
                  <span className="text-sm text-gray-700">
                    GDPR compliance mode
                  </span>
                </label>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate("/agents")}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Create AI Agent
            </h1>
            <p className="text-gray-600">Set up your new voice AI agent</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleSave}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>Save Agent</span>
          </button>
          <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-200 flex items-center space-x-2">
            <Play className="w-4 h-4" />
            <span>Test</span>
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Steps Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Setup Steps
            </h2>
            <nav className="space-y-2">
              {steps.map((step) => {
                const Icon = step.icon;
                const isActive = currentStep === step.id;
                const isCompleted = step.completed;

                return (
                  <button
                    key={step.id}
                    onClick={() => setCurrentStep(step.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      isActive
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <div
                      className={`p-1 rounded ${
                        isActive ? "bg-blue-100" : "bg-gray-100"
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Icon
                          className={`w-4 h-4 ${
                            isActive ? "text-blue-600" : "text-gray-500"
                          }`}
                        />
                      )}
                    </div>
                    <span className="text-sm font-medium">{step.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow p-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {steps[currentStep - 1]?.name}
              </h2>
              <p className="text-gray-600 mt-1">
                Step {currentStep} of {steps.length}
              </p>
            </div>

            {renderStepContent()}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={handlePrevious}
                disabled={currentStep === 1}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              <div className="flex space-x-3">
                <button
                  onClick={handleSave}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Save Draft
                </button>

                {currentStep < steps.length ? (
                  <button
                    onClick={handleNext}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                  >
                    Create Agent
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateAgent;
