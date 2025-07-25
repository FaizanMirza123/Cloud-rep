// VAPI Service - API integration for Vapi.ai
const VAPI_API_KEY = 'b53d60fd-f374-4af6-b586-3d2ff3463efa';
const VAPI_BASE_URL = 'https://api.vapi.ai';

class VapiService {
  constructor() {
    this.apiKey = VAPI_API_KEY;
    this.baseURL = VAPI_BASE_URL;
  }

  // Helper method to make authenticated API calls
  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('VAPI API Error:', error);
      throw error;
    }
  }

  // ASSISTANTS API

  /**
   * List all assistants
   * @param {Object} params - Query parameters
   * @param {number} params.limit - Maximum number of items to return (0-1000, default: 100)
   * @param {string} params.createdAtGt - Filter by created date greater than
   * @param {string} params.createdAtLt - Filter by created date less than
   * @param {string} params.updatedAtGt - Filter by updated date greater than
   * @param {string} params.updatedAtLt - Filter by updated date less than
   * @returns {Promise<Array>} List of assistants
   */
  async listAssistants(params = {}) {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value);
      }
    });

    const endpoint = `/assistant${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.makeRequest(endpoint, { method: 'GET' });
  }

  /**
   * Get a specific assistant by ID
   * @param {string} assistantId - The assistant ID
   * @returns {Promise<Object>} Assistant details
   */
  async getAssistant(assistantId) {
    return this.makeRequest(`/assistant/${assistantId}`, { method: 'GET' });
  }

  /**
   * Create a new assistant
   * @param {Object} assistantData - Assistant configuration
   * @returns {Promise<Object>} Created assistant
   */
  async createAssistant(assistantData) {
    return this.makeRequest('/assistant', {
      method: 'POST',
      body: JSON.stringify(assistantData),
    });
  }

  /**
   * Update an existing assistant
   * @param {string} assistantId - The assistant ID
   * @param {Object} assistantData - Updated assistant configuration
   * @returns {Promise<Object>} Updated assistant
   */
  async updateAssistant(assistantId, assistantData) {
    return this.makeRequest(`/assistant/${assistantId}`, {
      method: 'PATCH',
      body: JSON.stringify(assistantData),
    });
  }

  /**
   * Delete an assistant
   * @param {string} assistantId - The assistant ID
   * @returns {Promise<Object>} Deletion confirmation
   */
  async deleteAssistant(assistantId) {
    return this.makeRequest(`/assistant/${assistantId}`, { method: 'DELETE' });
  }

  // CALLS API

  /**
   * List all calls
   * @param {Object} params - Query parameters
   * @param {string} params.assistantId - Filter by assistant ID
   * @param {string} params.phoneNumberId - Filter by phone number ID
   * @param {number} params.limit - Maximum number of items to return
   * @param {string} params.createdAtGt - Filter by created date greater than
   * @param {string} params.createdAtLt - Filter by created date less than
   * @returns {Promise<Array>} List of calls
   */
  async listCalls(params = {}) {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value);
      }
    });

    const endpoint = `/call${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.makeRequest(endpoint, { method: 'GET' });
  }

  /**
   * Get a specific call by ID
   * @param {string} callId - The call ID
   * @returns {Promise<Object>} Call details
   */
  async getCall(callId) {
    return this.makeRequest(`/call/${callId}`, { method: 'GET' });
  }

  /**
   * Create a new call
   * @param {Object} callData - Call configuration
   * @returns {Promise<Object>} Created call
   */
  async createCall(callData) {
    return this.makeRequest('/call', {
      method: 'POST',
      body: JSON.stringify(callData),
    });
  }

  /**
   * Create an outbound phone call
   * @param {Object} callData - Call configuration including phone number and assistant
   * @returns {Promise<Object>} Created call
   */
  async createOutboundCall(callData) {
    const payload = {
      type: 'outboundPhoneCall',
      ...callData,
    };
    return this.createCall(payload);
  }

  /**
   * Create a web call
   * @param {Object} callData - Call configuration
   * @returns {Promise<Object>} Created call with web URL
   */
  async createWebCall(callData) {
    const payload = {
      type: 'webCall',
      ...callData,
    };
    return this.createCall(payload);
  }

  // PHONE NUMBERS API

  /**
   * List all phone numbers
   * @param {Object} params - Query parameters
   * @returns {Promise<Array>} List of phone numbers
   */
  async listPhoneNumbers(params = {}) {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value);
      }
    });

    const endpoint = `/phone-number${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.makeRequest(endpoint, { method: 'GET' });
  }

  /**
   * Get a specific phone number by ID
   * @param {string} phoneNumberId - The phone number ID
   * @returns {Promise<Object>} Phone number details
   */
  async getPhoneNumber(phoneNumberId) {
    return this.makeRequest(`/phone-number/${phoneNumberId}`, { method: 'GET' });
  }

  // ANALYTICS AND STATS

  /**
   * Get call analytics for a specific assistant
   * @param {string} assistantId - The assistant ID
   * @param {Object} params - Query parameters for date range
   * @returns {Promise<Object>} Analytics data
   */
  async getAssistantAnalytics(assistantId, params = {}) {
    const calls = await this.listCalls({ assistantId, ...params });
    
    // Calculate analytics from calls data
    const analytics = {
      totalCalls: calls.length,
      totalDuration: 0,
      averageDuration: 0,
      successfulCalls: 0,
      failedCalls: 0,
      costBreakdown: {
        total: 0,
        transport: 0,
        llm: 0,
        tts: 0,
        stt: 0,
      },
    };

    calls.forEach(call => {
      if (call.cost) {
        analytics.costBreakdown.total += call.cost;
      }
      
      if (call.costBreakdown) {
        analytics.costBreakdown.transport += call.costBreakdown.transport || 0;
        analytics.costBreakdown.llm += call.costBreakdown.llm || 0;
        analytics.costBreakdown.tts += call.costBreakdown.tts || 0;
        analytics.costBreakdown.stt += call.costBreakdown.stt || 0;
      }

      if (call.startedAt && call.endedAt) {
        const duration = new Date(call.endedAt) - new Date(call.startedAt);
        analytics.totalDuration += duration;
        analytics.successfulCalls++;
      } else {
        analytics.failedCalls++;
      }
    });

    analytics.averageDuration = analytics.successfulCalls > 0 
      ? analytics.totalDuration / analytics.successfulCalls / 1000 // Convert to seconds
      : 0;

    return analytics;
  }

  /**
   * Get dashboard statistics
   * @returns {Promise<Object>} Dashboard stats
   */
  async getDashboardStats() {
    try {
      const [assistants, calls] = await Promise.all([
        this.listAssistants({ limit: 100 }),
        this.listCalls({ limit: 100 }),
      ]);

      // Calculate recent calls (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const recentCalls = calls.filter(call => 
        call.createdAt && new Date(call.createdAt) > sevenDaysAgo
      );

      // Calculate total cost
      const totalCost = calls.reduce((sum, call) => sum + (call.cost || 0), 0);

      // Calculate average call duration
      const completedCalls = calls.filter(call => call.startedAt && call.endedAt);
      const totalDuration = completedCalls.reduce((sum, call) => {
        const duration = new Date(call.endedAt) - new Date(call.startedAt);
        return sum + duration;
      }, 0);
      const averageDuration = completedCalls.length > 0 
        ? totalDuration / completedCalls.length / 1000 / 60 // Convert to minutes
        : 0;

      return {
        totalAgents: assistants.length,
        totalCalls: calls.length,
        recentCalls: recentCalls.length,
        totalCost: totalCost.toFixed(2),
        averageDuration: Math.round(averageDuration * 100) / 100, // Round to 2 decimal places
        activeAgents: assistants.filter(agent => 
          // Consider an agent active if it has recent calls
          recentCalls.some(call => call.assistantId === agent.id)
        ).length,
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Return default stats if API fails
      return {
        totalAgents: 0,
        totalCalls: 0,
        recentCalls: 0,
        totalCost: '0.00',
        averageDuration: 0,
        activeAgents: 0,
      };
    }
  }

  // UTILITY METHODS

  /**
   * Format call duration from milliseconds to readable format
   * @param {number} milliseconds - Duration in milliseconds
   * @returns {string} Formatted duration (e.g., "3:24")
   */
  formatDuration(milliseconds) {
    if (!milliseconds || milliseconds < 0) return '0:00';
    
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Get call status color for UI
   * @param {string} status - Call status
   * @returns {string} CSS color class
   */
  getCallStatusColor(status) {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'in-progress':
        return 'text-blue-600 bg-blue-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      case 'canceled':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  }

  /**
   * Test API connection
   * @returns {Promise<boolean>} True if connection is successful
   */
  async testConnection() {
    try {
      await this.listAssistants({ limit: 1 });
      return true;
    } catch (error) {
      console.error('VAPI connection test failed:', error);
      return false;
    }
  }
}

// Create and export a singleton instance
const vapiService = new VapiService();
export default vapiService;
