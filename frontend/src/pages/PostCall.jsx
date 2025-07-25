import React, { useState, useEffect } from "react";
import {
  Phone,
  Clock,
  User,
  Calendar,
  Star,
  FileText,
  DollarSign,
  TrendingUp,
  Download,
  Filter,
  Search,
  Eye,
  BarChart3,
  MessageSquare,
} from "lucide-react";
import {
  PageTransition,
  CardHover,
  LoadingSpinner,
  ButtonHover,
} from "../components/AnimationComponents";
import { useCalls, usePagination, useSearchFilter } from "../hooks/useApi";
import toast from "react-hot-toast";

const PostCall = () => {
  const { calls, loading, error, analytics } = useCalls();
  const [selectedCall, setSelectedCall] = useState(null);
  const [viewMode, setViewMode] = useState("list"); // 'list', 'analytics'
  const [filterStatus, setFilterStatus] = useState("all");
  const [dateRange, setDateRange] = useState("all");

  // Filter calls by status
  const filteredByStatus = calls.filter((call) => {
    if (filterStatus === "all") return true;
    return call.status === filterStatus;
  });

  // Search and filter
  const { filteredData, searchTerm, setSearchTerm } = useSearchFilter(
    filteredByStatus,
    ["customer_number", "agent_name", "summary", "cost"]
  );

  // Pagination
  const {
    paginatedData,
    currentPage,
    totalPages,
    goToPage,
    hasNextPage,
    hasPrevPage,
    nextPage,
    prevPage,
  } = usePagination(filteredData, 15);

  const formatDuration = (seconds) => {
    if (!seconds) return "0s";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount || 0);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "busy":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "no-answer":
        return "bg-red-100 text-red-800 border-red-200";
      case "failed":
        return "bg-red-100 text-red-800 border-red-200";
      case "voicemail":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getCallRating = (call) => {
    // Mock rating based on duration and successful completion
    if (call.status === "completed" && call.duration > 60) return 5;
    if (call.status === "completed" && call.duration > 30) return 4;
    if (call.status === "completed") return 3;
    if (call.status === "voicemail") return 2;
    return 1;
  };

  const exportCallLogs = () => {
    const csvContent = [
      [
        "Date",
        "Customer Number",
        "Agent",
        "Duration",
        "Status",
        "Cost",
        "Rating",
        "Summary",
      ].join(","),
      ...filteredData.map((call) =>
        [
          new Date(call.created_at).toLocaleDateString(),
          call.customer_number || "Unknown",
          call.agent_name || "AI Assistant",
          formatDuration(call.duration),
          call.status,
          call.cost || "0.00",
          getCallRating(call),
          `"${call.summary || "No summary available"}"`,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `call-logs-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Call logs exported successfully");
  };

  const CallDetailsModal = ({ call, onClose }) => {
    if (!call) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Call Details</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Basic Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-gray-600">
                      Customer Number
                    </label>
                    <p className="font-medium">
                      {call.customer_number || "Unknown"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Agent</label>
                    <p className="font-medium">
                      {call.agent_name || "AI Assistant"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Date & Time</label>
                    <p className="font-medium">
                      {new Date(call.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Duration</label>
                    <p className="font-medium">
                      {formatDuration(call.duration)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Status</label>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                        call.status
                      )}`}
                    >
                      {call.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Performance Metrics
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-gray-600">Cost</label>
                    <p className="font-medium">{formatCurrency(call.cost)}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Rating</label>
                    <div className="flex items-center space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= getCallRating(call)
                              ? "text-yellow-400 fill-current"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                      <span className="ml-2 text-sm text-gray-600">
                        ({getCallRating(call)}/5)
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Wait Time</label>
                    <p className="font-medium">
                      {call.wait_time ? `${call.wait_time}s` : "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Talk Time</label>
                    <p className="font-medium">
                      {call.talk_time ? formatDuration(call.talk_time) : "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Call Summary */}
            {call.summary && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Call Summary
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700">{call.summary}</p>
                </div>
              </div>
            )}

            {/* Transcript */}
            {call.transcript && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Transcript
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto">
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {call.transcript}
                  </p>
                </div>
              </div>
            )}

            {/* Action Items */}
            {call.action_items && call.action_items.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Action Items
                </h3>
                <ul className="space-y-2">
                  {call.action_items.map((item, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <PageTransition>
        <div className="p-6">
          <LoadingSpinner size="large" text="Loading call logs..." />
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Post-Call Analysis
            </h1>
            <p className="text-gray-600 mt-2">
              Comprehensive call logs and performance analytics
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode("list")}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === "list"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Call Logs
              </button>
              <button
                onClick={() => setViewMode("analytics")}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === "analytics"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Analytics
              </button>
            </div>

            <ButtonHover
              onClick={exportCallLogs}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </ButtonHover>
          </div>
        </div>
      </div>

      {viewMode === "analytics" ? (
        // Analytics View
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <CardHover className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Phone className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Calls</p>
                <p className="text-2xl font-bold text-gray-900">
                  {calls.length}
                </p>
              </div>
            </div>
          </CardHover>

          <CardHover className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(
                    (calls.filter((c) => c.status === "completed").length /
                      calls.length) *
                    100
                  ).toFixed(1)}
                  %
                </p>
              </div>
            </div>
          </CardHover>

          <CardHover className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Avg Duration</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatDuration(
                    Math.round(
                      calls.reduce(
                        (sum, call) => sum + (call.duration || 0),
                        0
                      ) / calls.length
                    )
                  )}
                </p>
              </div>
            </div>
          </CardHover>

          <CardHover className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Cost</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(
                    calls.reduce((sum, call) => sum + (call.cost || 0), 0)
                  )}
                </p>
              </div>
            </div>
          </CardHover>
        </div>
      ) : (
        // Filters and Search
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search calls..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="border border-gray-300 rounded-lg px-4 py-2"
                >
                  <option value="all">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="busy">Busy</option>
                  <option value="no-answer">No Answer</option>
                  <option value="failed">Failed</option>
                  <option value="voicemail">Voicemail</option>
                </select>

                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="border border-gray-300 rounded-lg px-4 py-2"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>
              </div>

              <div className="text-sm text-gray-600">
                Showing {filteredData.length} of {calls.length} calls
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Call Logs Table */}
      {viewMode === "list" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Call Logs</h2>
          </div>

          {paginatedData.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Call Logs
              </h3>
              <p className="text-gray-600">
                {searchTerm
                  ? "No calls match your search criteria."
                  : "No calls have been completed yet."}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date & Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Agent
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Duration
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cost
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rating
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedData.map((call) => (
                      <tr key={call.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {new Date(call.created_at).toLocaleDateString()}
                            </div>
                            <div className="text-sm text-gray-600">
                              {new Date(call.created_at).toLocaleTimeString()}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Phone className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="text-sm font-medium text-gray-900">
                              {call.customer_number || "Unknown"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <User className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-900">
                              {call.agent_name || "AI Assistant"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDuration(call.duration)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                              call.status
                            )}`}
                          >
                            {call.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(call.cost)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-4 h-4 ${
                                  star <= getCallRating(call)
                                    ? "text-yellow-400 fill-current"
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => setSelectedCall(call)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {call.transcript && (
                            <button className="text-green-600 hover:text-green-900">
                              <MessageSquare className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-700">
                      Showing {(currentPage - 1) * 15 + 1} to{" "}
                      {Math.min(currentPage * 15, filteredData.length)} of{" "}
                      {filteredData.length} calls
                    </p>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={prevPage}
                        disabled={!hasPrevPage}
                        className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      {Array.from(
                        { length: Math.min(totalPages, 5) },
                        (_, i) => {
                          const page =
                            Math.max(
                              1,
                              Math.min(
                                totalPages - 4,
                                Math.max(1, currentPage - 2)
                              )
                            ) + i;
                          return (
                            <button
                              key={page}
                              onClick={() => goToPage(page)}
                              className={`px-3 py-1 border rounded text-sm ${
                                currentPage === page
                                  ? "bg-blue-500 text-white border-blue-500"
                                  : "border-gray-300 hover:bg-gray-50"
                              }`}
                            >
                              {page}
                            </button>
                          );
                        }
                      )}
                      <button
                        onClick={nextPage}
                        disabled={!hasNextPage}
                        className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Call Details Modal */}
      {selectedCall && (
        <CallDetailsModal
          call={selectedCall}
          onClose={() => setSelectedCall(null)}
        />
      )}
    </PageTransition>
  );
};

export default PostCall;
