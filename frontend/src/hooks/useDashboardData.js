// Custom hook for dashboard data
import { useState, useEffect } from 'react';
import vapiService from '../services/vapiService';

export const useDashboardData = () => {
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalAgents: 0,
      totalCalls: 0,
      recentCalls: 0,
      totalCost: '0.00',
      averageDuration: 0,
      activeAgents: 0,
    },
    recentCalls: [],
    topAgents: [],
    allAgents: [],
    loading: true,
    error: null,
  });

  const fetchDashboardData = async () => {
    try {
      setDashboardData(prev => ({ ...prev, loading: true, error: null }));

      // Fetch dashboard stats
      const stats = await vapiService.getDashboardStats();

      // Fetch recent calls
      const calls = await vapiService.listCalls({ limit: 10 });
      const recentCalls = calls
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)
        .map(call => ({
          id: call.id,
          customer: call.customer?.name || call.customer?.number || 'Unknown',
          agent: call.assistant?.name || 'Unknown Agent',
          duration: vapiService.formatDuration(
            call.endedAt && call.startedAt 
              ? new Date(call.endedAt) - new Date(call.startedAt)
              : 0
          ),
          status: call.status || 'completed',
          time: new Date(call.createdAt).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          cost: call.cost ? `$${call.cost.toFixed(2)}` : '$0.00',
        }));

      // Fetch top performing agents
      const assistants = await vapiService.listAssistants({ limit: 20 });
      const topAgents = [];

      for (const assistant of assistants.slice(0, 5)) {
        try {
          const analytics = await vapiService.getAssistantAnalytics(assistant.id);
          topAgents.push({
            id: assistant.id,
            name: assistant.name || 'Unnamed Agent',
            calls: analytics.totalCalls,
            successRate: analytics.totalCalls > 0 
              ? Math.round((analytics.successfulCalls / analytics.totalCalls) * 100)
              : 0,
            avgDuration: vapiService.formatDuration(analytics.averageDuration * 1000),
            cost: `$${analytics.costBreakdown.total.toFixed(2)}`,
          });
        } catch (analyticsError) {
          console.warn(`Failed to fetch analytics for assistant ${assistant.id}:`, analyticsError);
          topAgents.push({
            id: assistant.id,
            name: assistant.name || 'Unnamed Agent',
            calls: 0,
            successRate: 0,
            avgDuration: '0:00',
            cost: '$0.00',
          });
        }
      }

      // Sort by number of calls
      topAgents.sort((a, b) => b.calls - a.calls);

      // Transform all assistants for the agents section
      const allAgents = assistants.map(assistant => ({
        id: assistant.id,
        name: assistant.name || 'Unnamed Agent',
        type: assistant.model?.provider || 'GPT',
        role: 'Assistant',
        description: assistant.firstMessage || 'AI Voice Assistant',
      }));

      setDashboardData({
        stats,
        recentCalls,
        topAgents,
        allAgents,
        loading: false,
        error: null,
      });

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setDashboardData(prev => ({
        ...prev,
        loading: false,
        error: error.message,
      }));
    }
  };

  useEffect(() => {
    fetchDashboardData();
    
    // Refresh data every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const refreshData = () => {
    fetchDashboardData();
  };

  return {
    ...dashboardData,
    refreshData,
  };
};
