import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Save,
  Wand2,
  MessageSquare,
  Mic,
  Brain,
  Settings,
  DollarSign,
  Lightbulb,
  Copy,
  RefreshCw,
  BookOpen,
  Upload,
  Check,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAgents } from "../hooks/useApi";
import { toast } from "react-toastify";
import SystemPromptGenerator from "../utils/systemPromptGenerator";
import PricingDisplay from "../components/PricingDisplay";

const AgentCreationWizard = () => {
  const navigate = useNavigate();
  const { createAgent } = useAgents();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [promptGenerator] = useState(new SystemPromptGenerator());

  const [agentData, setAgentData] = useState({
    name: "",
    industry: "",
    role: "Assistant",
    description: "",
    businessName: "",
    communicationStyle: "professional",
    primaryTasks: [],
    firstMessage: "",
    systemPrompt: "",
    voice: "29vD33N1CtxCmqQRPOHJ", // ElevenLabs male default
    voiceProvider: "11labs",
    voiceGender: "male",
    model: "gpt-4o",
    modelProvider: "openai",
    language: "en-US",
    customInstructions: "",
    knowledgeBaseName: "",
    knowledgeBaseFile: null,
    knowledgeBaseFileName: "",
  });

  const [selectedFile, setSelectedFile] = useState(null);

  const [promptConfig, setPromptConfig] = useState({
    useTemplate: true,
    includeVariables: true,
    includeErrorHandling: true,
  });

  const steps = [
    { id: 1, name: "Basic Info", icon: Settings },
    { id: 2, name: "AI Configuration", icon: Brain },
    { id: 3, name: "Knowledge Base", icon: BookOpen },
    { id: 4, name: "Voice & Speech", icon: Mic },
    { id: 5, name: "Prompt & Personality", icon: MessageSquare },
    { id: 6, name: "Review & Pricing", icon: DollarSign },
  ];

  const industries = [
    "HVAC",
    "Healthcare",
    "Real Estate",
    "Legal Services",
    "Customer Support",
    "Sales",
    "Financial Services",
    "Education",
    "Automotive",
    "Retail",
    "Hospitality",
    "Construction",
    "Insurance",
    "Technology",
    "General",
  ];

  const communicationStyles = [
    {
      id: "professional",
      name: "Professional",
      description: "Formal, courteous, and business-focused",
    },
    {
      id: "friendly",
      name: "Friendly",
      description: "Warm, approachable, and conversational",
    },
    {
      id: "consultative",
      name: "Consultative",
      description: "Advisory, helpful, and solution-oriented",
    },
    {
      id: "authoritative",
      name: "Authoritative",
      description: "Confident, knowledgeable, and directive",
    },
  ];

  const primaryTaskOptions = [
    "appointment_booking",
    "lead_qualification",
    "customer_support",
    "information_gathering",
    "order_processing",
    "technical_support",
    "sales_inquiry",
    "billing_support",
    "follow_up",
    "emergency_response",
  ];

  const models = [
    {
      id: "gpt-4o",
      name: "GPT-4o",
      description: "Most capable and cost-effective",
      provider: "openai",
    },
    {
      id: "gpt-4",
      name: "GPT-4",
      description: "Reliable and powerful",
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

  const voiceProviders = [
    {
      id: "openai",
      name: "OpenAI",
      description: "Natural, cost-effective voices",
    },
    {
      id: "11labs",
      name: "ElevenLabs",
      description: "Premium quality, expressive voices",
    },
    { id: "azure", name: "Azure", description: "Microsoft neural voices" },
  ];

  const voices = {
    openai: [
      {
        id: "alloy",
        name: "Alloy",
        gender: "neutral",
        description: "Neutral, professional",
      },
      {
        id: "echo",
        name: "Echo",
        gender: "male",
        description: "Warm, confident",
      },
      {
        id: "fable",
        name: "Fable",
        gender: "male",
        description: "Expressive, storytelling",
      },
      {
        id: "onyx",
        name: "Onyx",
        gender: "male",
        description: "Deep, authoritative",
      },
      {
        id: "nova",
        name: "Nova",
        gender: "female",
        description: "Clear, energetic",
      },
      {
        id: "shimmer",
        name: "Shimmer",
        gender: "female",
        description: "Bright, cheerful",
      },
    ],
    "11labs": [
      {
        id: "29vD33N1CtxCmqQRPOHJ",
        name: "Josh (Male)",
        gender: "male",
        description: "Professional, clear",
      },
      {
        id: "pqHfZKP75CvOlQylNhV4",
        name: "Bill (Male)",
        gender: "male",
        description: "Warm, friendly",
      },
      {
        id: "qBDvhofpxp92JgXJxDjB",
        name: "Rachel (Female)",
        gender: "female",
        description: "Professional, articulate",
      },
      {
        id: "oWAxZDx7w5VEj9dCyTzz",
        name: "Grace (Female)",
        gender: "female",
        description: "Warm, empathetic",
      },
    ],
    azure: [
      {
        id: "en-US-AriaNeural",
        name: "Aria",
        gender: "female",
        description: "Clear, professional",
      },
      {
        id: "en-US-GuyNeural",
        name: "Guy",
        gender: "male",
        description: "Warm, confident",
      },
      {
        id: "en-US-JennyNeural",
        name: "Jenny",
        gender: "female",
        description: "Friendly, optimistic",
      },
      {
        id: "en-US-DavisNeural",
        name: "Davis",
        gender: "male",
        description: "Clear, assertive",
      },
    ],
  };

  // Auto-generate system prompt when relevant fields change
  useEffect(() => {
    if (promptConfig.useTemplate && agentData.name && agentData.industry) {
      generateSystemPrompt();
    }
  }, [
    agentData.name,
    agentData.industry,
    agentData.businessName,
    agentData.communicationStyle,
    agentData.primaryTasks,
    promptConfig,
  ]);

  const generateSystemPrompt = () => {
    const prompt = promptGenerator.generateSystemPrompt({
      agentName: agentData.name,
      industry: agentData.industry,
      businessName: agentData.businessName || "our company",
      communicationStyle: agentData.communicationStyle,
      primaryTasks: agentData.primaryTasks,
      firstMessage: agentData.firstMessage,
      customInstructions: agentData.customInstructions,
      includeVariables: promptConfig.includeVariables,
      includeErrorHandling: promptConfig.includeErrorHandling,
    });

    setAgentData((prev) => ({ ...prev, systemPrompt: prompt }));
  };

  const generateFirstMessageSuggestions = () => {
    return promptGenerator.generateFirstMessageSuggestions(
      agentData.industry,
      agentData.businessName || "our company",
      agentData.name
    );
  };

  const handleInputChange = (field, value) => {
    setAgentData((prev) => ({ ...prev, [field]: value }));
  };

  const handleTaskToggle = (task) => {
    setAgentData((prev) => ({
      ...prev,
      primaryTasks: prev.primaryTasks.includes(task)
        ? prev.primaryTasks.filter((t) => t !== task)
        : [...prev.primaryTasks, task],
    }));
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }

      // Check file type
      const allowedTypes = [
        "text/plain",
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword",
      ];

      if (!allowedTypes.includes(file.type)) {
        toast.error("Only .txt, .pdf, .docx, and .doc files are allowed");
        return;
      }

      setSelectedFile(file);

      // Convert file to base64
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target.result.split(",")[1]; // Remove data:type;base64, prefix
        setAgentData((prev) => ({
          ...prev,
          knowledgeBaseFile: base64,
          knowledgeBaseFileName: file.name,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await createAgent(agentData);
      toast.success("Agent created successfully!");
      navigate("/agents");
    } catch (error) {
      toast.error(
        "Failed to create agent: " + (error.message || "Unknown error")
      );
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderBasicInfoStep();
      case 2:
        return renderAIConfigStep();
      case 3:
        return renderKnowledgeBaseStep();
      case 4:
        return renderVoiceStep();
      case 5:
        return renderPromptStep();
      case 6:
        return renderReviewStep();
      default:
        return null;
    }
  };

  const renderBasicInfoStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Basic Information
        </h3>
        <p className="text-gray-600 mb-6">
          Let's start with the basics about your AI agent.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Agent Name *
          </label>
          <input
            type="text"
            value={agentData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Sarah, Alex, Customer Service Bot"
          />
          <p className="text-xs text-gray-500 mt-1">
            This is how your agent will introduce itself
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Business Name
          </label>
          <input
            type="text"
            value={agentData.businessName}
            onChange={(e) => handleInputChange("businessName", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., TechFlow Solutions, ABC Medical"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Industry *
          </label>
          <select
            value={agentData.industry}
            onChange={(e) => handleInputChange("industry", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select industry</option>
            {industries.map((industry) => (
              <option key={industry} value={industry}>
                {industry}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Communication Style
          </label>
          <select
            value={agentData.communicationStyle}
            onChange={(e) =>
              handleInputChange("communicationStyle", e.target.value)
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {communicationStyles.map((style) => (
              <option key={style.id} value={style.id}>
                {style.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            {
              communicationStyles.find(
                (s) => s.id === agentData.communicationStyle
              )?.description
            }
          </p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Primary Tasks
        </label>
        <p className="text-xs text-gray-500 mb-3">
          Select the main functions your agent will handle
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {primaryTaskOptions.map((task) => (
            <label key={task} className="flex items-center">
              <input
                type="checkbox"
                checked={agentData.primaryTasks.includes(task)}
                onChange={() => handleTaskToggle(task)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                {task
                  .replace("_", " ")
                  .replace(/\b\w/g, (l) => l.toUpperCase())}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description (Optional)
        </label>
        <textarea
          value={agentData.description}
          onChange={(e) => handleInputChange("description", e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Brief description of what this agent does..."
        />
      </div>
    </div>
  );

  const renderAIConfigStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          AI Model Configuration
        </h3>
        <p className="text-gray-600 mb-6">
          Choose the AI model that will power your agent's intelligence.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {models.map((model) => (
          <div
            key={model.id}
            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
              agentData.model === model.id
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
            onClick={() => handleInputChange("model", model.id)}
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">{model.name}</h4>
                <p className="text-sm text-gray-600">{model.description}</p>
                <p className="text-xs text-gray-500">
                  Provider: {model.provider}
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">
                  Cost varies by usage
                </div>
                <div className="text-xs text-gray-500">~150 tokens/min</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Model Selection Tips:</p>
            <ul className="space-y-1">
              <li>
                • <strong>GPT-4o:</strong> Best balance of performance and cost
                for most use cases
              </li>
              <li>
                • <strong>GPT-4:</strong> More expensive but excellent for
                complex tasks
              </li>
              <li>
                • <strong>GPT-3.5 Turbo:</strong> Most cost-effective for simple
                interactions
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  const renderKnowledgeBaseStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Knowledge Base (Optional)
        </h3>
        <p className="text-gray-600 mb-6">
          Upload a file to give your agent specific knowledge about your
          business, products, or services.
        </p>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Knowledge Base Name
            </label>
            <input
              type="text"
              value={agentData.knowledgeBaseName}
              onChange={(e) =>
                handleInputChange("knowledgeBaseName", e.target.value)
              }
              placeholder="e.g., Company FAQ, Product Manual"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Knowledge File
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-2">
                <label
                  htmlFor="knowledge-file-upload"
                  className="cursor-pointer"
                >
                  <span className="text-blue-600 hover:text-blue-500">
                    Click to upload
                  </span>
                  <span className="text-gray-500"> or drag and drop</span>
                </label>
                <input
                  id="knowledge-file-upload"
                  type="file"
                  className="hidden"
                  accept=".txt,.pdf,.docx,.doc"
                  onChange={handleFileUpload}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                PDF, DOCX, DOC, TXT files up to 10MB
              </p>
            </div>

            {selectedFile && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  <span className="text-sm text-green-700">
                    File uploaded: {selectedFile.name}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderVoiceStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Voice & Speech Configuration
        </h3>
        <p className="text-gray-600 mb-6">
          Configure how your agent will sound when speaking.
        </p>
      </div>

      {/* Voice Provider Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Voice Provider
        </label>
        <div className="grid grid-cols-1 gap-3">
          {voiceProviders.map((provider) => (
            <div
              key={provider.id}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                agentData.voiceProvider === provider.id
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() => handleInputChange("voiceProvider", provider.id)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">{provider.name}</h4>
                  <p className="text-sm text-gray-600">
                    {provider.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Voice Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Voice ({agentData.voiceProvider})
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {voices[agentData.voiceProvider]?.map((voice) => (
            <div
              key={voice.id}
              className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                agentData.voice === voice.id
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() => {
                handleInputChange("voice", voice.id);
                handleInputChange("voiceGender", voice.gender);
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">{voice.name}</h4>
                  <p className="text-sm text-gray-600">{voice.description}</p>
                  <p className="text-xs text-gray-500 capitalize">
                    {voice.gender}
                  </p>
                </div>
                <Mic
                  className={`h-5 w-5 ${
                    agentData.voice === voice.id
                      ? "text-blue-600"
                      : "text-gray-400"
                  }`}
                />
              </div>
            </div>
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
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="en-US">English (US)</option>
          <option value="en-GB">English (UK)</option>
          <option value="es-ES">Spanish</option>
          <option value="fr-FR">French</option>
          <option value="de-DE">German</option>
          <option value="it-IT">Italian</option>
          <option value="pt-BR">Portuguese (BR)</option>
        </select>
      </div>
    </div>
  );

  const renderPromptStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Prompt & Personality
        </h3>
        <p className="text-gray-600 mb-6">
          Configure your agent's personality and conversation flow.
        </p>
      </div>

      {/* Template Options */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-gray-900">Prompt Generation</h4>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={promptConfig.useTemplate}
              onChange={(e) =>
                setPromptConfig((prev) => ({
                  ...prev,
                  useTemplate: e.target.checked,
                }))
              }
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">
              Use AI-generated template
            </span>
          </label>
        </div>

        {promptConfig.useTemplate && (
          <div className="grid grid-cols-2 gap-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={promptConfig.includeVariables}
                onChange={(e) =>
                  setPromptConfig((prev) => ({
                    ...prev,
                    includeVariables: e.target.checked,
                  }))
                }
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                Include variable capture
              </span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={promptConfig.includeErrorHandling}
                onChange={(e) =>
                  setPromptConfig((prev) => ({
                    ...prev,
                    includeErrorHandling: e.target.checked,
                  }))
                }
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                Include error handling
              </span>
            </label>
          </div>
        )}

        {promptConfig.useTemplate && (
          <button
            onClick={generateSystemPrompt}
            className="mt-3 flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Regenerate prompt</span>
          </button>
        )}
      </div>

      {/* First Message */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          First Message
        </label>
        <textarea
          value={agentData.firstMessage}
          onChange={(e) => handleInputChange("firstMessage", e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="How should your agent greet callers?"
        />

        {agentData.industry && agentData.name && (
          <div className="mt-2">
            <p className="text-xs text-gray-500 mb-2">Suggestions:</p>
            <div className="space-y-1">
              {generateFirstMessageSuggestions()
                .slice(0, 2)
                .map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() =>
                      handleInputChange("firstMessage", suggestion)
                    }
                    className="block w-full text-left text-xs text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded p-2"
                  >
                    {suggestion}
                  </button>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* System Prompt */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          System Prompt
        </label>
        <textarea
          value={agentData.systemPrompt}
          onChange={(e) => handleInputChange("systemPrompt", e.target.value)}
          rows={12}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          placeholder="System prompt will be generated automatically or you can write your own..."
        />
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-gray-500">
            {agentData.systemPrompt.length} characters
          </p>
          {agentData.systemPrompt && (
            <button
              onClick={() =>
                navigator.clipboard.writeText(agentData.systemPrompt)
              }
              className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-700"
            >
              <Copy className="h-3 w-3" />
              <span>Copy</span>
            </button>
          )}
        </div>
      </div>

      {/* Custom Instructions */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Additional Instructions (Optional)
        </label>
        <textarea
          value={agentData.customInstructions}
          onChange={(e) =>
            handleInputChange("customInstructions", e.target.value)
          }
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Any specific instructions or requirements for your agent..."
        />
      </div>
    </div>
  );

  const renderReviewStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Review & Pricing
        </h3>
        <p className="text-gray-600 mb-6">
          Review your agent configuration and estimated costs.
        </p>
      </div>

      {/* Agent Summary */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="font-medium text-gray-900 mb-4">Agent Summary</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Name:</span>
            <span className="ml-2 font-medium">{agentData.name}</span>
          </div>
          <div>
            <span className="text-gray-500">Industry:</span>
            <span className="ml-2 font-medium">{agentData.industry}</span>
          </div>
          <div>
            <span className="text-gray-500">Model:</span>
            <span className="ml-2 font-medium">{agentData.model}</span>
          </div>
          <div>
            <span className="text-gray-500">Voice:</span>
            <span className="ml-2 font-medium">{agentData.voiceProvider}</span>
          </div>
          <div>
            <span className="text-gray-500">Style:</span>
            <span className="ml-2 font-medium capitalize">
              {agentData.communicationStyle}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Tasks:</span>
            <span className="ml-2 font-medium">
              {agentData.primaryTasks.length} selected
            </span>
          </div>
        </div>
      </div>

      {/* Pricing Display */}
      <PricingDisplay
        agentConfig={{
          model: agentData.model,
          voiceProvider: agentData.voiceProvider,
          systemPrompt: agentData.systemPrompt,
        }}
        showDetailedBreakdown={true}
        showRecommendations={true}
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/agents")}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Create New Agent
                </h1>
                <p className="text-sm text-gray-600">
                  Step {currentStep} of {steps.length}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate("/agents/create/simple")}
                className="text-sm text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md"
              >
                Switch to Simple Form
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between mb-8">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`flex items-center ${
                index < steps.length - 1 ? "flex-1" : ""
              }`}
            >
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                  currentStep >= step.id
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-gray-300 bg-white text-gray-500"
                }`}
              >
                <step.icon className="h-4 w-4" />
              </div>
              <div className="ml-3">
                <p
                  className={`text-sm font-medium ${
                    currentStep >= step.id ? "text-blue-600" : "text-gray-500"
                  }`}
                >
                  {step.name}
                </p>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-4 ${
                    currentStep > step.id ? "bg-blue-600" : "bg-gray-300"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
              currentStep === 1
                ? "text-gray-400 cursor-not-allowed"
                : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
            }`}
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Previous</span>
          </button>

          <div className="flex items-center space-x-3">
            {currentStep === steps.length ? (
              <button
                onClick={handleSubmit}
                disabled={loading || !agentData.name || !agentData.industry}
                className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Create Agent</span>
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={nextStep}
                disabled={!agentData.name || !agentData.industry}
                className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Next</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentCreationWizard;
