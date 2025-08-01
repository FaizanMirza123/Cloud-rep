import { useState, useEffect, useCallback, useMemo } from 'react';
import apiService from '../services/api';
import toast from 'react-hot-toast';

// Custom hook for agents
export const useAgents = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAgents = useCallback(async (useCache = true) => {
    try {
      setLoading(true);
      const data = await apiService.getAgents(useCache);
      setAgents(data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch agents');
      toast.error('Failed to load agents');
    } finally {
      setLoading(false);
    }
  }, []);

  const createAgent = useCallback(async (agentData) => {
    try {
      const newAgent = await apiService.createAgent(agentData);
      setAgents(prev => [...prev, newAgent]);
      toast.success('Agent created successfully');
      return { success: true, data: newAgent };
    } catch (err) {
      const error = err.response?.data?.detail || 'Failed to create agent';
      toast.error(error);
      return { success: false, error };
    }
  }, []);

  const updateAgent = useCallback(async (id, agentData) => {
    try {
      const updatedAgent = await apiService.updateAgent(id, agentData);
      setAgents(prev => prev.map(agent => 
        agent.id === id ? updatedAgent : agent
      ));
      toast.success('Agent updated successfully');
      return { success: true, data: updatedAgent };
    } catch (err) {
      const error = err.response?.data?.detail || 'Failed to update agent';
      toast.error(error);
      return { success: false, error };
    }
  }, []);

  const deleteAgent = useCallback(async (id) => {
    try {
      await apiService.deleteAgent(id);
      setAgents(prev => prev.filter(agent => agent.id !== id));
      toast.success('Agent deleted successfully');
      return { success: true };
    } catch (err) {
      const error = err.response?.data?.detail || 'Failed to delete agent';
      toast.error(error);
      return { success: false, error };
    }
  }, []);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  return {
    agents,
    loading,
    error,
    fetchAgents,
    createAgent,
    updateAgent,
    deleteAgent,
    refetch: () => fetchAgents(false)
  };
};

// Custom hook for phone numbers
export const usePhoneNumbers = () => {
  const [phoneNumbers, setPhoneNumbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPhoneNumbers = useCallback(async (useCache = true) => {
    try {
      setLoading(true);
      const data = await apiService.getPhoneNumbers(useCache);
      setPhoneNumbers(data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch phone numbers');
      toast.error('Failed to load phone numbers');
    } finally {
      setLoading(false);
    }
  }, []);

  const createPhoneNumber = useCallback(async (phoneData) => {
    try {
      const newPhone = await apiService.createPhoneNumber(phoneData);
      setPhoneNumbers(prev => [...prev, newPhone]);
      
      // Don't show automatic toast here, let the component handle it based on warning
      if (newPhone.warning) {
        return { success: true, data: newPhone, warning: newPhone.warning };
      } else {
        toast.success('Phone number added successfully');
        return { success: true, data: newPhone };
      }
    } catch (err) {
      const error = err.response?.data?.detail || 'Failed to add phone number';
      toast.error(error);
      return { success: false, error };
    }
  }, []);

  const deletePhoneNumber = useCallback(async (id) => {
    try {
      await apiService.deletePhoneNumber(id);
      setPhoneNumbers(prev => prev.filter(phone => phone.id !== id));
      toast.success('Phone number deleted successfully');
      return { success: true };
    } catch (err) {
      const error = err.response?.data?.detail || 'Failed to delete phone number';
      toast.error(error);
      return { success: false, error };
    }
  }, []);

  useEffect(() => {
    fetchPhoneNumbers();
  }, [fetchPhoneNumbers]);

  return {
    phoneNumbers,
    loading,
    error,
    fetchPhoneNumbers,
    createPhoneNumber,
    deletePhoneNumber,
    refetch: () => fetchPhoneNumbers(false)
  };
};

// Custom hook for calls
export const useCalls = () => {
  const [calls, setCalls] = useState([]);
  const [activeCalls, setActiveCalls] = useState([]);
  const [missedCalls, setMissedCalls] = useState([]);
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCalls = useCallback(async (useCache = true) => {
    try {
      setLoading(true);
      const [callsData, activeData, missedData, recordingsData] = await Promise.all([
        apiService.getCalls(useCache),
        apiService.getActiveCalls(useCache),
        apiService.getMissedCalls(useCache),
        apiService.getCallRecordings(useCache)
      ]);

      setCalls(callsData);
      setActiveCalls(activeData);
      setMissedCalls(missedData);
      setRecordings(recordingsData);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch calls');
      toast.error('Failed to load calls');
    } finally {
      setLoading(false);
    }
  }, []);

  const createCall = useCallback(async (callData) => {
    try {
      const newCall = await apiService.createCall(callData);
      setCalls(prev => [newCall, ...prev]);
      setActiveCalls(prev => [newCall, ...prev]);
      toast.success('Call initiated successfully');
      return { success: true, data: newCall };
    } catch (err) {
      const error = err.response?.data?.detail || 'Failed to create call';
      toast.error(error);
      return { success: false, error };
    }
  }, []);

  useEffect(() => {
    fetchCalls();
  }, [fetchCalls]);

  // Real-time polling for active calls
  useEffect(() => {
    const pollId = apiService.startPolling('/calls/active', (data) => {
      setActiveCalls(data);
    }, 3000); // Poll every 3 seconds

    return () => apiService.stopPolling(pollId);
  }, []);

  return {
    calls,
    activeCalls,
    missedCalls,
    recordings,
    loading,
    error,
    fetchCalls,
    createCall,
    refetch: () => fetchCalls(false)
  };
};

// Custom hook for analytics
export const useAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = useCallback(async (useCache = true) => {
    try {
      setLoading(true);
      const data = await apiService.getDashboardAnalytics(useCache);
      setAnalytics(data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Computed values
  const computedStats = useMemo(() => {
    if (!analytics) return null;

    return {
      ...analytics,
      averageCallDuration: analytics.numberOfCalls > 0 
        ? (analytics.totalCallMinutes / analytics.numberOfCalls).toFixed(1)
        : 0,
      callSuccessRate: analytics.numberOfCalls > 0
        ? ((analytics.numberOfCalls - (analytics.missedCalls || 0)) / analytics.numberOfCalls * 100).toFixed(1)
        : 0
    };
  }, [analytics]);

  return {
    analytics: computedStats,
    loading,
    error,
    fetchAnalytics,
    refetch: () => fetchAnalytics(false)
  };
};

// Custom hook for pagination
export const usePagination = (data, itemsPerPage = 10) => {
  const [currentPage, setCurrentPage] = useState(1);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  }, [data, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(data.length / itemsPerPage);

  const goToPage = useCallback((page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);

  const nextPage = useCallback(() => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  }, [totalPages]);

  const prevPage = useCallback(() => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  }, []);

  // Reset to page 1 when data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [data.length]);

  return {
    currentPage,
    totalPages,
    paginatedData,
    goToPage,
    nextPage,
    prevPage,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1
  };
};

// Custom hook for search and filtering
export const useSearchFilter = (data, searchFields = ['name']) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({});

  const filteredData = useMemo(() => {
    let result = data;

    // Apply search
    if (searchTerm) {
      result = result.filter(item => 
        searchFields.some(field => 
          item[field]?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        result = result.filter(item => 
          item[key]?.toString().toLowerCase().includes(value.toLowerCase())
        );
      }
    });

    return result;
  }, [data, searchTerm, filters, searchFields]);

  const setFilter = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setFilters({});
  }, []);

  return {
    searchTerm,
    setSearchTerm,
    filters,
    setFilter,
    clearFilters,
    filteredData
  };
};
