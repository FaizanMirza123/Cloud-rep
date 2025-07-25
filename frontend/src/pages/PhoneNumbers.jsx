import React, { useState } from "react";
import { usePhoneNumbers } from "../hooks/usePhoneNumbers";
import {
  Plus,
  Phone,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  PhoneCall,
  Globe,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

const PhoneNumbers = () => {
  const { phoneNumbers, loading, error, refreshData, deletePhoneNumber } =
    usePhoneNumbers();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterProvider, setFilterProvider] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const providers = [
    { id: "all", name: "All Providers" },
    { id: "vapi", name: "Vapi" },
    { id: "twilio", name: "Twilio" },
    { id: "vonage", name: "Vonage" },
    { id: "telnyx", name: "Telnyx" },
  ];

  const filteredNumbers = phoneNumbers.filter((number) => {
    const matchesSearch =
      number.number.includes(searchTerm) ||
      number.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProvider =
      filterProvider === "all" || number.provider === filterProvider;
    return matchesSearch && matchesProvider;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "text-green-600 bg-green-100";
      case "inactive":
        return "text-gray-600 bg-gray-100";
      case "error":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "active":
        return <CheckCircle className="w-4 h-4" />;
      case "inactive":
        return <XCircle className="w-4 h-4" />;
      case "error":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <XCircle className="w-4 h-4" />;
    }
  };

  const getProviderLogo = (provider) => {
    // In a real app, you'd have actual logos
    const colors = {
      vapi: "bg-blue-600",
      twilio: "bg-red-600",
      vonage: "bg-purple-600",
      telnyx: "bg-green-600",
    };

    return (
      <div
        className={`w-6 h-6 rounded ${
          colors[provider] || "bg-gray-600"
        } flex items-center justify-center text-white text-xs font-bold`}
      >
        {provider.charAt(0).toUpperCase()}
      </div>
    );
  };

  const getCountryFlag = (country) => {
    const flags = {
      US: "🇺🇸",
      GB: "🇬🇧",
      CA: "🇨🇦",
      FR: "🇫🇷",
      DE: "🇩🇪",
    };
    return flags[country] || "🌍";
  };

  const handleDeleteNumber = async (numberId) => {
    if (window.confirm("Are you sure you want to delete this phone number?")) {
      try {
        await deletePhoneNumber(numberId);
      } catch (error) {
        alert("Failed to delete phone number: " + error.message);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <div>
              <h3 className="text-sm font-semibold text-red-900">
                Failed to load phone numbers
              </h3>
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <button
              onClick={refreshData}
              className="ml-auto bg-red-100 text-red-600 px-3 py-1 rounded text-sm hover:bg-red-200"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Phone Numbers</h1>
          <p className="text-gray-600 mt-1">
            Manage your phone numbers and call routing
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-2">
          <button
            onClick={refreshData}
            className="bg-gray-100 text-gray-600 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-200 flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Phone Number</span>
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search phone numbers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={filterProvider}
              onChange={(e) => setFilterProvider(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md bg-white text-sm"
            >
              {providers.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Phone className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-500">Total Numbers</h3>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {phoneNumbers.length}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-500">
              Active Numbers
            </h3>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {phoneNumbers.filter((n) => n.status === "active").length}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <PhoneCall className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-500">Calls Today</h3>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {phoneNumbers.reduce((sum, n) => sum + n.callsToday, 0)}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Globe className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-500">Countries</h3>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {new Set(phoneNumbers.map((n) => n.country)).size}
            </p>
          </div>
        </div>
      </div>

      {/* Phone Numbers Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Phone Numbers</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Provider
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned Agent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredNumbers.map((number) => (
                <tr key={number.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-lg mr-2">
                        {getCountryFlag(number.country)}
                      </span>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {number.number}
                        </div>
                        <div className="text-sm text-gray-500">
                          {number.name}
                        </div>
                        <div className="text-xs text-gray-400 capitalize">
                          {number.type}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getProviderLogo(number.provider)}
                      <span className="text-sm text-gray-900 capitalize">
                        {number.provider}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        number.status
                      )}`}
                    >
                      {getStatusIcon(number.status)}
                      <span className="capitalize">{number.status}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {number.assignedAgent || (
                        <span className="text-gray-400 italic">
                          Not assigned
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div>Today: {number.callsToday} calls</div>
                      <div className="text-gray-500">
                        Month: {number.callsThisMonth} calls
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="relative group">
                      <button className="p-1 rounded-full hover:bg-gray-100">
                        <MoreVertical className="w-4 h-4 text-gray-400" />
                      </button>
                      <div className="absolute right-0 mt-1 w-32 bg-white rounded-md shadow-lg py-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                        <button className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100">
                          <Edit className="w-3 h-3 mr-2" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteNumber(number.id)}
                          className="flex items-center w-full px-3 py-2 text-sm text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-3 h-3 mr-2" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty State */}
      {filteredNumbers.length === 0 && (
        <div className="text-center py-12">
          <Phone className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No phone numbers found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || filterProvider !== "all"
              ? "Try adjusting your search or filter criteria."
              : "Get started by adding your first phone number."}
          </p>
          {!searchTerm && filterProvider === "all" && (
            <div className="mt-6">
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Phone Number
              </button>
            </div>
          )}
        </div>
      )}

      {/* Create Modal (placeholder) */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Add Phone Number
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Choose how you'd like to add a phone number to your account.
              </p>
              <div className="space-y-3">
                <button className="w-full p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left">
                  <div className="font-medium text-gray-900">
                    Purchase from Vapi
                  </div>
                  <div className="text-sm text-gray-500">
                    Get a new number instantly
                  </div>
                </button>
                <button className="w-full p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left">
                  <div className="font-medium text-gray-900">
                    Import from Twilio
                  </div>
                  <div className="text-sm text-gray-500">
                    Use your existing Twilio number
                  </div>
                </button>
                <button className="w-full p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left">
                  <div className="font-medium text-gray-900">
                    Import from Vonage
                  </div>
                  <div className="text-sm text-gray-500">
                    Use your existing Vonage number
                  </div>
                </button>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhoneNumbers;
