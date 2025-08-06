import React, { useState } from "react";
import {
  MessageSquare,
  User,
  Bot,
  Clock,
  Copy,
  Download,
  Search,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "react-toastify";

const CallTranscript = ({ call, onClose }) => {
  const [showTimestamps, setShowTimestamps] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Safety check for call object
  if (!call) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <p className="text-red-600">Error: No call data available</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // Safe currency formatter
  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return "N/A";
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) {
      return "N/A";
    }
    return `$${numAmount.toFixed(4)}`;
  };

  // Parse the transcript string into structured messages
  const parseTranscript = (transcriptText) => {
    if (!transcriptText) return [];

    const messages = [];
    const lines = transcriptText.split("\n").filter((line) => line.trim());

    lines.forEach((line, index) => {
      const aiMatch = line.match(/^AI:\s*(.+)$/);
      const userMatch = line.match(/^User:\s*(.+)$/);

      if (aiMatch) {
        messages.push({
          id: index,
          role: "assistant",
          speaker: "AI Assistant",
          message: aiMatch[1].trim(),
          timestamp: new Date(Date.now() + index * 5000).toLocaleTimeString(), // Mock timestamps
        });
      } else if (userMatch) {
        messages.push({
          id: index,
          role: "user",
          speaker: "User",
          message: userMatch[1].trim(),
          timestamp: new Date(Date.now() + index * 5000).toLocaleTimeString(),
        });
      } else if (line.trim()) {
        // Handle lines without clear AI/User prefix
        messages.push({
          id: index,
          role: "unknown",
          speaker: "Unknown",
          message: line.trim(),
          timestamp: new Date(Date.now() + index * 5000).toLocaleTimeString(),
        });
      }
    });

    return messages;
  };

  const messages = parseTranscript(call.transcript);

  // Filter messages based on search term
  const filteredMessages = messages.filter(
    (message) =>
      message.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.speaker.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const copyTranscript = () => {
    const textToCopy = messages
      .map((msg) => `${msg.speaker}: ${msg.message}`)
      .join("\n");

    navigator.clipboard
      .writeText(textToCopy)
      .then(() => toast.success("Transcript copied to clipboard"))
      .catch(() => toast.error("Failed to copy transcript"));
  };

  const downloadTranscript = () => {
    const content = [
      `Call Transcript - ${call.customer_number || "Unknown"} - ${new Date(
        call.created_at
      ).toLocaleString()}`,
      `Agent: ${call.agent_name || "AI Assistant"}`,
      `Duration: ${formatDuration(call.duration)}`,
      `Status: ${call.status}`,
      "",
      ...messages.map(
        (msg) =>
          `${showTimestamps ? `[${msg.timestamp}] ` : ""}${msg.speaker}: ${
            msg.message
          }`
      ),
    ].join("\n");

    const blob = new Blob([content], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `transcript-${call.customer_number || "unknown"}-${
      new Date(call.created_at).toISOString().split("T")[0]
    }.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast.success("Transcript downloaded");
  };

  const formatDuration = (seconds) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getSpeakerIcon = (role) => {
    switch (role) {
      case "assistant":
        return <Bot className="w-5 h-5 text-blue-600" />;
      case "user":
        return <User className="w-5 h-5 text-green-600" />;
      default:
        return <MessageSquare className="w-5 h-5 text-gray-600" />;
    }
  };

  const getSpeakerColor = (role) => {
    switch (role) {
      case "assistant":
        return "bg-blue-50 border-blue-200";
      case "user":
        return "bg-green-50 border-green-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  if (!call) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <MessageSquare className="w-6 h-6 text-blue-600" />
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Call Transcript
                </h2>
                <p className="text-sm text-gray-600">
                  {call.customer_number || "Unknown"} •{" "}
                  {call.agent_name || "AI Assistant"} •{" "}
                  {new Date(call.created_at).toLocaleString()}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ×
            </button>
          </div>

          {/* Controls */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search transcript..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={() => setShowTimestamps(!showTimestamps)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-colors ${
                  showTimestamps
                    ? "bg-blue-50 border-blue-200 text-blue-700"
                    : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                }`}
              >
                {showTimestamps ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
                <span className="text-sm">Timestamps</span>
              </button>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={copyTranscript}
                className="flex items-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                <Copy className="w-4 h-4" />
                <span className="text-sm">Copy</span>
              </button>
              <button
                onClick={downloadTranscript}
                className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                <span className="text-sm">Download</span>
              </button>
            </div>
          </div>
        </div>

        {/* Transcript Messages */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredMessages.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm
                  ? "No matching messages"
                  : "No transcript available"}
              </h3>
              <p className="text-gray-600">
                {searchTerm
                  ? "Try adjusting your search terms."
                  : "This call does not have a transcript recorded."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMessages.map((message, index) => (
                <div
                  key={message.id}
                  className={`flex items-start space-x-3 p-4 rounded-lg border ${getSpeakerColor(
                    message.role
                  )}`}
                >
                  <div className="flex-shrink-0 mt-1">
                    {getSpeakerIcon(message.role)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">
                        {message.speaker}
                      </p>
                      {showTimestamps && (
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          <span>{message.timestamp}</span>
                        </div>
                      )}
                    </div>
                    <p className="mt-1 text-gray-700 whitespace-pre-wrap">
                      {searchTerm
                        ? // Highlight search terms
                          message.message
                            .split(new RegExp(`(${searchTerm})`, "gi"))
                            .map((part, i) =>
                              part.toLowerCase() ===
                              searchTerm.toLowerCase() ? (
                                <mark
                                  key={i}
                                  className="bg-yellow-200 px-1 rounded"
                                >
                                  {part}
                                </mark>
                              ) : (
                                part
                              )
                            )
                        : message.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-4">
              <span>{filteredMessages.length} messages</span>
              <span>Duration: {formatDuration(call.duration)}</span>
              <span>Status: {call.status || "Unknown"}</span>
            </div>
            <span>Cost: {formatCurrency(call.cost)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallTranscript;
