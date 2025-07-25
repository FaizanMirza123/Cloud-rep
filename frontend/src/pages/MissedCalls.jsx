import React, { useState } from "react";
import {
  PhoneMissed,
  Phone,
  Calendar,
  Clock,
  User,
  PhoneCall,
} from "lucide-react";
import {
  PageTransition,
  CardHover,
  LoadingSpinner,
  ButtonHover,
} from "../components/AnimationComponents";
import { useCalls, usePagination, useSearchFilter } from "../hooks/useApi";
import toast from "react-hot-toast";

const MissedCalls = () => {
  const { missedCalls, loading, error, createCall } = useCalls();
  const [callingBack, setCallingBack] = useState({});

  // Search and filter
  const { filteredData, searchTerm, setSearchTerm } = useSearchFilter(
    missedCalls,
    ["customer_number"]
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

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const callTime = new Date(timestamp);
    const diffMs = now - callTime;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) {
      return `${diffMins} minutes ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hours ago`;
    } else {
      return `${diffDays} days ago`;
    }
  };

  const getMissedCallPriority = (call) => {
    const timeSinceMissed = Date.now() - new Date(call.created_at);
    const hoursAgo = timeSinceMissed / (1000 * 60 * 60);

    if (hoursAgo < 1) return "high";
    if (hoursAgo < 24) return "medium";
    return "low";
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const handleCallBack = async (call) => {
    try {
      setCallingBack((prev) => ({ ...prev, [call.id]: true }));

      const result = await createCall({
        customer_number: call.customer_number,
        agent_id: call.agent_id,
        phone_number_id: call.phone_number_id,
      });

      if (result.success) {
        toast.success("Callback initiated successfully");
      }
    } catch (error) {
      toast.error("Failed to initiate callback");
    } finally {
      setCallingBack((prev) => ({ ...prev, [call.id]: false }));
    }
  };

  const todaysMissedCalls = missedCalls.filter((call) => {
    const today = new Date();
    const callDate = new Date(call.created_at);
    return callDate.toDateString() === today.toDateString();
  });

  const thisWeeksMissedCalls = missedCalls.filter((call) => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return new Date(call.created_at) > weekAgo;
  });

  if (loading) {
    return (
      <PageTransition>
        <div className="p-6">
          <LoadingSpinner size="large" text="Loading missed calls..." />
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Missed Calls</h1>
        <p className="text-gray-600 mt-2">
          Review and follow up on missed incoming calls
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <CardHover className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <PhoneMissed className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Missed</p>
              <p className="text-2xl font-bold text-gray-900">
                {missedCalls.length}
              </p>
            </div>
          </div>
        </CardHover>

        <CardHover className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Today</p>
              <p className="text-2xl font-bold text-gray-900">
                {todaysMissedCalls.length}
              </p>
            </div>
          </div>
        </CardHover>

        <CardHover className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">This Week</p>
              <p className="text-2xl font-bold text-gray-900">
                {thisWeeksMissedCalls.length}
              </p>
            </div>
          </div>
        </CardHover>

        <CardHover className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <PhoneCall className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Need Callback</p>
              <p className="text-2xl font-bold text-gray-900">
                {
                  missedCalls.filter(
                    (call) => getMissedCallPriority(call) === "high"
                  ).length
                }
              </p>
            </div>
          </div>
        </CardHover>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="p-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by phone number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select className="border border-gray-300 rounded-lg px-4 py-2">
              <option>All Time</option>
              <option>Today</option>
              <option>This Week</option>
              <option>This Month</option>
            </select>
            <select className="border border-gray-300 rounded-lg px-4 py-2">
              <option>All Priorities</option>
              <option>High Priority</option>
              <option>Medium Priority</option>
              <option>Low Priority</option>
            </select>
          </div>
        </div>
      </div>

      {/* Missed Calls List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Missed Calls</h2>
        </div>

        {paginatedData.length === 0 ? (
          <div className="p-8 text-center">
            <PhoneMissed className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Missed Calls
            </h3>
            <p className="text-gray-600">
              {searchTerm
                ? "No missed calls match your search criteria."
                : "Great! You haven't missed any calls recently."}
            </p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-200">
              {paginatedData.map((call) => {
                const priority = getMissedCallPriority(call);
                return (
                  <div
                    key={call.id}
                    className="p-6 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                          <PhoneMissed className="w-6 h-6 text-red-600" />
                        </div>

                        <div>
                          <div className="flex items-center space-x-2">
                            <p className="font-medium text-gray-900">
                              {call.customer_number || "Unknown Number"}
                            </p>
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(
                                priority
                              )}`}
                            >
                              {priority.charAt(0).toUpperCase() +
                                priority.slice(1)}{" "}
                              Priority
                            </span>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                            <div className="flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>{formatTimeAgo(call.created_at)}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-3 h-3" />
                              <span>
                                {new Date(call.created_at).toLocaleString()}
                              </span>
                            </div>
                            {call.attempts > 1 && (
                              <div className="flex items-center space-x-1">
                                <Phone className="w-3 h-3" />
                                <span>{call.attempts} attempts</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Last Agent</p>
                          <p className="font-medium text-gray-900">
                            {call.agent_name || "AI Assistant"}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-sm text-gray-600">Duration</p>
                          <p className="font-medium text-gray-900">
                            {call.ring_duration
                              ? `${call.ring_duration}s`
                              : "N/A"}
                          </p>
                        </div>

                        <div className="flex space-x-2">
                          <ButtonHover
                            onClick={() => handleCallBack(call)}
                            disabled={callingBack[call.id]}
                            className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {callingBack[call.id] ? (
                              <div className="flex items-center space-x-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Calling...</span>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-2">
                                <Phone className="w-4 h-4" />
                                <span>Call Back</span>
                              </div>
                            )}
                          </ButtonHover>

                          <button className="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors">
                            Notes
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Additional call details */}
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center space-x-6 text-xs text-gray-500">
                        <span>Call ID: {call.id.slice(-8)}</span>
                        {call.voicemail_left && (
                          <span className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span>Voicemail left</span>
                          </span>
                        )}
                        {call.callback_requested && (
                          <span className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                            <span>Callback requested</span>
                          </span>
                        )}
                      </div>

                      {/* Follow-up urgency indicator */}
                      <div className="flex items-center space-x-2">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            priority === "high"
                              ? "bg-red-500 animate-pulse"
                              : priority === "medium"
                              ? "bg-yellow-500"
                              : "bg-green-500"
                          }`}
                        ></div>
                        <span className="text-xs text-gray-500">
                          {priority === "high"
                            ? "Urgent follow-up needed"
                            : priority === "medium"
                            ? "Follow-up recommended"
                            : "Low priority"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-700">
                    Showing {(currentPage - 1) * 10 + 1} to{" "}
                    {Math.min(currentPage * 10, filteredData.length)} of{" "}
                    {filteredData.length} missed calls
                  </p>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={prevPage}
                      disabled={!hasPrevPage}
                      className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
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
                      )
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
    </PageTransition>
  );
};

export default MissedCalls;
