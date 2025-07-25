import React, { useState, useEffect } from "react";
import { Phone, Clock, User, Volume2, PhoneOff } from "lucide-react";
import {
  PageTransition,
  CardHover,
  LoadingSpinner,
} from "../components/AnimationComponents";
import { useCalls } from "../hooks/useApi";

const ActiveCalls = () => {
  const { activeCalls, loading, error } = useCalls();
  const [refreshKey, setRefreshKey] = useState(0);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshKey((prev) => prev + 1);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const getCallStatusColor = (status) => {
    switch (status) {
      case "ringing":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "in-progress":
        return "bg-green-100 text-green-800 border-green-200";
      case "queued":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (loading) {
    return (
      <PageTransition>
        <div className="p-6">
          <LoadingSpinner size="large" text="Loading active calls..." />
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Active Calls</h1>
        <p className="text-gray-600 mt-2">Monitor ongoing calls in real-time</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <CardHover className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Phone className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Active</p>
              <p className="text-2xl font-bold text-gray-900">
                {activeCalls.length}
              </p>
            </div>
          </div>
        </CardHover>

        <CardHover className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Avg Duration</p>
              <p className="text-2xl font-bold text-gray-900">
                {activeCalls.length > 0
                  ? formatDuration(
                      Math.round(
                        activeCalls.reduce(
                          (acc, call) => acc + (call.duration || 0),
                          0
                        ) / activeCalls.length
                      )
                    )
                  : "0:00"}
              </p>
            </div>
          </div>
        </CardHover>

        <CardHover className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Volume2 className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-gray-900">
                {
                  activeCalls.filter((call) => call.status === "in-progress")
                    .length
                }
              </p>
            </div>
          </div>
        </CardHover>
      </div>

      {/* Active Calls List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Live Calls</h2>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600">Auto-refreshing</span>
            </div>
          </div>
        </div>

        {activeCalls.length === 0 ? (
          <div className="p-8 text-center">
            <Phone className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Active Calls
            </h3>
            <p className="text-gray-600">
              There are currently no ongoing calls.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {activeCalls.map((call) => (
              <div
                key={call.id}
                className="p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {call.customer_number || "Unknown Number"}
                      </p>
                      <p className="text-sm text-gray-600">
                        Started:{" "}
                        {new Date(call.started_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Duration</p>
                      <p className="font-medium text-gray-900">
                        {formatDuration(call.duration || 0)}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-gray-600">Agent</p>
                      <p className="font-medium text-gray-900">
                        {call.agent_name || "AI Assistant"}
                      </p>
                    </div>

                    <div className="text-right">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getCallStatusColor(
                          call.status
                        )}`}
                      >
                        {call.status.charAt(0).toUpperCase() +
                          call.status.slice(1)}
                      </span>
                    </div>

                    <div className="flex space-x-2">
                      <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                        <Volume2 className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                        <PhoneOff className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {call.status === "in-progress" && (
                  <div className="mt-4 flex items-center space-x-2">
                    <div className="w-full bg-gray-200 rounded-full h-1">
                      <div
                        className="bg-green-500 h-1 rounded-full animate-pulse"
                        style={{ width: "60%" }}
                      />
                    </div>
                    <span className="text-xs text-green-600 font-medium">
                      LIVE
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  );
};

export default ActiveCalls;
