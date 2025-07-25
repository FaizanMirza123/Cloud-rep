import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useDashboardData } from "../hooks/useDashboardData";
import {
  Clock,
  Phone,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Bot,
  PhoneCall,
  Users,
  BarChart3,
  Plus,
  Eye,
  Play,
  Trash2,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

const Dashboard = () => {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState("7d");
  const {
    stats,
    recentCalls,
    topAgents,
    allAgents,
    loading,
    error,
    refreshData,
  } = useDashboardData();

  const statsCards = [
    {
      title: "Total Agents",
      value: stats.totalAgents,
      change: `${stats.activeAgents} active`,
      icon: Bot,
      color: "text-blue-600",
    },
    {
      title: "Total Calls",
      value: stats.totalCalls,
      change: `${stats.recentCalls} recent`,
      icon: Phone,
      color: "text-green-600",
    },
    {
      title: "Total Spent",
      value: `$${stats.totalCost}`,
      change: "Last 30 days",
      icon: DollarSign,
      color: "text-purple-600",
    },
    {
      title: "Avg Duration",
      value: `${stats.averageDuration.toFixed(1)}m`,
      change: "Per call",
      icon: Clock,
      color: "text-orange-600",
    },
  ];

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <div>
              <h3 className="text-sm font-semibold text-red-900">
                Failed to load dashboard data
              </h3>
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <button
              onClick={refreshData}
              className="ml-auto bg-red-100 text-red-600 px-3 py-1 rounded text-sm hover:bg-red-200"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.name || "Sana Srithas"}
          </h1>
          <p className="text-gray-600 mt-1">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-2">
          <button
            onClick={refreshData}
            disabled={loading}
            className="bg-gray-100 text-gray-600 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-200 flex items-center space-x-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-500">
                  {stat.title}
                </h3>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {loading ? (
                    <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
                  ) : (
                    stat.value
                  )}
                </p>
                <p className={`text-sm mt-1 text-gray-500`}>{stat.change}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity and AI Agent Performance */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Calls */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Recent Calls
              </h2>
              <Link
                to="/calls"
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                View all
              </Link>
            </div>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="animate-pulse flex items-center justify-between py-2"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-gray-200 rounded-full"></div>
                      <div>
                        <div className="h-4 bg-gray-200 rounded w-20 mb-1"></div>
                        <div className="h-3 bg-gray-200 rounded w-16"></div>
                      </div>
                    </div>
                    <div className="h-3 bg-gray-200 rounded w-12"></div>
                  </div>
                ))}
              </div>
            ) : recentCalls.length > 0 ? (
              <div className="space-y-4">
                {recentCalls.map((call) => (
                  <div
                    key={call.id}
                    className="flex items-center justify-between py-2"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          call.status === "completed"
                            ? "bg-green-400"
                            : call.status === "failed"
                            ? "bg-red-400"
                            : "bg-yellow-400"
                        }`}
                      ></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {call.customer}
                        </p>
                        <p className="text-sm text-gray-500">{call.agent}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-900">{call.duration}</p>
                      <p className="text-xs text-gray-500">{call.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <PhoneCall className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No recent calls</p>
              </div>
            )}
          </div>
        </div>

        {/* Top Performing Agents */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Top Performing Agents
              </h2>
              <Link
                to="/agents"
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                View all
              </Link>
            </div>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="animate-pulse flex items-center justify-between py-3"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                      <div>
                        <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                        <div className="h-3 bg-gray-200 rounded w-16"></div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="h-4 bg-gray-200 rounded w-12 mb-1"></div>
                      <div className="h-3 bg-gray-200 rounded w-8"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : topAgents.length > 0 ? (
              <div className="space-y-4">
                {topAgents.map((agent, index) => (
                  <div
                    key={agent.id}
                    className="flex items-center justify-between py-3"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Bot className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p
                          className="text-sm font-medium text-gray-900 truncate max-w-32"
                          title={agent.name}
                        >
                          {agent.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {agent.calls} calls • {agent.avgDuration}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {agent.successRate}%
                      </p>
                      <p className="text-xs text-gray-500">{agent.cost}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Bot className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No agents found</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Current Agents */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Your AI Agents
            </h2>
            <Link
              to="/agents/create"
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Agent</span>
            </Link>
          </div>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="border border-gray-200 rounded-lg p-4 animate-pulse"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                      <div className="w-2 h-2 bg-gray-200 rounded-full"></div>
                    </div>
                    <div className="w-16 h-5 bg-gray-200 rounded"></div>
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-full mb-4"></div>
                  <div className="flex space-x-2">
                    <div className="flex-1 h-8 bg-gray-200 rounded"></div>
                    <div className="w-12 h-8 bg-gray-200 rounded"></div>
                    <div className="w-12 h-8 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : allAgents.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allAgents.map((agent) => (
                <div
                  key={agent.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Bot className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    </div>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      {agent.role}
                    </span>
                  </div>

                  <h3 className="font-semibold text-gray-900 mb-1">
                    {agent.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">{agent.type}</p>
                  <p className="text-xs text-gray-500 mb-4 line-clamp-2">
                    {agent.description}
                  </p>

                  <div className="flex space-x-2">
                    <button className="flex-1 bg-blue-600 text-white py-2 px-3 rounded text-sm font-medium hover:bg-blue-700 flex items-center justify-center space-x-1">
                      <Eye className="w-4 h-4" />
                      <span>View</span>
                    </button>
                    <button className="bg-gray-100 text-gray-600 py-2 px-3 rounded text-sm font-medium hover:bg-gray-200 flex items-center justify-center">
                      <Play className="w-4 h-4" />
                      <span>Test</span>
                    </button>
                    <button className="bg-gray-100 text-gray-600 py-2 px-3 rounded text-sm font-medium hover:bg-gray-200 flex items-center justify-center">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Bot className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No agents yet
              </h3>
              <p className="text-gray-500 mb-6">
                Create your first AI voice agent to get started.
              </p>
              <Link
                to="/agents/create"
                className="bg-blue-600 text-white px-6 py-3 rounded-md text-sm font-medium hover:bg-blue-700 inline-flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Create Your First Agent</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-6">
        <Link
          to="/agents/create"
          className="bg-blue-50 border border-blue-200 rounded-lg p-6 hover:bg-blue-100 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Create Agent</h3>
              <p className="text-sm text-gray-600">
                Set up a new AI voice agent
              </p>
            </div>
          </div>
        </Link>

        <Link
          to="/phone-numbers"
          className="bg-green-50 border border-green-200 rounded-lg p-6 hover:bg-green-100 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
              <Phone className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Get Phone Number</h3>
              <p className="text-sm text-gray-600">
                Purchase or import a number
              </p>
            </div>
          </div>
        </Link>

        <Link
          to="/analytics"
          className="bg-purple-50 border border-purple-200 rounded-lg p-6 hover:bg-purple-100 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">View Analytics</h3>
              <p className="text-sm text-gray-600">Check performance metrics</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
