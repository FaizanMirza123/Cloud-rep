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
import { useAgents } from "../hooks/useApi";
import toast from "react-hot-toast";

const CreateAgent = () => {
  const navigate = useNavigate();
  const { createAgent } = useAgents();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [agentData, setAgentData] = useState({
    name: "",
    industry: "",
    role: "Assistant",
    description: "",
    firstMessage: "",
    systemPrompt: "",
    voice: "flash-v2.5",
    voiceProvider: "11labs",
    voiceGender: "male",
    model: "gpt-4o",
    modelProvider: "openai",
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

  const voiceProviders = [
    { id: "11labs", name: "ElevenLabs", description: "High-quality voices" },
    { id: "azure", name: "Azure", description: "Microsoft neural voices" },
    { id: "openai", name: "OpenAI", description: "OpenAI voices" },
  ];

  const elevenLabsVoices = [
    {
      id: "flash-v2.5",
      name: "Flash v2.5",
      description: "Fast, high-quality voice",
      gender: ["male", "female"],
    },
    {
      id: "flash-v2",
      name: "Flash v2",
      description: "Fast voice synthesis",
      gender: ["male", "female"],
    },
  ];

  const azureVoices = [
    {
      id: "en-US-AriaNeural",
      name: "Aria",
      description: "Clear, professional",
      gender: "female",
    },
    {
      id: "en-US-GuyNeural",
      name: "Guy",
      description: "Warm, confident",
      gender: "male",
    },
    {
      id: "en-US-JennyNeural",
      name: "Jenny",
      description: "Friendly, optimistic",
      gender: "female",
    },
    {
      id: "en-US-DavisNeural",
      name: "Davis",
      description: "Clear, assertive",
      gender: "male",
    },
  ];

  const openaiVoices = [
    {
      id: "alloy",
      name: "Alloy",
      description: "Neutral, professional",
      gender: "neutral",
    },
    {
      id: "echo",
      name: "Echo",
      description: "Warm, friendly",
      gender: "female",
    },
    {
      id: "fable",
      name: "Fable",
      description: "Expressive, storytelling",
      gender: "male",
    },
    {
      id: "onyx",
      name: "Onyx",
      description: "Deep, authoritative",
      gender: "male",
    },
    {
      id: "nova",
      name: "Nova",
      description: "Clear, energetic",
      gender: "female",
    },
    {
      id: "shimmer",
      name: "Shimmer",
      description: "Bright, cheerful",
      gender: "female",
    },
  ];

  const models = [
    {
      id: "gpt-4o",
      name: "GPT-4o",
      description: "Most capable and efficient model",
      provider: "openai",
    },
    {
      id: "gpt-4",
      name: "GPT-4",
      description: "Reliable and powerful",
      provider: "openai",
    },
    {
      id: "gpt-4.1",
      name: "GPT-4.1",
      description: "Advanced capabilities",
      provider: "openai",
    },
    {
      id: "gpt-3.5-turbo",
      name: "GPT-3.5 Turbo",
      description: "Fast and efficient",
      provider: "openai",
    },
    {
      id: "claude-3-sonnet",
      name: "Claude 3 Sonnet",
      description: "Anthropic model",
      provider: "anthropic",
    },
  ];

  const getVoicesForProvider = (provider) => {
    switch (provider) {
      case "11labs":
        return elevenLabsVoices;
      case "azure":
        return azureVoices;
      case "openai":
        return openaiVoices;
      default:
        return elevenLabsVoices;
    }
  };

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
      setLoading(true);

      // Validate required fields
      if (!agentData.name.trim()) {
        toast.error("Agent name is required");
        return;
      }

      if (!agentData.industry.trim()) {
        toast.error("Industry is required");
        return;
      }

      // Create the agent via API
      const result = await createAgent(agentData);

      if (result.success) {
        toast.success("Agent created successfully!");
        navigate("/agents");
      } else {
        toast.error(result.error || "Failed to create agent");
      }
    } catch (error) {
      console.error("Error creating agent:", error);
      toast.error("Failed to create agent. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    try {
      if (!agentData.name.trim()) {
        toast.error("Please save the agent first before testing");
        return;
      }

      // TODO: Implement test call functionality
      toast.info("Test call functionality coming soon!");
    } catch (error) {
      console.error("Error testing agent:", error);
      toast.error("Failed to test agent");
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
                      onChange={(e) => {
                        handleInputChange("model", e.target.value);
                        handleInputChange(
                          "modelProvider",
                          model.provider || "openai"
                        );
                      }}
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
                Voice Provider
              </label>
              <div className="space-y-3">
                {voiceProviders.map((provider) => (
                  <label
                    key={provider.id}
                    className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="voiceProvider"
                      value={provider.id}
                      checked={agentData.voiceProvider === provider.id}
                      onChange={(e) => {
                        handleInputChange("voiceProvider", e.target.value);
                        // Set default voice for selected provider
                        const voices = getVoicesForProvider(e.target.value);
                        if (voices && voices.length > 0) {
                          handleInputChange("voice", voices[0].id);
                          if (voices[0].gender) {
                            if (Array.isArray(voices[0].gender)) {
                              handleInputChange(
                                "voiceGender",
                                voices[0].gender[0]
                              );
                            } else {
                              handleInputChange(
                                "voiceGender",
                                voices[0].gender
                              );
                            }
                          }
                        }
                      }}
                      className="text-blue-600"
                    />
                    <div>
                      <div className="font-medium text-gray-900">
                        {provider.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {provider.description}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Voice
              </label>
              <div className="space-y-3">
                {getVoicesForProvider(agentData.voiceProvider).map((voice) => (
                  <label
                    key={voice.id}
                    className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="voice"
                      value={voice.id}
                      checked={agentData.voice === voice.id}
                      onChange={(e) => {
                        handleInputChange("voice", e.target.value);
                        if (voice.gender) {
                          if (Array.isArray(voice.gender)) {
                            handleInputChange("voiceGender", voice.gender[0]);
                          } else {
                            handleInputChange("voiceGender", voice.gender);
                          }
                        }
                      }}
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

            {/* Voice Gender Selection for ElevenLabs */}
            {agentData.voiceProvider === "11labs" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Voice Gender
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="voiceGender"
                      value="male"
                      checked={agentData.voiceGender === "male"}
                      onChange={(e) =>
                        handleInputChange("voiceGender", e.target.value)
                      }
                      className="text-blue-600"
                    />
                    <span>Male</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="voiceGender"
                      value="female"
                      checked={agentData.voiceGender === "female"}
                      onChange={(e) =>
                        handleInputChange("voiceGender", e.target.value)
                      }
                      className="text-blue-600"
                    />
                    <span>Female</span>
                  </label>
                </div>
              </div>
            )}

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
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Create AI Agent (Simple)
                </h1>
                <p className="text-gray-600">Set up your new voice AI agent</p>
              </div>
              <button
                onClick={() => navigate("/agents/create")}
                className="text-sm text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md"
              >
                Switch to Guided Wizard
              </button>
            </div>
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
                    disabled={loading}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Creating...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Create Agent</span>
                      </>
                    )}
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
