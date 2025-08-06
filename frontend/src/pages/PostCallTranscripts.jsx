import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  Clock,
  User,
  Calendar,
  FileText,
  Download,
  Search,
  Eye,
  Phone,
  Bot,
  Filter,
} from "lucide-react";
import {
  PageTransition,
  CardHover,
  LoadingSpinner,
  ButtonHover,
} from "../components/AnimationComponents";
import { useCalls, usePagination, useSearchFilter } from "../hooks/useApi";
import CallTranscript from "../components/CallTranscript";
import toast from "react-hot-toast";

const PostCall = () => {
  const { calls, loading, error, fetchCalls } = useCalls();
  const [selectedCall, setSelectedCall] = useState(null);
  const [showTranscriptModal, setShowTranscriptModal] = useState(false);
  const [dateRange, setDateRange] = useState("all");

  // Filter calls that have transcripts
  const callsWithTranscripts = calls.filter(
    (call) => call.transcript && call.transcript.trim()
  );

  // Apply date filtering
  const filteredByDate = callsWithTranscripts.filter((call) => {
    const callDate = new Date(call.created_at);
    const now = new Date();

    switch (dateRange) {
      case "today":
        return callDate.toDateString() === now.toDateString();
      case "week":
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return callDate >= weekAgo;
      case "month":
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return callDate >= monthAgo;
      default:
        return true;
    }
  });

  // Search and filter
  const { filteredData, searchTerm, setSearchTerm } = useSearchFilter(
    filteredByDate,
    ["customer_number", "agent_name", "transcript"]
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
  } = usePagination(filteredData, 10);

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
      minimumFractionDigits: 4,
    }).format(amount || 0);
  };

  // Get conversation preview from transcript
  const getConversationPreview = (transcript) => {
    if (!transcript) return "No transcript available";

    const lines = transcript.split("\n").filter((line) => line.trim());
    const preview = lines.slice(0, 3).join(" • ");
    return preview.length > 100 ? preview.substring(0, 100) + "..." : preview;
  };

  const handleViewTranscript = (call) => {
    setSelectedCall(call);
    setShowTranscriptModal(true);
  };

  const closeTranscriptModal = () => {
    setShowTranscriptModal(false);
    setSelectedCall(null);
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
        "Transcript Preview",
      ].join(","),
      ...filteredData.map((call) =>
        [
          new Date(call.created_at).toLocaleDateString(),
          call.customer_number || "Unknown",
          call.agent_name || "AI Assistant",
          formatDuration(call.duration),
          call.status,
          call.cost || "0.00",
          `"${getConversationPreview(call.transcript)}"`,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `call-transcripts-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Call transcripts exported successfully");
  };

  if (loading) {
    return (
      <PageTransition>
        <div className="p-6">
          <LoadingSpinner size="large" text="Loading call transcripts..." />
        </div>
      </PageTransition>
    );
  }

  if (error) {
    return (
      <PageTransition>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">Error loading calls: {error}</p>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <MessageSquare className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Call Transcripts
              </h1>
              <p className="text-gray-600 mt-1">
                View and analyze conversation logs from your AI assistant calls
              </p>
            </div>
          </div>
          <ButtonHover
            onClick={exportCallLogs}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export Transcripts</span>
          </ButtonHover>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <CardHover className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Transcripts</p>
              <p className="text-2xl font-bold text-gray-900">
                {callsWithTranscripts.length}
              </p>
            </div>
          </div>
        </CardHover>

        <CardHover className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Talk Time</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatDuration(
                  callsWithTranscripts.reduce(
                    (acc, call) => acc + (call.duration || 0),
                    0
                  )
                )}
              </p>
            </div>
          </div>
        </CardHover>

        <CardHover className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Bot className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">AI Responses</p>
              <p className="text-2xl font-bold text-gray-900">
                {callsWithTranscripts.reduce((acc, call) => {
                  const aiResponses =
                    (call.transcript || "").split("AI:").length - 1;
                  return acc + aiResponses;
                }, 0)}
              </p>
            </div>
          </div>
        </CardHover>

        <CardHover className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <User className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">User Messages</p>
              <p className="text-2xl font-bold text-gray-900">
                {callsWithTranscripts.reduce((acc, call) => {
                  const userMessages =
                    (call.transcript || "").split("User:").length - 1;
                  return acc + userMessages;
                }, 0)}
              </p>
            </div>
          </div>
        </CardHover>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search transcripts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>
              </div>
            </div>

            <div className="text-sm text-gray-600">
              Showing {filteredData.length} of {callsWithTranscripts.length}{" "}
              transcripts
            </div>
          </div>
        </div>
      </div>

      {/* Call Transcripts List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Call Transcripts
          </h2>
        </div>

        {paginatedData.length === 0 ? (
          <div className="p-8 text-center">
            <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Call Transcripts
            </h3>
            <p className="text-gray-600">
              {searchTerm
                ? "No transcripts match your search criteria."
                : "No call transcripts available yet. Transcripts will appear here after calls with your AI assistant."}
            </p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-200">
              {paginatedData.map((call) => (
                <div
                  key={call.id}
                  className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => handleViewTranscript(call)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-3">
                        <div className="flex items-center space-x-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-900">
                            {call.customer_number || "Unknown Number"}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Bot className="w-4 h-4 text-blue-500" />
                          <span className="text-sm text-gray-600">
                            {call.agent_name || "AI Assistant"}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {new Date(call.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {formatDuration(call.duration)}
                          </span>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-500 mb-1">
                          Conversation Preview:
                        </p>
                        <p className="text-gray-700 line-clamp-2">
                          {getConversationPreview(call.transcript)}
                        </p>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>Status: {call.status}</span>
                          {call.cost && (
                            <span>Cost: {formatCurrency(call.cost)}</span>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewTranscript(call);
                          }}
                          className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          <span>View Transcript</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-700">
                    Showing {(currentPage - 1) * 10 + 1} to{" "}
                    {Math.min(currentPage * 10, filteredData.length)} of{" "}
                    {filteredData.length} transcripts
                  </p>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={prevPage}
                      disabled={!hasPrevPage}
                      className={`px-3 py-1 rounded border ${
                        hasPrevPage
                          ? "text-gray-700 border-gray-300 hover:bg-gray-50"
                          : "text-gray-400 border-gray-200 cursor-not-allowed"
                      }`}
                    >
                      Previous
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <button
                          key={page}
                          onClick={() => goToPage(page)}
                          className={`px-3 py-1 rounded border ${
                            currentPage === page
                              ? "bg-blue-600 text-white border-blue-600"
                              : "text-gray-700 border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          {page}
                        </button>
                      )
                    )}
                    <button
                      onClick={nextPage}
                      disabled={!hasNextPage}
                      className={`px-3 py-1 rounded border ${
                        hasNextPage
                          ? "text-gray-700 border-gray-300 hover:bg-gray-50"
                          : "text-gray-400 border-gray-200 cursor-not-allowed"
                      }`}
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

      {/* Call Transcript Modal */}
      {showTranscriptModal && selectedCall && (
        <CallTranscript call={selectedCall} onClose={closeTranscriptModal} />
      )}
    </PageTransition>
  );
};

export default PostCall;
