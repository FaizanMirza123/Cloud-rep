// Custom hook for dashboard data
import { useState, useEffect } from 'react';
import apiService from '../services/api';

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

      // Fetch dashboard stats from our backend (filtered by user)
      const stats = await apiService.getDashboardAnalytics();

      // Fetch recent calls (these will be filtered by user in the backend)
      const calls = await apiService.getCalls({ limit: 10 });
      const recentCalls = calls
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5)
        .map(call => ({
          id: call.id,
          customer: call.customer_number || 'Unknown',
          agent: call.agent_name || 'Unknown Agent',
          duration: call.duration ? `${Math.floor(call.duration / 60)}:${(call.duration % 60).toString().padStart(2, '0')}` : '0:00',
          status: call.status || 'completed',
          time: new Date(call.created_at).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          cost: (() => {
            const costValue = parseFloat(call.cost);
            return (!isNaN(costValue) && costValue > 0) ? `$${costValue.toFixed(2)}` : '$0.00';
          })(),
        }));

      // Fetch agents (will be filtered by user in backend)
      const agents = await apiService.getAgents();
      
      // Fetch top performing agents - we'll calculate this from our filtered user agents
      const topAgents = [];
      
      // Process up to 5 agents for the top agents section
      for (const agent of agents.slice(0, 5)) {
        // We'll use our backend calls to calculate agent performance
        const agentCalls = await apiService.getAgentCalls(agent.id);
        
        const completedCalls = agentCalls.filter(call => call.status === 'completed');
        const totalCalls = agentCalls.length;
        const totalDuration = completedCalls.reduce((sum, call) => sum + (call.duration || 0), 0);
        const avgDuration = completedCalls.length > 0 
          ? totalDuration / completedCalls.length 
          : 0;
        
        const successRate = totalCalls > 0 
          ? Math.round((completedCalls.length / totalCalls) * 100) 
          : 0;
          
        const totalCost = agentCalls.reduce((sum, call) => {
          const cost = parseFloat(call.cost) || 0;
          return sum + cost;
        }, 0);
          
        topAgents.push({
          id: agent.id,
          name: agent.name || 'Unnamed Agent',
          calls: totalCalls,
          successRate: successRate,
          avgDuration: avgDuration ? `${Math.floor(avgDuration / 60)}:${(avgDuration % 60).toString().padStart(2, '0')}` : '0:00',
          cost: `$${(typeof totalCost === 'number' && !isNaN(totalCost)) ? totalCost.toFixed(2) : '0.00'}`,
        });
      }
      
      // Sort by number of calls
      topAgents.sort((a, b) => b.calls - a.calls);

      // Transform all agents for the agents section - using our backend data
      const allAgents = agents.map(agent => ({
        id: agent.id,
        name: agent.name || 'Unnamed Agent',
        type: agent.model || 'GPT',
        role: agent.role || 'Assistant',
        description: agent.description || 'AI Voice Assistant',
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
    
    // Refresh data every 2 minutes instead of 30 seconds to reduce server load  
    const interval = setInterval(fetchDashboardData, 120000);
    
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
