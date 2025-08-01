import React, { useState } from "react";
import { X, Phone, AlertCircle } from "lucide-react";
import apiService from "../services/api";

const TestCallDialog = ({ isOpen, onClose, onTest, agent, isLoading }) => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState("");

  const handlePhoneChange = (e) => {
    const formatted = apiService.formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
    setError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const validatedNumber = apiService.validatePhoneNumber(phoneNumber);
    if (!validatedNumber) {
      setError("Please enter a valid phone number (10 digits for US numbers)");
      return;
    }

    onTest(agent, validatedNumber);
    setPhoneNumber("");
    setError("");
  };

  const handleClose = () => {
    setPhoneNumber("");
    setError("");
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
              <h3 className="text-lg font-semibold text-gray-900">Test Call</h3>
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
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <label
              htmlFor="phoneNumber"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Your Phone Number
            </label>
            <input
              type="tel"
              id="phoneNumber"
              value={phoneNumber}
              onChange={handlePhoneChange}
              placeholder="(555) 123-4567"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                error ? "border-red-300" : "border-gray-300"
              }`}
              required
            />
            {error && (
              <div className="mt-2 flex items-center space-x-2 text-red-600">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{error}</span>
              </div>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <p className="text-blue-800 font-medium mb-1">
                  Test Call Information
                </p>
                <ul className="text-blue-700 space-y-1">
                  <li>• The agent will call your phone number</li>
                  <li>• This is a live test with the actual assistant</li>
                  <li>• Standard call rates may apply</li>
                  <li>• You can end the call at any time</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !phoneNumber}
              className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors ${
                isLoading || !phoneNumber
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Initiating...</span>
                </div>
              ) : (
                "Start Test Call"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TestCallDialog;
