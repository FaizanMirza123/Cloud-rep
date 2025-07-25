import React, { useState, useEffect } from "react";
import { usePhoneNumbers } from "../hooks/useApi";
import {
  PageTransition,
  LoadingSpinner,
  CardHover,
  ButtonHover,
} from "../components/AnimationComponents";
import toast from "react-hot-toast";
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
  X,
} from "lucide-react";

// Country codes with flags and dial codes
const countries = [
  { code: "US", name: "United States", flag: "🇺🇸", dialCode: "+1" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧", dialCode: "+44" },
  { code: "CA", name: "Canada", flag: "🇨🇦", dialCode: "+1" },
  { code: "AU", name: "Australia", flag: "🇦🇺", dialCode: "+61" },
  { code: "DE", name: "Germany", flag: "🇩🇪", dialCode: "+49" },
  { code: "FR", name: "France", flag: "🇫🇷", dialCode: "+33" },
  { code: "IT", name: "Italy", flag: "🇮🇹", dialCode: "+39" },
  { code: "ES", name: "Spain", flag: "🇪🇸", dialCode: "+34" },
  { code: "IN", name: "India", flag: "🇮🇳", dialCode: "+91" },
  { code: "BR", name: "Brazil", flag: "🇧🇷", dialCode: "+55" },
];

const CreatePhoneNumberModal = ({ isOpen, onClose, onCreateNumber }) => {
  const [formData, setFormData] = useState({
    name: "",
    country: "US",
    areaCode: "",
    provider: "vapi",
  });
  const [loading, setLoading] = useState(false);

  const providers = [
    { id: "vapi", name: "Vapi", description: "Vapi managed numbers" },
    {
      id: "twilio",
      name: "Twilio",
      description: "Bring your own Twilio number",
    },
    {
      id: "vonage",
      name: "Vonage",
      description: "Bring your own Vonage number",
    },
    {
      id: "telnyx",
      name: "Telnyx",
      description: "Bring your own Telnyx number",
    },
  ];

  const selectedCountry = countries.find((c) => c.code === formData.country);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await onCreateNumber({
        ...formData,
        dialCode: selectedCountry.dialCode,
      });

      if (result.success) {
        toast.success("Phone number provisioned successfully!");
        onClose();
        setFormData({
          name: "",
          country: "US",
          areaCode: "",
          provider: "vapi",
        });
      } else {
        toast.error(result.error || "Failed to provision phone number");
      }
    } catch (error) {
      toast.error("Failed to provision phone number");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              Add Phone Number
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Display Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., Main Business Line"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Country *
            </label>
            <select
              value={formData.country}
              onChange={(e) =>
                setFormData({ ...formData, country: e.target.value })
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {countries.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.flag} {country.name} ({country.dialCode})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Area Code (Optional)
            </label>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-500">
                {selectedCountry.dialCode}
              </span>
              <input
                type="text"
                value={formData.areaCode}
                onChange={(e) =>
                  setFormData({ ...formData, areaCode: e.target.value })
                }
                placeholder="555"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Provider *
            </label>
            <select
              value={formData.provider}
              onChange={(e) =>
                setFormData({ ...formData, provider: e.target.value })
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {providers.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.name} - {provider.description}
                </option>
              ))}
            </select>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Add Number</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const PhoneNumbers = () => {
  const {
    phoneNumbers,
    loading,
    error,
    fetchPhoneNumbers,
    createPhoneNumber,
    deletePhoneNumber,
  } = usePhoneNumbers();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterProvider, setFilterProvider] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingNumber, setDeletingNumber] = useState(null);

  useEffect(() => {
    fetchPhoneNumbers();
  }, [fetchPhoneNumbers]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPhoneNumbers();
    setRefreshing(false);
  };

  const handleCreateNumber = async (numberData) => {
    const result = await createPhoneNumber(numberData);
    return result;
  };

  const handleDeleteNumber = async (numberId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this phone number? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      setDeletingNumber(numberId);
      const result = await deletePhoneNumber(numberId);
      if (result.success) {
        toast.success("Phone number deleted successfully");
      }
    } catch (error) {
      toast.error("Failed to delete phone number");
    } finally {
      setDeletingNumber(null);
    }
  };

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
    const countryData = countries.find((c) => c.code === country);
    return countryData ? countryData.flag : "🌍";
  };

  if (loading) {
    return (
      <PageTransition>
        <div className="p-6">
          <LoadingSpinner size="large" text="Loading phone numbers..." />
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Phone Numbers</h1>
            <p className="text-gray-600 mt-1">
              Manage your phone numbers for voice AI calls
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-2">
            <ButtonHover
              onClick={handleRefresh}
              disabled={refreshing}
              className="bg-gray-100 text-gray-600 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-200 flex items-center space-x-2 disabled:opacity-50"
            >
              <RefreshCw
                className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
              />
              <span>Refresh</span>
            </ButtonHover>
            <ButtonHover
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Number</span>
            </ButtonHover>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search phone numbers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={filterProvider}
              onChange={(e) => setFilterProvider(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {providers.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.name}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-4 sm:mt-0 text-sm text-gray-600">
            {filteredNumbers.length} of {phoneNumbers.length} numbers
          </div>
        </div>

        {/* Phone Numbers Grid */}
        {filteredNumbers.length === 0 ? (
          <div className="text-center py-12">
            <Phone className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm
                ? "No phone numbers found"
                : "No phone numbers added yet"}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm
                ? "Try adjusting your search criteria"
                : "Add your first phone number to start making calls"}
            </p>
            {!searchTerm && (
              <ButtonHover
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Phone Number
              </ButtonHover>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNumbers.map((phoneNumber) => (
              <CardHover
                key={phoneNumber.id}
                className="bg-white rounded-lg shadow border border-gray-200 p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Phone className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {phoneNumber.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {phoneNumber.number}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">
                      {getCountryFlag(phoneNumber.country)}
                    </span>
                    {getProviderLogo(phoneNumber.provider)}
                  </div>
                </div>

                <div className="mb-4">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                      phoneNumber.status
                    )}`}
                  >
                    {getStatusIcon(phoneNumber.status)}
                    <span className="ml-1">{phoneNumber.status}</span>
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Provider:</span>
                    <span className="font-medium capitalize">
                      {phoneNumber.provider.replace("-", " ")}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-medium">
                      {phoneNumber.type || "Voice"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Created:</span>
                    <span className="font-medium">
                      {new Date(phoneNumber.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <ButtonHover className="flex-1 px-3 py-2 text-sm font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200 flex items-center justify-center space-x-1">
                    <PhoneCall className="w-3 h-3" />
                    <span>Call</span>
                  </ButtonHover>

                  <ButtonHover className="flex-1 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 flex items-center justify-center space-x-1">
                    <Edit className="w-3 h-3" />
                    <span>Edit</span>
                  </ButtonHover>

                  <ButtonHover
                    onClick={() => handleDeleteNumber(phoneNumber.id)}
                    disabled={deletingNumber === phoneNumber.id}
                    className="px-3 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 disabled:opacity-50"
                  >
                    {deletingNumber === phoneNumber.id ? (
                      <div className="w-3 h-3 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Trash2 className="w-3 h-3" />
                    )}
                  </ButtonHover>
                </div>
              </CardHover>
            ))}
          </div>
        )}
      </div>

      {/* Create Phone Number Modal */}
      <CreatePhoneNumberModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateNumber={handleCreateNumber}
      />
    </PageTransition>
  );
};

export default PhoneNumbers;
