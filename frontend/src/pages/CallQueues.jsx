import React, { useState } from "react";
import { Clock, Phone, User, ArrowUp, ArrowDown } from "lucide-react";
import {
  PageTransition,
  CardHover,
  LoadingSpinner,
} from "../components/AnimationComponents";
import { useCalls } from "../hooks/useApi";

const CallQueues = () => {
  const { calls, loading, error } = useCalls();
  const [sortBy, setSortBy] = useState("timestamp");
  const [sortOrder, setSortOrder] = useState("desc");

  // Filter for queued calls
  const queuedCalls = calls.filter((call) => call.status === "queued");

  // Sort queued calls
  const sortedCalls = [...queuedCalls].sort((a, b) => {
    let aValue, bValue;

    switch (sortBy) {
      case "timestamp":
        aValue = new Date(a.created_at);
        bValue = new Date(b.created_at);
        break;
      case "priority":
        aValue = a.priority || 0;
        bValue = b.priority || 0;
        break;
      case "waitTime":
        aValue = Date.now() - new Date(a.created_at);
        bValue = Date.now() - new Date(b.created_at);
        break;
      default:
        aValue = a[sortBy];
        bValue = b[sortBy];
    }

    if (sortOrder === "asc") {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const formatWaitTime = (timestamp) => {
    const waitTime = Date.now() - new Date(timestamp);
    const minutes = Math.floor(waitTime / (1000 * 60));
    const seconds = Math.floor((waitTime % (1000 * 60)) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
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

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  if (loading) {
    return (
      <PageTransition>
        <div className="p-6">
          <LoadingSpinner size="large" text="Loading call queues..." />
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Call Queues</h1>
        <p className="text-gray-600 mt-2">
          Manage incoming calls waiting to be answered
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <CardHover className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Phone className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">In Queue</p>
              <p className="text-2xl font-bold text-gray-900">
                {queuedCalls.length}
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
              <p className="text-sm text-gray-600">Avg Wait Time</p>
              <p className="text-2xl font-bold text-gray-900">
                {queuedCalls.length > 0
                  ? formatWaitTime(
                      new Date(
                        Date.now() -
                          queuedCalls.reduce(
                            (acc, call) =>
                              acc + (Date.now() - new Date(call.created_at)),
                            0
                          ) /
                            queuedCalls.length
                      )
                    )
                  : "0:00"}
              </p>
            </div>
          </div>
        </CardHover>

        <CardHover className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <ArrowUp className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">High Priority</p>
              <p className="text-2xl font-bold text-gray-900">
                {queuedCalls.filter((call) => call.priority === "high").length}
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
              <p className="text-sm text-gray-600">Longest Wait</p>
              <p className="text-2xl font-bold text-gray-900">
                {queuedCalls.length > 0
                  ? formatWaitTime(
                      Math.min(
                        ...queuedCalls.map((call) => new Date(call.created_at))
                      )
                    )
                  : "0:00"}
              </p>
            </div>
          </div>
        </CardHover>
      </div>

      {/* Queue Management */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Call Queue</h2>
            <div className="flex items-center space-x-4">
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split("-");
                  setSortBy(field);
                  setSortOrder(order);
                }}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="timestamp-desc">Newest First</option>
                <option value="timestamp-asc">Oldest First</option>
                <option value="waitTime-desc">Longest Wait</option>
                <option value="waitTime-asc">Shortest Wait</option>
                <option value="priority-desc">High Priority</option>
              </select>
            </div>
          </div>
        </div>

        {queuedCalls.length === 0 ? (
          <div className="p-8 text-center">
            <Phone className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Calls in Queue
            </h3>
            <p className="text-gray-600">
              All incoming calls have been answered or there are no pending
              calls.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {sortedCalls.map((call, index) => (
              <div
                key={call.id}
                className="p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">
                        {index + 1}
                      </span>
                    </div>
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {call.customer_number || "Unknown Number"}
                      </p>
                      <p className="text-sm text-gray-600">
                        Queued: {new Date(call.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6">
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Wait Time</p>
                      <p className="font-medium text-gray-900">
                        {formatWaitTime(call.created_at)}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-gray-600">Priority</p>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(
                          call.priority || "normal"
                        )}`}
                      >
                        {(call.priority || "normal").charAt(0).toUpperCase() +
                          (call.priority || "normal").slice(1)}
                      </span>
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-gray-600">Agent</p>
                      <p className="font-medium text-gray-900">
                        {call.agent_name || "Waiting..."}
                      </p>
                    </div>

                    <div className="flex space-x-2">
                      <button className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors">
                        Answer
                      </button>
                      <button className="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors">
                        Transfer
                      </button>
                    </div>
                  </div>
                </div>

                {/* Additional call info */}
                <div className="mt-4 flex items-center space-x-6 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4" />
                    <span>
                      Position: {index + 1} of {queuedCalls.length}
                    </span>
                  </div>
                  {call.callback_requested && (
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4" />
                      <span>Callback Requested</span>
                    </div>
                  )}
                </div>

                {/* Wait time indicator */}
                <div className="mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-1">
                    <div
                      className={`h-1 rounded-full ${
                        Date.now() - new Date(call.created_at) > 300000
                          ? "bg-red-500"
                          : Date.now() - new Date(call.created_at) > 120000
                          ? "bg-yellow-500"
                          : "bg-green-500"
                      }`}
                      style={{
                        width: `${Math.min(
                          100,
                          ((Date.now() - new Date(call.created_at)) / 300000) *
                            100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  );
};

export default CallQueues;
