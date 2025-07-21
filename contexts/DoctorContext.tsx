import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchDoctorRequests, updateRequestStatus, getDoctorIdByUserId, PatientRequest } from '../services/doctor.service';
import { useAuth } from './AuthContext';

interface DoctorContextType {
  requests: PatientRequest[];
  loading: boolean;
  loadRequests: () => Promise<void>;
  updateRequest: (requestId: string, status: string, reply?: string, appointmentTime?: string, appointmentLocation?: string) => Promise<void>;
  refreshing: boolean;
}

const DoctorContext = createContext<DoctorContextType>({} as DoctorContextType);

export const useDoctor = () => useContext(DoctorContext);

export function DoctorProvider({ children }: { children: React.ReactNode }) {
  const [requests, setRequests] = useState<PatientRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { userProfile } = useAuth();

  const loadRequests = async () => {
  if (!userProfile) return;

  try {
    setLoading(true);
    const doctorId = await getDoctorIdByUserId(userProfile.id);
    const data = await fetchDoctorRequests(doctorId);
    console.log('✅ Loaded requests:', data.length); // Add this debug log
    setRequests(data);
  } catch (error) {
    console.error('❌ Error loading requests:', error);
  } finally {
    setLoading(false);
  }
};

  const updateRequest = async (requestId: string, status: string, reply?: string, appointmentTime?: string, appointmentLocation?: string) => {
    try {
      await updateRequestStatus({
        requestId,
        status,
        doctorReply: reply,
        appointmentTime,
        appointmentLocation
      });
      
      // Update local state
      setRequests(prev => prev.map(req => 
        req.id === requestId 
          ? { 
              ...req, 
              status: status as any, 
              doctor_reply: reply || req.doctor_reply,
              appointment_time: appointmentTime || req.appointment_time,
              appointment_location: appointmentLocation || req.appointment_location,
              updated_at: new Date().toISOString()
            }
          : req
      ));
    } catch (error) {
      console.error('Error updating request:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (userProfile?.user_type === 'doctor') {
      loadRequests();
    }
  }, [userProfile]);

  return (
    <DoctorContext.Provider value={{
      requests,
      loading,
      loadRequests,
      updateRequest,
      refreshing
    }}>
      {children}
    </DoctorContext.Provider>
  );
}
