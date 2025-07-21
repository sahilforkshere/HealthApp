import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  getDriverRequests,
  getDriverIdByUserId,
  getDriverAvailabilityStatus,
  updateDriverAvailabilityStatus,
  AmbulanceRequest
} from '../services/ambulance.service';
import { useAuth } from './AuthContext';

interface DriverContextType {
  requests: AmbulanceRequest[];
  loading: boolean;
  isAvailable: boolean;
  driverId: string;
  loadRequests: () => Promise<void>;
  updateAvailability: (status: boolean) => Promise<void>;
  refreshData: () => Promise<void>;
}

const DriverContext = createContext<DriverContextType>({} as DriverContextType);

export const useDriver = () => useContext(DriverContext);

export function DriverProvider({ children }: { children: React.ReactNode }) {
  const [requests, setRequests] = useState<AmbulanceRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [driverId, setDriverId] = useState<string>('');
  const { userProfile } = useAuth();

  const loadRequests = async () => {
    if (!driverId) return;

    try {
      setLoading(true);
      const data = await getDriverRequests(driverId);
      setRequests(data);
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateAvailability = async (status: boolean) => {
    if (!userProfile) return;

    try {
      await updateDriverAvailabilityStatus(userProfile.id, status);
      setIsAvailable(status);
    } catch (error) {
      console.error('Error updating availability:', error);
      throw error;
    }
  };

  const refreshData = async () => {
    if (!userProfile) return;

    try {
      const [driverIdResult, availabilityStatus] = await Promise.all([
        getDriverIdByUserId(userProfile.id),
        getDriverAvailabilityStatus(userProfile.id)
      ]);
      
      setDriverId(driverIdResult);
      setIsAvailable(availabilityStatus);
      
      const requestsData = await getDriverRequests(driverIdResult);
      setRequests(requestsData);
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  };

  useEffect(() => {
    if (userProfile?.user_type === 'driver') {
      refreshData();
    }
  }, [userProfile]);

  return (
    <DriverContext.Provider value={{
      requests,
      loading,
      isAvailable,
      driverId,
      loadRequests,
      updateAvailability,
      refreshData
    }}>
      {children}
    </DriverContext.Provider>
  );
}
