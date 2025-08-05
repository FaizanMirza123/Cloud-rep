import axios from 'axios';

class ApiService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || 'https://fastapi123.duckdns.org';
    this.cache = new Map();
    this.cacheExpiry = new Map();
    this.defaultCacheDuration = 5 * 60 * 1000; // 5 minutes
  }

  // Cache management
  getCachedData(key) {
    const now = Date.now();
    const expiry = this.cacheExpiry.get(key);
    
    if (expiry && now > expiry) {
      this.cache.delete(key);
      this.cacheExpiry.delete(key);
      return null;
    }
    
    return this.cache.get(key);
  }

  setCachedData(key, data, duration = this.defaultCacheDuration) {
    this.cache.set(key, data);
    this.cacheExpiry.set(key, Date.now() + duration);
  }

  clearCache(pattern = null) {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
          this.cacheExpiry.delete(key);
        }
      }
    } else {
      this.cache.clear();
      this.cacheExpiry.clear();
    }
  }

  // Generic API call with caching
  async apiCall(endpoint, options = {}) {
    const {
      method = 'GET',
      data = null,
      cache = false,
      cacheDuration = this.defaultCacheDuration,
      ...axiosOptions
    } = options;

    const cacheKey = `${method}:${endpoint}:${JSON.stringify(data)}`;

    // Check cache for GET requests
    if (method === 'GET' && cache) {
      const cachedData = this.getCachedData(cacheKey);
      if (cachedData) {
        return cachedData;
      }
    }

    try {
      // Get auth token
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        ...(axiosOptions.headers || {})
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await axios({
        url: `${this.baseURL}${endpoint}`,
        method,
        data,
        headers,
        ...axiosOptions
      });

      // Cache successful GET responses
      if (method === 'GET' && cache && response.data) {
        this.setCachedData(cacheKey, response.data, cacheDuration);
      }

      // Clear related cache for mutations
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        const resourcePattern = endpoint.split('/')[1];
        this.clearCache(resourcePattern);
      }

      return response.data;
    } catch (error) {
      // Handle 401 errors by redirecting to login
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
      throw error;
    }
  }

  // Agent API methods
  async getAgents(useCache = true) {
    return this.apiCall('/agents', { cache: useCache });
  }

  async getAgent(id, useCache = true) {
    return this.apiCall(`/agents/${id}`, { cache: useCache });
  }

  async createAgent(agentData) {
    return this.apiCall('/agents', {
      method: 'POST',
      data: agentData
    });
  }

  async updateAgent(id, agentData) {
    return this.apiCall(`/agents/${id}`, {
      method: 'PUT',
      data: agentData
    });
  }

  async deleteAgent(id) {
    return this.apiCall(`/agents/${id}`, {
      method: 'DELETE'
    });
  }

  // Phone Number API methods
  async getPhoneNumbers(useCache = true) {
    return this.apiCall('/phone-numbers', { cache: useCache });
  }

  async createPhoneNumber(phoneData) {
    return this.apiCall('/phone-numbers', {
      method: 'POST',
      data: phoneData
    });
  }

  async deletePhoneNumber(id) {
    return this.apiCall(`/phone-numbers/${id}`, {
      method: 'DELETE'
    });
  }

  async testPhoneNumber(id) {
    return this.apiCall(`/phone-numbers/${id}/test`, {
      method: 'POST'
    });
  }

  async updatePhoneNumber(id, updateData) {
    return this.apiCall(`/phone-numbers/${id}`, {
      method: 'PUT',
      data: updateData
    });
  }

  // Call API methods
  async getCalls(params = {}, useCache = true) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) queryParams.append(key, value);
    });
    
    return this.apiCall(`/calls${queryParams.toString() ? `?${queryParams.toString()}` : ''}`, {
      cache: useCache,
      cacheDuration: 30 * 1000 // 30 seconds for calls
    });
  }

  async getAgentCalls(agentId, useCache = true) {
    return this.apiCall(`/calls?agent_id=${agentId}`, {
      cache: useCache,
      cacheDuration: 30 * 1000 // 30 seconds for calls
    });
  }

  async getActiveCalls(useCache = true) {
    return this.apiCall('/calls/active', { cache: useCache });
  }

  async getMissedCalls(useCache = true) {
    return this.apiCall('/calls/missed', { cache: useCache });
  }

  async getCallRecordings(useCache = true, forceSync = false) {
    return this.apiCall(`/calls/recordings${forceSync ? '?force_sync=true' : ''}`, { cache: useCache });
  }
  
  async forceRefreshAllRecordings() {
    // Use the new dedicated refresh endpoint
    return this.apiCall('/calls/recordings/refresh', { method: 'POST' });
  }

  async getRecordingsByAgent(agentId, useCache = true) {
    return this.apiCall(`/calls/recordings/by-agent/${agentId}`, { cache: useCache });
  }

  async syncAgentRecordings(agentId) {
    return this.apiCall(`/agents/${agentId}/sync-recordings`, { 
      method: 'POST' 
    });
  }

  async createCall(callData) {
    return this.apiCall('/calls', {
      method: 'POST',
      data: callData
    });
  }

  async updateCall(callId, callData) {
    return this.apiCall(`/calls/${callId}`, {
      method: 'PUT',
      data: callData
    });
  }

  async syncCallWithVapi(callId) {
    return this.apiCall(`/calls/${callId}/sync`, {
      method: 'POST'
    });
  }

  // Analytics API methods
  async getDashboardAnalytics(useCache = true) {
    return this.apiCall('/analytics/dashboard', { 
      cache: useCache,
      cacheDuration: 2 * 60 * 1000 // 2 minutes for analytics
    });
  }
  
  async getAgentCalls(agentId, useCache = true) {
    return this.apiCall(`/calls?agent_id=${agentId}`, {
      cache: useCache,
      cacheDuration: 30 * 1000 // 30 seconds for calls
    });
  }

  // Real-time data methods (no caching)
  async getRealtimeData(endpoint) {
    return this.apiCall(endpoint, { cache: false });
  }

  // Batch operations
  async batchDelete(type, ids) {
    const promises = ids.map(id => {
      switch (type) {
        case 'agents':
          return this.deleteAgent(id);
        case 'phone-numbers':
          return this.deletePhoneNumber(id);
        default:
          throw new Error(`Unsupported batch delete type: ${type}`);
      }
    });

    return Promise.allSettled(promises);
  }

  // Polling for real-time updates
  startPolling(endpoint, callback, interval = 30000) { // Changed from 5000ms to 30000ms (30 seconds)
    const pollId = setInterval(async () => {
      try {
        const data = await this.getRealtimeData(endpoint);
        callback(data);
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, interval);

    return pollId;
  }

  stopPolling(pollId) {
    clearInterval(pollId);
  }

  // Agent testing
  async testAgent(agentId, phoneNumber) {
    return this.apiCall(`/agents/${agentId}/test`, {
      method: 'POST',
      data: {
        phoneNumber,
        assistantId: agentId
      }
    });
  }

  // Phone number utilities
  static validatePhoneNumber(phone) {
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');
    
    // Check if it's a valid US phone number (10 digits)
    if (digits.length === 10) {
      return `+1${digits}`;
    }
    
    // Check if it's already in E.164 format
    if (phone.startsWith('+') && digits.length >= 10) {
      return phone;
    }
    
    return null;
  }

  static formatPhoneNumber(value) {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX for US numbers
    if (digits.length <= 10) {
      if (digits.length >= 6) {
        return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
      } else if (digits.length >= 3) {
        return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
      } else {
        return digits;
      }
    }
    return value;
  }
}

export default new ApiService();
