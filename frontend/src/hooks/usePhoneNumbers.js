// Custom hook for phone numbers data
import { useState, useEffect } from 'react';
import vapiService from '../services/vapiService';

export const usePhoneNumbers = () => {
  const [phoneNumbersData, setPhoneNumbersData] = useState({
    phoneNumbers: [],
    loading: true,
    error: null,
  });

  const fetchPhoneNumbers = async () => {
    try {
      setPhoneNumbersData(prev => ({ ...prev, loading: true, error: null }));

      // Fetch phone numbers from VAPI
      const phoneNumbers = await vapiService.listPhoneNumbers({ limit: 100 });

      // Transform the data for the UI
      const transformedNumbers = phoneNumbers.map(number => ({
        id: number.id,
        number: number.number || 'Unknown',
        name: number.name || `Phone Number ${number.number}`,
        provider: number.provider || 'vapi',
        status: number.status || 'active',
        assignedAgent: number.assistantId ? 'Assigned' : null,
        createdAt: number.createdAt ? new Date(number.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        callsToday: 0, // This would need to be calculated from calls data
        callsThisMonth: 0, // This would need to be calculated from calls data
        country: number.country || 'US',
        type: number.type || 'local',
        cost: number.cost || 0,
        assistantId: number.assistantId,
      }));

      // Get call statistics for each phone number
      const numbersWithStats = await Promise.all(
        transformedNumbers.map(async (number) => {
          try {
            // Get calls for this phone number
            const calls = await vapiService.listCalls({ 
              phoneNumberId: number.id,
              limit: 100 
            });

            // Calculate today's calls
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const callsToday = calls.filter(call => 
              new Date(call.createdAt) >= today
            ).length;

            // Calculate this month's calls
            const thisMonth = new Date();
            thisMonth.setDate(1);
            thisMonth.setHours(0, 0, 0, 0);
            const callsThisMonth = calls.filter(call => 
              new Date(call.createdAt) >= thisMonth
            ).length;

            return {
              ...number,
              callsToday,
              callsThisMonth,
            };
          } catch (error) {
            console.warn(`Failed to fetch call stats for phone number ${number.id}:`, error);
            return number;
          }
        })
      );

      setPhoneNumbersData({
        phoneNumbers: numbersWithStats,
        loading: false,
        error: null,
      });

    } catch (error) {
      console.error('Failed to fetch phone numbers:', error);
      setPhoneNumbersData(prev => ({
        ...prev,
        loading: false,
        error: error.message,
      }));
    }
  };

  const deletePhoneNumber = async (phoneNumberId) => {
    try {
      // Note: VAPI API might not have a delete endpoint for phone numbers
      // This would depend on the actual API capabilities
      console.log('Delete phone number:', phoneNumberId);
      
      // For now, just remove from local state
      setPhoneNumbersData(prev => ({
        ...prev,
        phoneNumbers: prev.phoneNumbers.filter(number => number.id !== phoneNumberId)
      }));
      
      return true;
    } catch (error) {
      console.error('Failed to delete phone number:', error);
      throw error;
    }
  };

  const assignAgent = async (phoneNumberId, assistantId) => {
    try {
      // This would update the phone number's assistant assignment
      // Implementation depends on VAPI API capabilities
      console.log('Assign agent:', { phoneNumberId, assistantId });
      
      // Update local state
      setPhoneNumbersData(prev => ({
        ...prev,
        phoneNumbers: prev.phoneNumbers.map(number => 
          number.id === phoneNumberId 
            ? { ...number, assistantId, assignedAgent: 'Assigned' }
            : number
        )
      }));
      
      return true;
    } catch (error) {
      console.error('Failed to assign agent:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchPhoneNumbers();
  }, []);

  const refreshData = () => {
    fetchPhoneNumbers();
  };

  return {
    ...phoneNumbersData,
    refreshData,
    deletePhoneNumber,
    assignAgent,
  };
};
