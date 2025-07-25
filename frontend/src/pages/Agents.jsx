import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Bot,
  Eye,
  Play,
  Trash2,
  Search,
  Filter,
  MoreVertical,
  Settings,
  Copy,
  RefreshCw,
} from "lucide-react";
import vapiService from "../services/vapiService";

const Agents = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [refreshing, setRefreshing] = useState(false);

  // Fetch agents from VAPI API
  const fetchAgents = async () => {
    try {
      setError(null);
      const assistants = await vapiService.listAssistants();

      // Transform VAPI assistant data to match our UI format
      const transformedAgents = assistants.map((assistant) => ({
        id: assistant.id,
        name: assistant.name || "Unnamed Agent",
        type: assistant.metadata?.type || "General",
        role: "Assistant",
        description: assistant.firstMessage || "AI Voice Assistant",
        status: "active", // VAPI assistants are active by default
        createdAt: new Date(assistant.createdAt).toLocaleDateString(),
        lastUsed: "N/A", // Will be calculated from calls
        totalCalls: 0, // Will be calculated from calls
        avgDuration: "0:00", // Will be calculated from calls
        vapiData: assistant, // Store original VAPI data
      }));

      // Fetch call analytics for each agent
      for (const agent of transformedAgents) {
        try {
          const analytics = await vapiService.getAssistantAnalytics(agent.id);
          agent.totalCalls = analytics.totalCalls;
          agent.avgDuration = vapiService.formatDuration(
            analytics.averageDuration * 1000
          );
          agent.lastUsed = analytics.totalCalls > 0 ? "Recently" : "Never";
        } catch (analyticsError) {
          console.warn(
            `Failed to fetch analytics for agent ${agent.id}:`,
            analyticsError
          );
        }
      }

      setAgents(transformedAgents);
    } catch (err) {
      console.error("Failed to fetch agents:", err);
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAgents();
  };

  const filteredAgents = agents.filter((agent) => {
    const matchesSearch =
      agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterStatus === "all" || agent.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "creating":
        return "bg-blue-100 text-blue-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusProgress = (status) => {
    switch (status) {
      case "active":
        return 100;
      case "creating":
        return 83; // Based on the screenshot showing 83%
      default:
        return 0;
    }
  };

  const handleDeleteAgent = async (agentId) => {
    if (window.confirm("Are you sure you want to delete this agent?")) {
      try {
        await vapiService.deleteAssistant(agentId);
        setAgents(agents.filter((agent) => agent.id !== agentId));
      } catch (error) {
        console.error("Failed to delete agent:", error);
        alert("Failed to delete agent. Please try again.");
      }
    }
  };

  const handleTestAgent = (agent) => {
    // Create a test call with this agent
    const testCall = async () => {
      try {
        const callData = {
          assistantId: agent.id,
          // Add other call configuration as needed
        };
        await vapiService.createWebCall(callData);
        alert(`Test call initiated for agent: ${agent.name}`);
      } catch (error) {
        console.error("Failed to create test call:", error);
        alert("Failed to create test call. Please try again.");
      }
    };
    testCall();
  };

  const handleViewAgent = (agent) => {
    // Navigate to agent details or show details modal
    console.log("Viewing agent:", agent);
    // You can implement navigation to a detailed view here
  };

  const handleCopyAgentId = (agentId) => {
    navigator.clipboard.writeText(agentId);
    // You could add a toast notification here
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">Loading agents from VAPI...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-64">
        <div className="text-red-600 mb-4">
          <Bot className="w-12 h-12 mx-auto mb-2" />
          <p className="font-semibold">Failed to load agents</p>
          <p className="text-sm text-gray-600">{error}</p>
        </div>
        <button
          onClick={handleRefresh}
          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 flex items-center space-x-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Agents</h1>
          <p className="text-gray-600 mt-1">
            Manage and monitor your VAPI voice AI agents
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="bg-gray-100 text-gray-600 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-200 flex items-center space-x-2 disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
            />
            <span>Refresh</span>
          </button>
          <Link
            to="/agents/create"
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Agent</span>
          </Link>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search agents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md bg-white text-sm"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="creating">Creating</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Agent Creation Status Banner */}
      {agents.filter((a) => a.status === "creating").length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-blue-900">
                  VAPI Integration Active
                </h3>
                <p className="text-sm text-blue-700">
                  {agents.length} agents loaded from your VAPI account
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Agents Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredAgents.map((agent) => (
          <div
            key={agent.id}
            className="bg-white rounded-lg shadow border border-gray-200 p-6"
          >
            {/* Agent Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Bot className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex flex-col">
                  <span
                    className={`text-xs px-2 py-1 rounded ${getStatusColor(
                      agent.status
                    )} self-start`}
                  >
                    {agent.role}
                  </span>
                </div>
              </div>
              <div className="relative group">
                <button className="p-1 rounded-full hover:bg-gray-100">
                  <MoreVertical className="w-4 h-4 text-gray-400" />
                </button>
                <div className="absolute right-0 mt-1 w-32 bg-white rounded-md shadow-lg py-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <button
                    onClick={() => handleViewAgent(agent)}
                    className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Settings className="w-3 h-3 mr-2" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleCopyAgentId(agent.id)}
                    className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Copy className="w-3 h-3 mr-2" />
                    Copy ID
                  </button>
                </div>
              </div>
            </div>

            {/* Agent Info */}
            <div className="mb-4">
              <h3
                className="font-semibold text-gray-900 mb-1 truncate"
                title={agent.name}
              >
                {agent.name}
              </h3>
              <p className="text-sm text-gray-600 mb-2">{agent.type}</p>
              <p
                className="text-xs text-gray-500 line-clamp-2"
                title={agent.description}
              >
                {agent.description}
              </p>
            </div>

            {/* Progress bar for creating agents */}
            {agent.status === "creating" && (
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                  <span>Setting up agent...</span>
                  <span>{getStatusProgress(agent.status)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${getStatusProgress(agent.status)}%` }}
                  ></div>
                </div>
                {/* Status indicators */}
                <div className="flex justify-between mt-2 text-xs">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-green-600">Connected</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-green-600">Configured</span>
                  </div>
                </div>
              </div>
            )}

            {/* Agent Stats */}
            <div className="mb-4 text-xs text-gray-500">
              <div className="flex justify-between">
                <span>Total Calls</span>
                <span>{agent.totalCalls}</span>
              </div>
              <div className="flex justify-between">
                <span>Avg Duration</span>
                <span>{agent.avgDuration}</span>
              </div>
              <div className="flex justify-between">
                <span>Last Used</span>
                <span>{agent.lastUsed}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2">
              {agent.status === "creating" ? (
                <button
                  onClick={() => handleViewAgent(agent)}
                  className="flex-1 bg-blue-600 text-white py-2 px-3 rounded text-sm font-medium hover:bg-blue-700 flex items-center justify-center space-x-1"
                >
                  <span>Configure</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={() => handleViewAgent(agent)}
                    className="flex-1 bg-blue-600 text-white py-2 px-3 rounded text-sm font-medium hover:bg-blue-700 flex items-center justify-center space-x-1"
                  >
                    <Eye className="w-3 h-3" />
                    <span>View</span>
                  </button>
                  <button
                    onClick={() => handleTestAgent(agent)}
                    className="bg-gray-100 text-gray-600 py-2 px-3 rounded text-sm font-medium hover:bg-gray-200 flex items-center justify-center"
                    title="Test Agent"
                  >
                    <Play className="w-3 h-3" />
                  </button>
                </>
              )}
              <button
                onClick={() => handleDeleteAgent(agent.id)}
                className="bg-red-100 text-red-600 py-2 px-3 rounded text-sm font-medium hover:bg-red-200 flex items-center justify-center"
                title="Delete Agent"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredAgents.length === 0 && (
        <div className="text-center py-12">
          <Bot className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No agents found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || filterStatus !== "all"
              ? "Try adjusting your search or filter criteria."
              : "Get started by creating your first AI agent."}
          </p>
          {!searchTerm && filterStatus === "all" && (
            <div className="mt-6">
              <Link
                to="/agents/create"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Agent
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Agents;
