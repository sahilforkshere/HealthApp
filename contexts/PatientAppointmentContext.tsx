import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchPatientAppointments, PatientAppointment } from '../services/appointment.service';
import { useAuth } from './AuthContext';

interface PatientAppointmentContextType {
  appointments: PatientAppointment[];
  loading: boolean;
  loadAppointments: () => Promise<void>;
  refreshing: boolean;
}

const PatientAppointmentContext = createContext<PatientAppointmentContextType>({} as PatientAppointmentContextType);

export const usePatientAppointments = () => useContext(PatientAppointmentContext);

export function PatientAppointmentProvider({ children }: { children: React.ReactNode }) {
  const [appointments, setAppointments] = useState<PatientAppointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { userProfile } = useAuth();

  const loadAppointments = async () => {
    if (!userProfile) {
      console.log('❌ No user profile available');
      return;
    }

    try {
      setLoading(true);
      console.log('🔄 Loading appointments for user:', userProfile.id);
      const data = await fetchPatientAppointments(userProfile.id);
      setAppointments(data);
      console.log('✅ Loaded patient appointments:', data.length);
    } catch (error) {
      console.error('❌ Error loading appointments:', error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userProfile?.user_type === 'patient') {
      console.log('👤 User is patient, loading appointments...');
      loadAppointments();
    } else {
      console.log('❌ User is not patient or no profile:', userProfile?.user_type);
    }
  }, [userProfile]);

  return (
    <PatientAppointmentContext.Provider value={{
      appointments,
      loading,
      loadAppointments,
      refreshing
    }}>
      {children}
    </PatientAppointmentContext.Provider>
  );
}
