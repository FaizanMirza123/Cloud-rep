import React, { useState, useEffect, useRef } from "react";

import apiService from "../services/api";
import vapiService from "../services/vapiService";
import { toast } from "react-toastify";
import { useCalls } from "../hooks/useApi";

const WebCallDialog = ({ isOpen, onClose, agent, isLoading }) => {
  const [callInProgress, setCallInProgress] = useState(false);
  const [muted, setMuted] = useState(false);
  const [callId, setCallId] = useState(null);
  const [transcript, setTranscript] = useState([]);
  const vapiClientRef = useRef(null);
  const { fetchCalls } = useCalls();

  // Initialize the VAPI web client
  useEffect(() => {
    if (isOpen && agent) {
      console.log("Initializing VAPI web client for agent:", agent.id);
      // Import the VAPI Web SDK dynamically
      import("@vapi-ai/web")
        .then((module) => {
          const Vapi = module.default;
          // Initialize with the public API key (this should be replaced with your actual key)
          const apiKey =
            process.env.REACT_APP_VAPI_PUBLIC_KEY || "YOUR_PUBLIC_API_KEY";
          console.log("Initializing VAPI with API key:", apiKey);

          vapiClientRef.current = new Vapi(apiKey);
          console.log("VAPI client initialized");

          // Set up event listeners
          vapiClientRef.current.on("call-start", handleCallStart);
          vapiClientRef.current.on("call-end", handleCallEnd);
          vapiClientRef.current.on("message", handleMessage);
          vapiClientRef.current.on("error", handleError);

          // Add a listener for recording-related events if available
          if (
            vapiClientRef.current.on &&
            typeof vapiClientRef.current.on === "function"
          ) {
            vapiClientRef.current.on("recording-available", (data) => {
              console.log("Recording available event received:", data);
              toast.success("Call recording is now available!");
            });
          }
        })
        .catch((err) => {
          console.error("Error loading VAPI Web SDK:", err);
          toast.error("Failed to load call interface. Please try again.");
        });
    }

    // Cleanup function
    return () => {
      if (vapiClientRef.current) {
        vapiClientRef.current.off("call-start", handleCallStart);
        vapiClientRef.current.off("call-end", handleCallEnd);
        vapiClientRef.current.off("message", handleMessage);
        vapiClientRef.current.off("error", handleError);

        // Stop any active call when component unmounts
        if (callInProgress) {
          vapiClientRef.current.stop();
        }
        vapiClientRef.current = null;
      }
    };
  }, [isOpen, agent]);

  const handleCallStart = (data) => {
    setCallInProgress(true);

    // Extract call ID from the response
    const callId = data?.call?.id;
    setCallId(callId);

    // Register the web call in our backend
    if (callId) {
      // Create a record of this web call in our system
      vapiService
        .createWebCall({
          vapiId: callId,
          assistantId: agent.id,
          customerNumber: "web-browser", // Indicates this is a web call
          assistantName: agent.name,
          metadata: {
            source: "web-interface",
            recordingEnabled: true,
          },
        })
        .then((result) => {
          console.log("Web call registered successfully:", result);
        })
        .catch((err) => console.error("Error registering web call:", err));
    }

    toast.success("Web call started successfully");
    fetchCalls(false); // Refresh calls list without using cache
  };

  const handleCallEnd = () => {
    setCallInProgress(false);
    toast.info("Call has ended");

    // Check for call ID
    if (callId) {
      console.log(
        `Call ended with VAPI ID: ${callId}, checking for recording...`
      );

      // Direct call to VAPI to get the call details with the recording URL
      vapiService
        .getCall(callId)
        .then((vapiCallData) => {
          console.log("Got VAPI call data:", vapiCallData);

          if (vapiCallData && vapiCallData.recordingUrl) {
            console.log("Recording URL found:", vapiCallData.recordingUrl);

            // Now register or update this call in our system
            apiService
              .createCall({
                type: "webCall",
                vapi_call_id: callId,
                customer_number: "web-browser",
                agent_id: agent.id,
                agent_name: agent.name,
                status: "completed",
                ended_at: new Date().toISOString(),
                recording_url: vapiCallData.recordingUrl,
                transcript: vapiCallData.transcript || "",
              })
              .then(() => {
                toast.success("Call recording saved successfully!");
                fetchCalls(false);
              })
              .catch((err) => {
                console.error("Error saving call with recording:", err);
              });
          } else {
            console.log("No recording URL found in VAPI response");
            // Still create the call record but without recording
            apiService
              .createCall({
                type: "webCall",
                vapi_call_id: callId,
                customer_number: "web-browser",
                agent_id: agent.id,
                agent_name: agent.name,
                status: "completed",
                ended_at: new Date().toISOString(),
              })
              .then(() => {
                fetchCalls(false);
              })
              .catch((err) => {
                console.error("Error saving call without recording:", err);
              });
          }
        })
        .catch((err) => {
          console.error("Error getting call details from VAPI:", err);
        });

      // Add a delay before checking again for the recording
      setTimeout(() => {
        console.log("Checking again for recordings...");
        fetchCalls(false);
      }, 10000); // Longer delay to ensure VAPI has time to process the recording
    } else {
      fetchCalls(false);
    }
  };

  const handleMessage = (message) => {
    if (message.type === "transcript") {
      setTranscript((prev) => [
        ...prev,
        {
          role: message.role,
          text: message.transcript,
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  };

  const handleError = (error) => {
    console.error("VAPI call error:", error);
    toast.error(`Call error: ${error.message || "Unknown error"}`);
    setCallInProgress(false);
  };

  const startCall = async () => {
    if (!vapiClientRef.current) {
      toast.error("Call interface not initialized. Please try again.");
      return;
    }

    try {
      // Start the web call with the selected agent and enable recording
      await vapiClientRef.current.start(agent.id, {
        recordCall: true, // Enable recording for the web call
        recordAudio: true, // Ensure audio is recorded
        recordVideo: false, // No video recording needed
        metadata: {
          source: "web-interface",
          agentName: agent.name || "AI Assistant",
          callType: "web-call",
        },
      });
      setTranscript([]);
      console.log("Web call started with recording enabled");
    } catch (err) {
      console.error("Error starting call:", err);
      toast.error(`Failed to start call: ${err.message || "Unknown error"}`);
    }
  };

  const endCall = () => {
    if (vapiClientRef.current) {
      vapiClientRef.current.stop();
    }
    setCallInProgress(false);
  };

  const toggleMute = () => {
    if (vapiClientRef.current) {
      vapiClientRef.current.toggleMicrophone();
      setMuted(!muted);
      toast.info(muted ? "Microphone unmuted" : "Microphone muted");
    }
  };

  const handleClose = () => {
    if (callInProgress) {
      endCall();
    }
    setTranscript([]);
    setCallId(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <Phone className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Web Call</h3>
              <p className="text-sm text-gray-600">Agent: {agent?.name}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!callInProgress ? (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="text-blue-800 font-medium mb-1">
                      Web Call Information
                    </p>
                    <ul className="text-blue-700 space-y-1">
                      <li>• Speak directly through your browser</li>
                      <li>• Please allow microphone access when prompted</li>
                      <li>• Make sure you're in a quiet environment</li>
                      <li>• You can end the call at any time</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Start Call Button */}
              <div className="flex justify-center">
                <button
                  onClick={startCall}
                  disabled={isLoading}
                  className={`px-6 py-3 rounded-full text-white flex items-center space-x-2 transition-colors ${
                    isLoading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Initializing...</span>
                    </>
                  ) : (
                    <>
                      <Phone className="h-5 w-5" />
                      <span>Start Call</span>
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Active Call Interface */}
              <div className="mb-4 text-center">
                <div className="animate-pulse inline-flex items-center space-x-2 text-green-700 bg-green-50 px-3 py-1 rounded-full">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  <span className="text-sm font-medium">Call in progress</span>
                </div>
                {callId && (
                  <p className="text-xs text-gray-500 mt-1">
                    Call ID: {callId}
                  </p>
                )}
              </div>

              {/* Transcript Area */}
              <div className="bg-gray-50 rounded-lg h-64 overflow-y-auto p-4 mb-4 border border-gray-200">
                {transcript.length === 0 ? (
                  <p className="text-gray-500 text-center italic">
                    Transcript will appear here...
                  </p>
                ) : (
                  <div className="space-y-3">
                    {transcript.map((msg, i) => (
                      <div
                        key={i}
                        className={`flex ${
                          msg.role === "assistant"
                            ? "justify-start"
                            : "justify-end"
                        }`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg px-3 py-2 ${
                            msg.role === "assistant"
                              ? "bg-blue-100 text-blue-900"
                              : "bg-gray-200 text-gray-800"
                          }`}
                        >
                          <p className="text-xs font-semibold mb-1">
                            {msg.role === "assistant" ? "Assistant" : "You"}
                          </p>
                          <p className="text-sm">{msg.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Call Controls */}
              <div className="flex justify-center space-x-4">
                <button
                  onClick={toggleMute}
                  className={`p-3 rounded-full ${
                    muted
                      ? "bg-red-100 text-red-600 hover:bg-red-200"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {muted ? (
                    <MicOff className="h-5 w-5" />
                  ) : (
                    <Mic className="h-5 w-5" />
                  )}
                </button>
                <button
                  onClick={endCall}
                  className="p-3 bg-red-600 text-white rounded-full hover:bg-red-700"
                >
                  <PhoneOff className="h-5 w-5" />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
          <p className="text-xs text-center text-gray-500">
            {callInProgress
              ? "Call is active. You can speak normally through your computer's microphone."
              : "Click 'Start Call' to begin a conversation with the AI assistant."}
          </p>
        </div>
      </div>
    </div>
  );
};

export default WebCallDialog;
