import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  fetchDoctorRequests, 
  updateRequestStatus, 
  updateDoctorAvailabilityStatus,
  getDoctorAvailabilityStatus,
  getDoctorIdByUserId,
  getDoctorStatistics,
  PatientRequest
} from '../services/doctor.service';
import { useAuth } from './AuthContext';

interface Statistics {
  totalRequests: number;
  pendingRequests: number;
  completedRequests: number;
  scheduledRequests: number;
}

interface DoctorContextType {
  requests: PatientRequest[];
  loading: boolean;
  isAvailable: boolean;
  statistics: Statistics;
  doctorId: number | null;
  loadRequests: () => Promise<void>;
  updateRequest: (requestId: string, status: string, reply?: string, appointmentTime?: string, appointmentLocation?: string) => Promise<void>;
  toggleAvailability: () => Promise<void>;
  refreshStatistics: () => Promise<void>;
  refreshing: boolean;
  statisticsLoading: boolean;
}

const DoctorContext = createContext<DoctorContextType>({} as DoctorContextType);

export const useDoctor = () => useContext(DoctorContext);

export function DoctorProvider({ children }: { children: React.ReactNode }) {
  const [requests, setRequests] = useState<PatientRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [doctorId, setDoctorId] = useState<number | null>(null);
  const [statisticsLoading, setStatisticsLoading] = useState(false);
  
  // Initialize statistics with default values to prevent undefined errors
  const [statistics, setStatistics] = useState<Statistics>({
    totalRequests: 0,
    pendingRequests: 0,
    completedRequests: 0,
    scheduledRequests: 0,
  });
  
  const { userProfile } = useAuth();

  const loadRequests = async () => {
    if (!userProfile) {
      console.log('❌ No user profile available');
      return;
    }

    try {
      setLoading(true);
      console.log('🔄 Loading requests for user:', userProfile.id);
      
      const doctorIdResult = await getDoctorIdByUserId(userProfile.id);
      setDoctorId(doctorIdResult);
      console.log('✅ Doctor ID set:', doctorIdResult);
      
      const data = await fetchDoctorRequests(doctorIdResult);
      setRequests(data);
      console.log('✅ Loaded doctor requests:', data.length);
      
      // Calculate statistics from loaded requests
      calculateLocalStatistics(data);
    } catch (error) {
      console.error('❌ Error loading doctor requests:', error);
      setRequests([]);
      // Reset statistics on error
      setStatistics({
        totalRequests: 0,
        pendingRequests: 0,
        completedRequests: 0,
        scheduledRequests: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateLocalStatistics = (requestsData: PatientRequest[]) => {
    const stats = {
      totalRequests: requestsData.length,
      pendingRequests: requestsData.filter(r => r.status === 'pending').length,
      completedRequests: requestsData.filter(r => r.status === 'completed').length,
      scheduledRequests: requestsData.filter(r => r.status === 'scheduled').length,
    };
    
    console.log('📊 Calculated statistics:', stats);
    setStatistics(stats);
  };

  const loadAvailabilityStatus = async () => {
    if (!userProfile) {
      console.log('❌ No user profile for availability check');
      return;
    }

    try {
      const status = await getDoctorAvailabilityStatus(userProfile.id);
      setIsAvailable(status);
      console.log('✅ Current availability status:', status);
    } catch (error) {
      console.error('❌ Error loading availability status:', error);
      setIsAvailable(false);
    }
  };

  const refreshStatistics = async () => {
    if (!doctorId) {
      console.log('❌ No doctor ID for statistics refresh');
      return;
    }

    try {
      setStatisticsLoading(true);
      const stats = await getDoctorStatistics(doctorId);
      setStatistics(stats);
      console.log('✅ Statistics refreshed:', stats);
    } catch (error) {
      console.error('❌ Error loading statistics:', error);
      // Keep existing statistics on error
    } finally {
      setStatisticsLoading(false);
    }
  };

  const toggleAvailability = async () => {
    if (!userProfile) {
      console.error('❌ No user profile available');
      throw new Error('User not authenticated');
    }

    try {
      console.log('🔄 Toggling availability from:', isAvailable, 'to:', !isAvailable);
      
      const newStatus = !isAvailable;
      await updateDoctorAvailabilityStatus(userProfile.id, newStatus);
      setIsAvailable(newStatus);
      
      console.log('✅ Availability toggled successfully to:', newStatus);
    } catch (error: any) {
      console.error('❌ Error toggling availability:', error);
      throw error;
    }
  };

  const updateRequest = async (requestId: string, status: string, reply?: string, appointmentTime?: string, appointmentLocation?: string) => {
    try {
      console.log('🔄 Updating request:', requestId, 'to status:', status);
      
      const updatedRequest = await updateRequestStatus({
        requestId,
        status,
        doctorReply: reply,
        appointmentTime,
        appointmentLocation
      });
      
      // Update local state
      const updatedRequests = requests.map(req => 
        String(req.id) === String(requestId)
          ? { 
              ...req, 
              status: status as any, 
              doctor_reply: reply || req.doctor_reply,
              appointment_time: appointmentTime || req.appointment_time,
              appointment_location: appointmentLocation || req.appointment_location,
              updated_at: new Date().toISOString()
            }
          : req
      );
      
      setRequests(updatedRequests);
      
      // Recalculate statistics from updated requests
      calculateLocalStatistics(updatedRequests);
      
      console.log('✅ Request updated successfully');
    } catch (error) {
      console.error('❌ Error updating request:', error);
      throw error;
    }
  };

  // Load all data when user profile is available
  useEffect(() => {
    if (userProfile?.user_type === 'doctor') {
      console.log('👨‍⚕️ User is doctor, loading data...');
      loadRequests();
      loadAvailabilityStatus();
    } else {
      console.log('❌ User is not doctor or no profile:', userProfile?.user_type);
      // Reset all states when not a doctor
      setRequests([]);
      setStatistics({
        totalRequests: 0,
        pendingRequests: 0,
        completedRequests: 0,
        scheduledRequests: 0,
      });
      setDoctorId(null);
      setIsAvailable(false);
    }
  }, [userProfile]);

  return (
    <DoctorContext.Provider value={{
      requests,
      loading,
      isAvailable,
      statistics,
      doctorId,
      loadRequests,
      updateRequest,
      toggleAvailability,
      refreshStatistics,
      refreshing,
      statisticsLoading
    }}>
      {children}
    </DoctorContext.Provider>
  );
}
