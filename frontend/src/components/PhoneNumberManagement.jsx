import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

const PhoneNumberManagement = () => {
  const [phoneNumbers, setPhoneNumbers] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [phoneNumbersResponse, agentsResponse] = await Promise.all([
        apiService.getPhoneNumbers(),
        apiService.getAgents()
      ]);
      
      setPhoneNumbers(phoneNumbersResponse);
      setAgents(agentsResponse);
    } catch (err) {
      setError('Failed to fetch data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssistantConnection = async (phoneId, assistantId) => {
    try {
      setUpdating(prev => ({ ...prev, [phoneId]: true }));
      
      await apiService.updatePhoneNumber(phoneId, { assistant_id: assistantId });
      
      // Update local state
      setPhoneNumbers(prev => 
        prev.map(phone => 
          phone.id === phoneId 
            ? { ...phone, assistant_id: assistantId }
            : phone
        )
      );
      
      // Show success message (you can implement a toast notification here)
      console.log('Phone number connected to assistant successfully');
      
    } catch (err) {
      setError('Failed to connect phone number to assistant');
      console.error('Error connecting phone number:', err);
    } finally {
      setUpdating(prev => ({ ...prev, [phoneId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading phone numbers...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">{error}</div>
            <div className="mt-4">
              <button
                onClick={() => {
                  setError(null);
                  fetchData();
                }}
                className="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow-sm rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Phone Number to Assistant Connections
          </h3>
          <p className="text-sm text-gray-600 mb-6">
            Connect your phone numbers to specific assistants to handle incoming calls.
          </p>
          
          {phoneNumbers.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-500">No phone numbers found</div>
              <p className="text-sm text-gray-400 mt-2">
                Add phone numbers in VAPI to see them here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {phoneNumbers.map((phone) => (
                <div
                  key={phone.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div className="font-medium text-gray-900">
                          {phone.number}
                        </div>
                        <div className="text-sm text-gray-500">
                          {phone.name}
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          phone.status === 'active' 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {phone.status}
                        </div>
                      </div>
                      <div className="mt-1 text-sm text-gray-600">
                        Country: {phone.country} | Provider: {phone.provider}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="text-sm text-gray-600">
                        Connected to:
                      </div>
                      <select
                        value={phone.assistant_id || ''}
                        onChange={(e) => handleAssistantConnection(phone.id, e.target.value)}
                        disabled={updating[phone.id]}
                        className={`
                          border border-gray-300 rounded-md px-3 py-2 text-sm
                          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                          ${updating[phone.id] ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                      >
                        <option value="">Select Assistant</option>
                        {agents.map((agent) => (
                          <option key={agent.id} value={agent.id}>
                            {agent.name} ({agent.role})
                          </option>
                        ))}
                      </select>
                      {updating[phone.id] && (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      )}
                    </div>
                  </div>
                  
                  {phone.assistant_id && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Connected Assistant:</span>
                        {(() => {
                          const connectedAgent = agents.find(a => a.id === phone.assistant_id);
                          return connectedAgent ? (
                            <span className="ml-2 text-green-600 font-medium">
                              {connectedAgent.name} ({connectedAgent.role})
                            </span>
                          ) : (
                            <span className="ml-2 text-red-600">
                              Assistant not found
                            </span>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Call Activity Summary */}
      <div className="bg-white shadow-sm rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Recent Call Activity
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {phoneNumbers.filter(p => p.assistant_id).length}
              </div>
              <div className="text-sm text-blue-700">Connected Numbers</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {phoneNumbers.filter(p => p.status === 'active').length}
              </div>
              <div className="text-sm text-green-700">Active Numbers</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-gray-600">
                {phoneNumbers.length}
              </div>
              <div className="text-sm text-gray-700">Total Numbers</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhoneNumberManagement;
