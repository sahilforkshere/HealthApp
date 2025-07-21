import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  fetchAvailableAmbulances, // Use the correct function name
  submitAmbulanceRequest, 
  getPatientIdByUserId,
  AmbulanceDriver 
} from '../services/ambulance.service';
import { useAuth } from './AuthContext';

interface AmbulanceContextType {
  availableAmbulances: AmbulanceDriver[];
  loading: boolean;
  refreshing: boolean;
  loadAmbulances: () => Promise<void>;
  requestAmbulance: (pickup: string, destination: string, emergency: string, notes?: string) => Promise<void>;
}

const AmbulanceContext = createContext<AmbulanceContextType>({} as AmbulanceContextType);

export const useAmbulance = () => useContext(AmbulanceContext);

export function AmbulanceProvider({ children }: { children: React.ReactNode }) {
  const [availableAmbulances, setAvailableAmbulances] = useState<AmbulanceDriver[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { userProfile } = useAuth();

  const loadAmbulances = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading ambulances from context...');
      
      const ambulances = await fetchAvailableAmbulances();
      setAvailableAmbulances(ambulances);
      
      console.log('✅ Loaded ambulances in context:', ambulances.length);
    } catch (error) {
      console.error('❌ Error loading ambulances in context:', error);
      setAvailableAmbulances([]);
    } finally {
      setLoading(false);
    }
  };

  const requestAmbulance = async (pickup: string, destination: string, emergency: string, notes?: string) => {
    if (!userProfile) {
      throw new Error('User not authenticated');
    }
    
    try {
      console.log('🚨 Requesting ambulance from context...');
      
      const patientId = await getPatientIdByUserId(userProfile.id);
      
      await submitAmbulanceRequest({
        patient_id: patientId,
        pickup_location: pickup,
        destination_location: destination,
        emergency_level: emergency,
        notes
      });
      
      console.log('✅ Ambulance request submitted from context');
    } catch (error) {
      console.error('❌ Error requesting ambulance from context:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (userProfile?.user_type === 'patient') {
      loadAmbulances();
    }
  }, [userProfile]);

  return (
    <AmbulanceContext.Provider value={{
      availableAmbulances,
      loading,
      refreshing,
      loadAmbulances,
      requestAmbulance
    }}>
      {children}
    </AmbulanceContext.Provider>
  );
}
