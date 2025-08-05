import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAgents } from "../hooks/useApi";
import apiService from "../services/api";
import {
  PageTransition,
  LoadingSpinner,
  CardHover,
  ButtonHover,
} from "../components/AnimationComponents";
import TestCallDialog from "../components/TestCallDialog";
import WebCallDialog from "../components/WebCallDialog";
import toast from "react-hot-toast";
import {
  Plus,
  Bot,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Phone,
  Monitor,
  Play,
  Pause,
  Settings,
  Users,
  Calendar,
  Activity,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

// Make the web call handler available globally for the button
window.handleWebCall = null;

const AgentCard = ({
  agent,
  onView,
  onEdit,
  onDelete,
  onTest,
  deletingAgent,
  testingAgent,
}) => {
  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "text-green-600 bg-green-100 border-green-200";
      case "inactive":
        return "text-gray-600 bg-gray-100 border-gray-200";
      case "error":
        return "text-red-600 bg-red-100 border-red-200";
      default:
        return "text-gray-600 bg-gray-100 border-gray-200";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "active":
        return <CheckCircle className="w-4 h-4" />;
      case "inactive":
        return <XCircle className="w-4 h-4" />;
      case "error":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <XCircle className="w-4 h-4" />;
    }
  };

  return (
    <CardHover className="bg-white rounded-lg shadow border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <Bot className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {agent.name}
            </h3>
            <p className="text-sm text-gray-600">{agent.industry}</p>
          </div>
        </div>
        <span
          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
            agent.status
          )}`}
        >
          {getStatusIcon(agent.status)}
          <span className="ml-1">{agent.status}</span>
        </span>
      </div>

      <div className="mb-4">
        <p className="text-sm text-gray-600 line-clamp-2">
          {agent.description || "No description provided"}
        </p>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Role:</span>
          <span className="font-medium">{agent.role}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Model:</span>
          <span className="font-medium">{agent.model}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Voice:</span>
          <span className="font-medium capitalize">{agent.voice}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Created:</span>
          <span className="font-medium">
            {new Date(agent.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>

      <div className="flex space-x-2 mb-2">
        <ButtonHover
          onClick={() => onView(agent)}
          className="flex-1 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 flex items-center justify-center space-x-1"
        >
          <Eye className="w-3 h-3" />
          <span>View</span>
        </ButtonHover>

        <ButtonHover
          onClick={() => onEdit(agent)}
          className="flex-1 px-3 py-2 text-sm font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200 flex items-center justify-center space-x-1"
        >
          <Edit className="w-3 h-3" />
          <span>Edit</span>
        </ButtonHover>

        <ButtonHover
          onClick={() => onDelete(agent.id)}
          disabled={deletingAgent === agent.id}
          className="px-3 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 disabled:opacity-50"
        >
          {deletingAgent === agent.id ? (
            <div className="w-3 h-3 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <Trash2 className="w-3 h-3" />
          )}
        </ButtonHover>
      </div>

      {/* Call options */}
      <div className="flex space-x-2">
        <ButtonHover
          onClick={() => onTest(agent)}
          disabled={testingAgent === agent.id}
          className="flex-1 px-3 py-2 text-sm font-medium text-purple-700 bg-purple-100 rounded-md hover:bg-purple-200 disabled:opacity-50 flex items-center justify-center space-x-1"
        >
          {testingAgent === agent.id ? (
            <>
              <div className="w-3 h-3 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
              <span>Testing...</span>
            </>
          ) : (
            <>
              <Phone className="w-3 h-3" />
              <span>Phone Call</span>
            </>
          )}
        </ButtonHover>

        <ButtonHover
          onClick={() => window.handleWebCall(agent)}
          className="flex-1 px-3 py-2 text-sm font-medium text-cyan-700 bg-cyan-100 rounded-md hover:bg-cyan-200 flex items-center justify-center space-x-1"
        >
          <Monitor className="w-3 h-3" />
          <span>Web Call</span>
        </ButtonHover>
      </div>
    </CardHover>
  );
};

const AgentViewModal = ({ agent, isOpen, onClose }) => {
  if (!isOpen || !agent) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Bot className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {agent.name}
                </h2>
                <p className="text-gray-600">{agent.industry}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Agent Details
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Role
                </label>
                <p className="text-gray-900">{agent.role}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Status
                </label>
                <p className="text-gray-900 capitalize">{agent.status}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Model
                </label>
                <p className="text-gray-900">{agent.model}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Voice
                </label>
                <p className="text-gray-900 capitalize">{agent.voice}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Language
                </label>
                <p className="text-gray-900">{agent.language}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  VAPI ID
                </label>
                <p className="text-gray-900 text-sm font-mono">
                  {agent.vapi_id || "Not synced"}
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Description
            </h3>
            <p className="text-gray-700">
              {agent.description || "No description provided"}
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              First Message
            </h3>
            <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
              {agent.first_message || "Hello! How can I help you today?"}
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              System Prompt
            </h3>
            <p className="text-gray-700 bg-gray-50 p-3 rounded-lg max-h-40 overflow-y-auto">
              {agent.system_prompt || "No system prompt configured"}
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Timestamps
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Created
                </label>
                <p className="text-gray-900">
                  {new Date(agent.created_at).toLocaleString()}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Updated
                </label>
                <p className="text-gray-900">
                  {new Date(agent.updated_at).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Agents = () => {
  const navigate = useNavigate();
  const { agents, loading, error, fetchAgents, deleteAgent, refetch } =
    useAgents();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [viewAgent, setViewAgent] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingAgent, setDeletingAgent] = useState(null);
  const [testingAgent, setTestingAgent] = useState(null);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [webCallDialogOpen, setWebCallDialogOpen] = useState(false);
  const [agentToTest, setAgentToTest] = useState(null);

  // Set the global web call handler to be accessible from AgentCard
  useEffect(() => {
    window.handleWebCall = handleWebCall;
    return () => {
      window.handleWebCall = null;
    };
  }, []);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleView = (agent) => {
    setViewAgent(agent);
  };

  const handleEdit = (agent) => {
    navigate(`/agents/create/simple?edit=${agent.id}`, { state: { agent } });
  };

  const handleDelete = async (agentId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this agent? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      setDeletingAgent(agentId);
      await deleteAgent(agentId);
    } catch (error) {
      toast.error("Failed to delete agent");
    } finally {
      setDeletingAgent(null);
    }
  };

  const handleTest = (agent) => {
    setAgentToTest(agent);
    setTestDialogOpen(true);
  };

  const handleWebCall = (agent) => {
    setAgentToTest(agent);
    setWebCallDialogOpen(true);
  };

  const handleTestCall = async (agent, phoneNumber) => {
    try {
      setTestingAgent(agent.id);

      // Use the API service for test call
      const result = await apiService.testAgent(agent.id, phoneNumber);

      toast.success(
        "Test call initiated successfully! You should receive a call shortly."
      );
      console.log("Test call result:", result);
      setTestDialogOpen(false);
    } catch (error) {
      console.error("Test call error:", error);
      const errorMessage =
        error.response?.data?.detail ||
        error.message ||
        "Failed to initiate test call";
      toast.error(errorMessage);
    } finally {
      setTestingAgent(null);
    }
  };

  const statuses = [
    { id: "all", name: "All Statuses" },
    { id: "active", name: "Active" },
    { id: "inactive", name: "Inactive" },
    { id: "error", name: "Error" },
  ];

  const filteredAgents = agents.filter((agent) => {
    const matchesSearch =
      agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.industry.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || agent.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <PageTransition>
        <div className="p-6">
          <LoadingSpinner size="large" text="Loading agents..." />
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Agents</h1>
            <p className="text-gray-600 mt-1">
              Manage your AI voice agents and their configurations
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-2">
            <ButtonHover
              onClick={handleRefresh}
              disabled={refreshing}
              className="bg-gray-100 text-gray-600 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-200 flex items-center space-x-2 disabled:opacity-50"
            >
              <RefreshCw
                className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
              />
              <span>Refresh</span>
            </ButtonHover>
            <ButtonHover
              onClick={() => navigate("/agents/create")}
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create Agent</span>
            </ButtonHover>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search agents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {statuses.map((status) => (
                <option key={status.id} value={status.id}>
                  {status.name}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-4 sm:mt-0 text-sm text-gray-600">
            {filteredAgents.length} of {agents.length} agents
          </div>
        </div>

        {/* Agents Grid */}
        {filteredAgents.length === 0 ? (
          <div className="text-center py-12">
            <Bot className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? "No agents found" : "No agents created yet"}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm
                ? "Try adjusting your search criteria"
                : "Create your first AI agent to get started"}
            </p>
            {!searchTerm && (
              <ButtonHover
                onClick={() => navigate("/agents/create")}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Agent
              </ButtonHover>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAgents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onTest={handleTest}
                deletingAgent={deletingAgent}
                testingAgent={testingAgent}
              />
            ))}
          </div>
        )}
      </div>

      {/* Agent View Modal */}
      <AgentViewModal
        agent={viewAgent}
        isOpen={!!viewAgent}
        onClose={() => setViewAgent(null)}
      />

      {/* Test Call Dialog */}
      <TestCallDialog
        isOpen={testDialogOpen}
        onClose={() => {
          setTestDialogOpen(false);
          setAgentToTest(null);
        }}
        onTest={handleTestCall}
        agent={agentToTest}
        isLoading={testingAgent === agentToTest?.id}
      />

      {/* Web Call Dialog */}
      <WebCallDialog
        isOpen={webCallDialogOpen}
        onClose={() => {
          setWebCallDialogOpen(false);
          setAgentToTest(null);
        }}
        agent={agentToTest}
        isLoading={testingAgent === agentToTest?.id}
      />
    </PageTransition>
  );
};

export default Agents;
