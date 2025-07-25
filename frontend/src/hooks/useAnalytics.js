// Custom hook for analytics data
import { useState, useEffect } from 'react';
import vapiService from '../services/vapiService';

export const useAnalytics = (timeRange = '7d') => {
  const [analyticsData, setAnalyticsData] = useState({
    stats: {
      totalCalls: 0,
      totalDuration: 0,
      averageDuration: 0,
      totalCost: 0,
      successRate: 0,
      peakHour: 0,
    },
    callVolumeData: [],
    callEndReasons: [],
    agentPerformance: [],
    costBreakdown: {
      transport: 0,
      llm: 0,
      tts: 0,
      stt: 0,
    },
    loading: true,
    error: null,
  });

  const getDateRange = (range) => {
    const end = new Date();
    const start = new Date();
    
    switch (range) {
      case '7d':
        start.setDate(start.getDate() - 7);
        break;
      case '30d':
        start.setDate(start.getDate() - 30);
        break;
      case '90d':
        start.setDate(start.getDate() - 90);
        break;
      default:
        start.setDate(start.getDate() - 7);
    }
    
    return { start, end };
  };

  const fetchAnalyticsData = async () => {
    try {
      setAnalyticsData(prev => ({ ...prev, loading: true, error: null }));

      const { start, end } = getDateRange(timeRange);
      
      // Fetch calls and assistants data
      const [calls, assistants] = await Promise.all([
        vapiService.listCalls({ 
          limit: 1000,
          createdAtGt: start.toISOString(),
          createdAtLt: end.toISOString(),
        }),
        vapiService.listAssistants({ limit: 100 }),
      ]);

      // Calculate basic stats
      const totalCalls = calls.length;
      const completedCalls = calls.filter(call => call.endedAt && call.startedAt);
      const totalDuration = completedCalls.reduce((sum, call) => {
        const duration = new Date(call.endedAt) - new Date(call.startedAt);
        return sum + duration;
      }, 0);
      const averageDuration = completedCalls.length > 0 ? totalDuration / completedCalls.length / 1000 / 60 : 0;
      const totalCost = calls.reduce((sum, call) => sum + (call.cost || 0), 0);
      const successRate = totalCalls > 0 ? (completedCalls.length / totalCalls) * 100 : 0;

      // Calculate call volume data by day
      const callVolumeData = [];
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        const dayStart = new Date(date);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(date);
        dayEnd.setHours(23, 59, 59, 999);
        
        const dayCalls = calls.filter(call => {
          const callDate = new Date(call.createdAt);
          return callDate >= dayStart && callDate <= dayEnd;
        });
        
        // Separate inbound and outbound calls
        const inboundCalls = dayCalls.filter(call => call.type === 'inboundPhoneCall' || !call.type).length;
        const outboundCalls = dayCalls.filter(call => call.type === 'outboundPhoneCall').length;
        
        callVolumeData.push({
          date: dateStr,
          inbound: inboundCalls,
          outbound: outboundCalls,
          total: dayCalls.length,
        });
      }

      // Calculate call end reasons
      const endReasons = {
        completed: calls.filter(call => call.endedReason === 'customer-ended-call' || call.endedAt).length,
        hungUp: calls.filter(call => call.endedReason === 'customer-hung-up').length,
        noAnswer: calls.filter(call => call.endedReason === 'no-answer').length,
        error: calls.filter(call => call.endedReason === 'error' || call.endedReason === 'assistant-error').length,
      };

      const callEndReasons = [
        { name: 'Completed', value: endReasons.completed, color: '#10B981' },
        { name: 'Hung Up', value: endReasons.hungUp, color: '#EF4444' },
        { name: 'No Answer', value: endReasons.noAnswer, color: '#F59E0B' },
        { name: 'Error', value: endReasons.error, color: '#8B5CF6' },
      ];

      // Calculate agent performance
      const agentPerformance = [];
      for (const assistant of assistants.slice(0, 10)) {
        const assistantCalls = calls.filter(call => call.assistantId === assistant.id);
        const assistantCompletedCalls = assistantCalls.filter(call => call.endedAt && call.startedAt);
        const assistantDuration = assistantCompletedCalls.reduce((sum, call) => {
          const duration = new Date(call.endedAt) - new Date(call.startedAt);
          return sum + duration;
        }, 0);
        const assistantAvgDuration = assistantCompletedCalls.length > 0 
          ? assistantDuration / assistantCompletedCalls.length / 1000 / 60 
          : 0;
        const assistantCost = assistantCalls.reduce((sum, call) => sum + (call.cost || 0), 0);
        const assistantSuccessRate = assistantCalls.length > 0 
          ? (assistantCompletedCalls.length / assistantCalls.length) * 100 
          : 0;

        agentPerformance.push({
          id: assistant.id,
          name: assistant.name || 'Unnamed Agent',
          calls: assistantCalls.length,
          avgDuration: assistantAvgDuration,
          successRate: assistantSuccessRate,
          totalCost: assistantCost,
        });
      }

      // Sort by number of calls
      agentPerformance.sort((a, b) => b.calls - a.calls);

      // Calculate cost breakdown
      const costBreakdown = calls.reduce((breakdown, call) => {
        if (call.costBreakdown) {
          breakdown.transport += call.costBreakdown.transport || 0;
          breakdown.llm += call.costBreakdown.llm || 0;
          breakdown.tts += call.costBreakdown.tts || 0;
          breakdown.stt += call.costBreakdown.stt || 0;
        }
        return breakdown;
      }, { transport: 0, llm: 0, tts: 0, stt: 0 });

      // Calculate peak hour
      const hourCounts = new Array(24).fill(0);
      calls.forEach(call => {
        if (call.startedAt) {
          const hour = new Date(call.startedAt).getHours();
          hourCounts[hour]++;
        }
      });
      const peakHour = hourCounts.indexOf(Math.max(...hourCounts));

      setAnalyticsData({
        stats: {
          totalCalls,
          totalDuration: totalDuration / 1000 / 60, // Convert to minutes
          averageDuration,
          totalCost,
          successRate,
          peakHour,
        },
        callVolumeData,
        callEndReasons,
        agentPerformance,
        costBreakdown,
        loading: false,
        error: null,
      });

    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
      setAnalyticsData(prev => ({
        ...prev,
        loading: false,
        error: error.message,
      }));
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const refreshData = () => {
    fetchAnalyticsData();
  };

  const exportData = () => {
    // Export analytics data as CSV or JSON
    const data = {
      timeRange,
      stats: analyticsData.stats,
      callVolumeData: analyticsData.callVolumeData,
      agentPerformance: analyticsData.agentPerformance,
      generatedAt: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vapi-analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return {
    ...analyticsData,
    refreshData,
    exportData,
  };
};
