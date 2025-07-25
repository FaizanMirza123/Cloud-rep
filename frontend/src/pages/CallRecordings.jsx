import React, { useState } from "react";
import {
  Play,
  Pause,
  Download,
  Calendar,
  Clock,
  User,
  Phone,
} from "lucide-react";
import {
  PageTransition,
  CardHover,
  LoadingSpinner,
} from "../components/AnimationComponents";
import { useCalls, usePagination, useSearchFilter } from "../hooks/useApi";

const CallRecordings = () => {
  const { recordings, loading, error } = useCalls();
  const [playingId, setPlayingId] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Search and filter
  const { filteredData, searchTerm, setSearchTerm } = useSearchFilter(
    recordings,
    ["customer_number", "agent_name"]
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
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handlePlayPause = (recordingId) => {
    if (playingId === recordingId) {
      setPlayingId(null);
    } else {
      setPlayingId(recordingId);
    }
  };

  const handleDownload = (recording) => {
    // In a real app, this would download the file
    console.log("Downloading recording:", recording.id);
    // You could use a library like file-saver for actual file downloads
  };

  if (loading) {
    return (
      <PageTransition>
        <div className="p-6">
          <LoadingSpinner size="large" text="Loading recordings..." />
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Call Recordings</h1>
        <p className="text-gray-600 mt-2">
          Listen to and manage your call recordings
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <CardHover className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Play className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Recordings</p>
              <p className="text-2xl font-bold text-gray-900">
                {recordings.length}
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
              <p className="text-sm text-gray-600">Total Duration</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatDuration(
                  recordings.reduce((acc, r) => acc + (r.duration || 0), 0)
                )}
              </p>
            </div>
          </div>
        </CardHover>

        <CardHover className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">This Week</p>
              <p className="text-2xl font-bold text-gray-900">
                {
                  recordings.filter((r) => {
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return new Date(r.created_at) > weekAgo;
                  }).length
                }
              </p>
            </div>
          </div>
        </CardHover>

        <CardHover className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Download className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Storage Used</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatFileSize(
                  recordings.reduce(
                    (acc, r) => acc + (r.file_size || 1024000),
                    0
                  )
                )}
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
                placeholder="Search recordings by phone number or agent..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select className="border border-gray-300 rounded-lg px-4 py-2">
              <option>All Dates</option>
              <option>Today</option>
              <option>This Week</option>
              <option>This Month</option>
            </select>
            <select className="border border-gray-300 rounded-lg px-4 py-2">
              <option>All Agents</option>
              <option>AI Assistant</option>
              <option>Human Agent</option>
            </select>
          </div>
        </div>
      </div>

      {/* Recordings List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recordings</h2>
        </div>

        {paginatedData.length === 0 ? (
          <div className="p-8 text-center">
            <Play className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Recordings Found
            </h3>
            <p className="text-gray-600">
              {searchTerm
                ? "No recordings match your search criteria."
                : "No call recordings available yet."}
            </p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-200">
              {paginatedData.map((recording) => (
                <div
                  key={recording.id}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => handlePlayPause(recording.id)}
                        className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center hover:bg-blue-200 transition-colors"
                      >
                        {playingId === recording.id ? (
                          <Pause className="w-5 h-5 text-blue-600" />
                        ) : (
                          <Play className="w-5 h-5 text-blue-600 ml-1" />
                        )}
                      </button>

                      <div>
                        <div className="flex items-center space-x-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <p className="font-medium text-gray-900">
                            {recording.customer_number || "Unknown Number"}
                          </p>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                          <div className="flex items-center space-x-1">
                            <User className="w-3 h-3" />
                            <span>
                              {recording.agent_name || "AI Assistant"}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>
                              {new Date(
                                recording.created_at
                              ).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>
                              {formatDuration(recording.duration || 0)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Quality</p>
                        <div className="flex items-center space-x-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <div
                              key={star}
                              className={`w-3 h-3 rounded-full ${
                                star <= (recording.quality || 4)
                                  ? "bg-yellow-400"
                                  : "bg-gray-200"
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-sm text-gray-600">File Size</p>
                        <p className="font-medium text-gray-900">
                          {formatFileSize(recording.file_size || 1024000)}
                        </p>
                      </div>

                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleDownload(recording)}
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Download Recording"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Audio Player (when playing) */}
                  {playingId === recording.id && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-600">
                          {formatDuration(currentTime)}
                        </span>
                        <div className="flex-1 bg-gray-200 rounded-full h-2 cursor-pointer">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${
                                duration > 0
                                  ? (currentTime / duration) * 100
                                  : 0
                              }%`,
                            }}
                          />
                        </div>
                        <span className="text-sm text-gray-600">
                          {formatDuration(duration)}
                        </span>
                      </div>

                      {/* Transcript Preview */}
                      {recording.transcript && (
                        <div className="mt-3 p-3 bg-white rounded border">
                          <p className="text-sm text-gray-600 mb-1">
                            Transcript:
                          </p>
                          <p className="text-sm text-gray-800 line-clamp-3">
                            {recording.transcript}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
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
                    {filteredData.length} recordings
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

export default CallRecordings;
