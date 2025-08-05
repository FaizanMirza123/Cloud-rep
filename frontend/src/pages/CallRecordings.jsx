import React, { useState, useRef, useEffect } from "react";
import {
  Play,
  Pause,
  Download,
  Calendar,
  Clock,
  User,
  Phone,
  RefreshCw,
  ExternalLink,
  Volume2,
  VolumeX,
  SkipBack,
  SkipForward,
} from "lucide-react";
import {
  PageTransition,
  CardHover,
  LoadingSpinner,
} from "../components/AnimationComponents";
import { useCalls, usePagination, useSearchFilter } from "../hooks/useApi";
import { toast } from "react-toastify";
import apiService from "../services/api";

const CallRecordings = () => {
  const { recordings, loading, error, fetchRecordings } = useCalls();
  const [playingId, setPlayingId] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [audioBuffered, setAudioBuffered] = useState(0);
  const audioRef = useRef(null);

  // Function to force refresh all recordings
  const refreshAllRecordings = async () => {
    try {
      setIsRefreshing(true);
      const result = await apiService.forceRefreshAllRecordings();
      await fetchRecordings(false); // refresh with no cache
      toast.success(
        `Refreshed ${result.refreshed_count || 0} recordings from ${
          result.agents_processed || 0
        } agents`
      );
    } catch (error) {
      toast.error(
        "Failed to refresh recordings: " + (error.message || "Unknown error")
      );
      console.error("Error refreshing recordings:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

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

  // Add effect to cleanup audio when component unmounts
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
      setPlayingId(null);
      setCurrentTime(0);
      setDuration(0);
      setAudioBuffered(0);
    };
  }, []);

  const handlePlayPause = async (recordingId, recordingUrl) => {
    if (playingId === recordingId) {
      // Pause the currently playing audio
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlayingId(null);
      // Note: Don't reset currentTime here so user can resume from where they paused
    } else {
      // Stop previous audio if any
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }

      try {
        // Test if the recording URL is accessible
        console.log(`Attempting to play recording: ${recordingUrl}`);

        // Create new audio element for this recording
        audioRef.current = new Audio();

        // Set CORS mode for external recordings
        audioRef.current.crossOrigin = "anonymous";
        audioRef.current.preload = "metadata";
        audioRef.current.src = recordingUrl;

        // Set up event listeners
        audioRef.current.addEventListener("loadedmetadata", () => {
          console.log(
            `Audio metadata loaded. Duration: ${audioRef.current.duration}`
          );
          setDuration(audioRef.current.duration);
          audioRef.current.volume = volume; // Set initial volume
        });

        audioRef.current.addEventListener("timeupdate", () => {
          setCurrentTime(audioRef.current.currentTime);
        });

        audioRef.current.addEventListener("ended", () => {
          console.log("Audio playback ended");
          setPlayingId(null);
          setCurrentTime(0);
          setAudioBuffered(0);
          toast.info("Recording finished playing");
        });

        audioRef.current.addEventListener("error", (e) => {
          console.error("Audio error:", e);
          console.error("Audio error details:", audioRef.current.error);

          let errorMessage = "Failed to play recording.";
          if (audioRef.current.error) {
            switch (audioRef.current.error.code) {
              case 1: // MEDIA_ERR_ABORTED
                errorMessage = "Audio playback aborted by user.";
                break;
              case 2: // MEDIA_ERR_NETWORK
                errorMessage = "Network error while loading audio.";
                break;
              case 3: // MEDIA_ERR_DECODE
                errorMessage =
                  "Audio file is corrupted or in unsupported format.";
                break;
              case 4: // MEDIA_ERR_SRC_NOT_SUPPORTED
                errorMessage = "Audio format not supported.";
                break;
              default:
                errorMessage = "Unknown audio error occurred.";
            }
          }

          toast.error(errorMessage);
          setPlayingId(null);
          setCurrentTime(0);
          setAudioBuffered(0);
        });

        audioRef.current.addEventListener("loadstart", () => {
          console.log("Loading started for:", recordingUrl);
        });

        audioRef.current.addEventListener("canplay", () => {
          console.log("Audio can start playing");
        });

        audioRef.current.addEventListener("progress", () => {
          if (audioRef.current.buffered.length > 0) {
            const bufferedEnd = audioRef.current.buffered.end(
              audioRef.current.buffered.length - 1
            );
            const duration = audioRef.current.duration;
            if (duration > 0) {
              const bufferedPercent = (bufferedEnd / duration) * 100;
              setAudioBuffered(bufferedPercent);
              console.log(`Buffer progress: ${bufferedPercent.toFixed(1)}%`);
            }
          }
        });

        // Try to load and play the audio
        console.log("Starting audio playback...");
        await audioRef.current.play();
        setPlayingId(recordingId);
        toast.success("Playing recording...", { autoClose: 2000 });
      } catch (err) {
        console.error("Error playing audio:", err);

        let errorMessage = "Failed to play recording.";
        if (err.name === "NotAllowedError") {
          errorMessage =
            "Audio playback blocked. Please interact with the page first.";
        } else if (err.name === "NotSupportedError") {
          errorMessage = "Audio format not supported by your browser.";
        } else if (err.name === "AbortError") {
          errorMessage = "Audio playback was interrupted.";
        }

        toast.error(errorMessage);
        setPlayingId(null);
      }
    }
  };

  const handleSeek = (e, progressBar) => {
    if (!audioRef.current) return;

    const bounds = progressBar.getBoundingClientRect();
    const x = e.clientX - bounds.left;
    const percent = x / bounds.width;

    if (percent >= 0 && percent <= 1) {
      const newTime = percent * audioRef.current.duration;
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleVolumeChange = (newVolume) => {
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      if (audioRef.current.volume > 0) {
        audioRef.current.volume = 0;
        setVolume(0);
      } else {
        audioRef.current.volume = 1;
        setVolume(1);
      }
    }
  };

  const handleDownload = async (recording) => {
    if (!recording.recording_url) {
      toast.error("No recording URL available");
      return;
    }

    try {
      toast.info("Starting download...");

      // Fetch the audio file
      const response = await fetch(recording.recording_url);
      if (!response.ok) {
        throw new Error("Failed to fetch recording");
      }

      const blob = await response.blob();

      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      // Generate filename with timestamp and call info
      const timestamp = recording.created_at
        ? new Date(recording.created_at).toISOString().slice(0, 10)
        : "unknown";
      const customerNumber = recording.customer_number || "unknown";
      const agentName = recording.agent_name || "agent";

      link.download = `recording-${timestamp}-${agentName}-${customerNumber}.wav`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the blob URL
      window.URL.revokeObjectURL(url);
      toast.success("Recording downloaded successfully");
    } catch (error) {
      console.error("Download error:", error);
      toast.error(
        "Failed to download recording: " + (error.message || "Unknown error")
      );
    }
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
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Call Recordings</h1>
          <p className="text-gray-600 mt-2">
            Listen to and manage your call recordings
          </p>
        </div>
        <button
          onClick={refreshAllRecordings}
          disabled={isRefreshing || loading}
          className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
            isRefreshing || loading
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
        >
          {isRefreshing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Refreshing...</span>
            </>
          ) : (
            <>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                ></path>
              </svg>
              <span>Refresh All Recordings</span>
            </>
          )}
        </button>
      </div>

      {/* Info Panel */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <svg
              className="w-5 h-5 text-blue-600 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-blue-800">
              Recording Sources
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>This page displays recordings from multiple sources:</p>
              <ul className="mt-1 space-y-1 list-disc list-inside">
                <li>
                  <strong>Web Calls:</strong> Calls made through this interface
                </li>
                <li>
                  <strong>External:</strong> Calls made directly through VAPI
                  with your agents
                </li>
                <li>
                  <strong>Phone Calls:</strong> Inbound/outbound calls using
                  your phone numbers
                </li>
              </ul>
            </div>
          </div>
        </div>
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
                        onClick={() =>
                          recording.recording_url
                            ? handlePlayPause(
                                recording.id,
                                recording.recording_url
                              )
                            : toast.error("No recording URL available")
                        }
                        className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center hover:bg-blue-200 transition-colors"
                        disabled={!recording.recording_url}
                        title={
                          recording.recording_url
                            ? "Play/Pause Recording"
                            : "No recording available"
                        }
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
                          {/* Show call type indicator */}
                          {(recording.type === "webCall" ||
                            recording.type === "external") && (
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                recording.type === "webCall"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-purple-100 text-purple-800"
                              }`}
                            >
                              {recording.type === "webCall"
                                ? "Web Call"
                                : "External"}
                              {recording.type === "external" && (
                                <ExternalLink className="w-3 h-3 ml-1" />
                              )}
                            </span>
                          )}
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
                                recording.created_at || recording.started_at
                              ).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>
                              {formatDuration(recording.duration || 0)}
                            </span>
                          </div>
                          {/* Show call source */}
                          <div className="flex items-center space-x-1">
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {recording.direction || "Unknown"} call
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
                          onClick={() =>
                            window.open(recording.recording_url, "_blank")
                          }
                          className="p-2 text-gray-400 hover:text-purple-600 transition-colors"
                          title="Open recording in new tab"
                          disabled={!recording.recording_url}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDownload(recording)}
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                          title={
                            recording.recording_url
                              ? "Download Recording"
                              : "No recording available"
                          }
                          disabled={!recording.recording_url}
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Audio Player (when playing) */}
                  {playingId === recording.id && (
                    <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-sm font-medium text-gray-700">
                            Now Playing
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={toggleMute}
                            className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
                            title={volume > 0 ? "Mute" : "Unmute"}
                          >
                            {volume > 0 ? (
                              <Volume2 className="w-4 h-4" />
                            ) : (
                              <VolumeX className="w-4 h-4" />
                            )}
                          </button>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={volume}
                            onChange={(e) =>
                              handleVolumeChange(parseFloat(e.target.value))
                            }
                            className="w-20 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            title="Volume"
                          />
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-600 font-mono min-w-[50px]">
                          {formatDuration(currentTime)}
                        </span>

                        <div className="flex-1 relative">
                          {/* Buffer indicator */}
                          <div className="absolute inset-0 bg-gray-200 rounded-full h-3">
                            <div
                              className="bg-gray-300 h-3 rounded-full transition-all duration-300"
                              style={{
                                width: `${audioBuffered}%`,
                              }}
                            />
                          </div>

                          {/* Progress indicator */}
                          <div
                            className="absolute inset-0 bg-gray-200 rounded-full h-3 cursor-pointer hover:h-4 transition-all"
                            onClick={(e) => handleSeek(e, e.currentTarget)}
                          >
                            <div
                              className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-300 relative hover:h-4"
                              style={{
                                width: `${
                                  duration > 0
                                    ? (currentTime / duration) * 100
                                    : 0
                                }%`,
                              }}
                            >
                              {/* Playhead */}
                              <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-white border-2 border-blue-500 rounded-full shadow-sm"></div>
                            </div>
                          </div>
                        </div>

                        <span className="text-sm text-gray-600 font-mono min-w-[50px]">
                          {formatDuration(duration)}
                        </span>
                      </div>

                      {/* Playback Speed Controls */}
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">Speed:</span>
                          {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
                            <button
                              key={speed}
                              onClick={() => {
                                if (audioRef.current) {
                                  audioRef.current.playbackRate = speed;
                                }
                              }}
                              className={`px-2 py-1 text-xs rounded ${
                                audioRef.current?.playbackRate === speed
                                  ? "bg-blue-500 text-white"
                                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                              }`}
                            >
                              {speed}x
                            </button>
                          ))}
                        </div>

                        {/* Skip buttons */}
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => {
                              if (audioRef.current) {
                                audioRef.current.currentTime = Math.max(
                                  0,
                                  audioRef.current.currentTime - 10
                                );
                              }
                            }}
                            className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
                            title="Rewind 10 seconds"
                          >
                            <SkipBack className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (audioRef.current) {
                                audioRef.current.currentTime = Math.min(
                                  audioRef.current.duration || 0,
                                  audioRef.current.currentTime + 10
                                );
                              }
                            }}
                            className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
                            title="Forward 10 seconds"
                          >
                            <SkipForward className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Recording Info */}
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                          <div>
                            <span className="text-gray-500">Call ID:</span>
                            <p
                              className="font-mono text-gray-700 truncate"
                              title={recording.vapi_id}
                            >
                              {recording.vapi_id?.slice(-8) || "N/A"}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-500">Status:</span>
                            <p className="font-medium text-gray-700">
                              {recording.status || "Completed"}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-500">Cost:</span>
                            <p className="font-medium text-gray-700">
                              ${(recording.cost || 0).toFixed(4)}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-500">Source:</span>
                            <p className="font-medium text-gray-700">
                              {recording.direction === "inbound"
                                ? "Incoming"
                                : recording.direction === "outbound"
                                ? "Outgoing"
                                : recording.type === "webCall"
                                ? "Web Interface"
                                : "External"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Transcript Preview */}
                      {recording.transcript && (
                        <div className="mt-3 p-3 bg-white rounded border">
                          <p className="text-sm text-gray-600 mb-1 font-medium">
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
