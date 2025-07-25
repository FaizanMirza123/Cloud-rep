import React, { useState } from "react";
import { useAnalytics } from "../hooks/useAnalytics";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Calendar,
  Download,
  TrendingUp,
  TrendingDown,
  Clock,
  Phone,
  DollarSign,
  Users,
  Activity,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

const Analytics = () => {
  const [timeRange, setTimeRange] = useState("7d");
  const [selectedMetric, setSelectedMetric] = useState("calls");
  const { 
    stats, 
    callVolumeData, 
    callEndReasons, 
    agentPerformance, 
    costBreakdown, 
    loading, 
    error, 
    refreshData, 
    exportData 
  } = useAnalytics(timeRange);

  // Create stats cards from API data
  const statsCards = [
    {
      title: "Total Calls",
      value: stats.totalCalls?.toString() || "0",
      change: `${stats.successRate?.toFixed(1) || 0}% success rate`,
      trend: stats.successRate > 80 ? "up" : stats.successRate > 60 ? "neutral" : "down",
      icon: Phone,
      color: "blue",
    },
    {
      title: "Average Duration",
      value: `${stats.averageDuration?.toFixed(1) || 0}m`,
      change: "Per call",
      trend: "neutral",
      icon: Clock,
      color: "green",
    },
    {
      title: "Total Cost",
      value: `$${stats.totalCost?.toFixed(2) || "0.00"}`,
      change: "Total spent",
      trend: "neutral",
      icon: DollarSign,
      color: "purple",
    },
    {
      title: "Peak Hour",
      value: stats.peakHour !== undefined ? `${stats.peakHour}:00` : "N/A",
      change: "Busiest time",
      trend: "neutral",
      icon: Activity,
      color: "orange",
    },
  ];

  const getIconColor = (color) => {
    const colors = {
      blue: "text-blue-600 bg-blue-100",
      green: "text-green-600 bg-green-100",
      purple: "text-purple-600 bg-purple-100",
      orange: "text-orange-600 bg-orange-100",
      indigo: "text-indigo-600 bg-indigo-100",
      red: "text-red-600 bg-red-100",
    };
    return colors[color] || "text-gray-600 bg-gray-100";
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case "down":
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <div>
              <h3 className="text-sm font-semibold text-red-900">
                Failed to load analytics data
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
            Analytics Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Monitor your AI agents performance and call metrics
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md bg-white text-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <button
            onClick={refreshData}
            disabled={loading}
            className="bg-gray-100 text-gray-600 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-200 flex items-center space-x-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
          <button 
            onClick={exportData}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Date Range Indicator */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          <span className="text-blue-900 font-medium">
            2025-07-18 - 2025-07-25
          </span>
          <span className="text-blue-700">(Last 7 days)</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg ${getIconColor(stat.color)}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
                {getTrendIcon(stat.trend)}
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
                <p className="text-sm text-gray-500 mt-1">{stat.change}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Call Volume Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Total Volume of Calls
            </h2>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span className="text-sm text-gray-600">Inbound Calls</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span className="text-sm text-gray-600">Outbound Calls</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={callVolumeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="inbound"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={{ fill: "#3B82F6" }}
              />
              <Line
                type="monotone"
                dataKey="outbound"
                stroke="#10B981"
                strokeWidth={2}
                dot={{ fill: "#10B981" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Call End Reasons */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            Reasons Call Ended
          </h2>
          <div className="text-center">
            <p className="text-gray-500 text-sm">
              No data available for the selected period
            </p>
            <div className="mt-4">
              <div className="mx-auto w-48 h-48 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-gray-400 text-xs">No Data</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Performing Agents */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Agent Performance
          </h2>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">
                    Agent
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">
                    Total Calls
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">
                    Avg Duration
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">
                    Satisfaction
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="py-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gray-200 rounded-full mr-3"></div>
                          <div className="h-4 bg-gray-200 rounded w-24"></div>
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="h-4 bg-gray-200 rounded w-12"></div>
                      </td>
                      <td className="py-4">
                        <div className="h-4 bg-gray-200 rounded w-16"></div>
                      </td>
                      <td className="py-4">
                        <div className="h-4 bg-gray-200 rounded w-12"></div>
                      </td>
                      <td className="py-4">
                        <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                      </td>
                    </tr>
                  ))
                ) : agentPerformance.length > 0 ? (
                  agentPerformance.map((agent, index) => (
                    <tr key={agent.id}>
                      <td className="py-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                            <Users className="w-4 h-4 text-blue-600" />
                          </div>
                          <span className="text-sm font-medium text-gray-900 truncate max-w-32" title={agent.name}>
                            {agent.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 text-sm text-gray-900">
                        {agent.calls}
                      </td>
                      <td className="py-4 text-sm text-gray-900">
                        {agent.avgDuration.toFixed(1)}m
                      </td>
                      <td className="py-4 text-sm text-gray-900">
                        {agent.successRate.toFixed(1)}%
                      </td>
                      <td className="py-4">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-8 text-center">
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500">No agent data available</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Call Activity
            </h2>
            <button className="text-sm text-blue-600 hover:text-blue-700">
              View All
            </button>
          </div>
        </div>
        <div className="p-6">
          <div className="text-center py-8">
            <Activity className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No recent activity
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Call activity will appear here when your agents start handling
              calls.
            </p>
          </div>
        </div>
      </div>

      {/* Call Insights */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Peak Call Times
          </h3>
          <div className="text-center py-8">
            <Clock className="mx-auto h-8 w-8 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">
              No data available for peak call times
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Call Quality Metrics
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">
                Average Response Time
              </span>
              <span className="text-sm font-medium text-gray-900">N/A</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Call Success Rate</span>
              <span className="text-sm font-medium text-gray-900">N/A</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">
                Customer Satisfaction
              </span>
              <span className="text-sm font-medium text-gray-900">N/A</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Resolution Rate</span>
              <span className="text-sm font-medium text-gray-900">N/A</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
