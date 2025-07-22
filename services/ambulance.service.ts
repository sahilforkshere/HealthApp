import { supabase } from './supabase';

export interface AmbulanceDriver {
  id: string;
  user_id: string;
  license_number: string;
  vehicle_registration: string;
  vehicle_type: string;
  vehicle_model?: string;
  vehicle_year?: number;
  vehicle_color?: string;
  available_status: boolean;
  current_location?: string;
  created_at: string;
  updated_at: string;
  profiles: {
    id: string;
    full_name: string;
    email: string;
    phone?: string;
    avatar_url?: string;
    user_type: string;
  };
}

export interface AmbulanceRequest {
  id: string;
  patient_id: string;
  driver_id?: string;
  pickup_location: string;
  destination_location: string;
  emergency_level: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'accepted' | 'en-route' | 'arrived' | 'completed' | 'cancelled';
  notes?: string;
  driver_location?: string;
  patient_location?: string;
  estimated_arrival_time?: string;
  created_at: string;
  updated_at: string;
  patients?: {
    profiles: {
      full_name: string;
      phone?: string;
    };
  };
  ambulance_drivers?: {
    id: string;
    vehicle_registration: string;
    vehicle_type: string;
    current_location?: string;
    profiles: {
      full_name: string;
      phone?: string;
      avatar_url?: string;
    };
  };
}

// Get available ambulances with specific relationship name
export async function fetchAvailableAmbulances(): Promise<AmbulanceDriver[]> {
  try {
    console.log('🔍 Fetching available ambulances...');
    
    const { data, error } = await supabase
      .from('ambulance_drivers')
      .select(`
        id,
        user_id,
        license_number,
        vehicle_registration,
        vehicle_type,
        vehicle_model,
        vehicle_year,
        vehicle_color,
        available_status,
        current_location,
        created_at,
        updated_at,
        profiles!inner(id, full_name, phone, avatar_url, email, user_type)
      `)
      .eq('available_status', true)
      .eq('profiles.user_type', 'driver');

    if (error) {
      console.error('❌ Error fetching ambulances:', error);
      throw error;
    }

    console.log('✅ Fetched ambulances:', data?.length || 0);
    return data || [];
  } catch (error) {
    console.error('❌ Error in fetchAvailableAmbulances:', error);
    return [];
  }
}

// Alternative name for the same function (for backward compatibility)
export const getAvailableAmbulances = fetchAvailableAmbulances;

// Submit ambulance request
export async function submitAmbulanceRequest({
  patient_id,
  pickup_location,
  destination_location,
  emergency_level,
  notes
}: {
  patient_id: string;
  pickup_location: string;
  destination_location: string;
  emergency_level: string;
  notes?: string;
}): Promise<AmbulanceRequest> {
  try {
    console.log('🚨 Submitting ambulance request...');
    
    const { data, error } = await supabase
      .from('ambulance_requests')
      .insert([{
        patient_id,
        pickup_location,
        destination_location,
        emergency_level,
        notes,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select(`
        *,
        patients!inner (
          profiles!inner (full_name, phone)
        )
      `)
      .single();

    if (error) {
      console.error('❌ Error submitting request:', error);
      throw error;
    }

    console.log('✅ Request submitted successfully');
    return data;
  } catch (error) {
    console.error('❌ Error in submitAmbulanceRequest:', error);
    throw error;
  }
}

// Get driver's assigned requests
export async function getDriverRequests(driverId: string): Promise<AmbulanceRequest[]> {
  console.log('📋 Fetching requests for specific driver ID:', driverId);
  
  const { data, error } = await supabase
    .from('ambulance_requests')
    .select(`
      *,
      patients!inner(
        profiles!inner(full_name, phone)
      )
    `)
    .eq('driver_id', driverId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error fetching driver requests:', error);
    throw error;
  }

  console.log('✅ Fetched driver-specific requests:', data?.length || 0);
  return data || [];
}

// Get pending requests for drivers to accept
export async function getPendingRequests(): Promise<AmbulanceRequest[]> {
  console.log('📋 Fetching pending unassigned requests...');
  
  const { data, error } = await supabase
    .from('ambulance_requests')
    .select(`
      *,
      patients!inner(
        profiles!inner(full_name, phone)
      )
    `)
    .is('driver_id', null)
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('❌ Error fetching pending requests:', error);
    throw error;
  }

  console.log('✅ Fetched pending requests:', data?.length || 0);
  return data || [];
}

// Accept ambulance request with location
export async function acceptAmbulanceRequest(
  requestId: string, 
  driverId: string, 
  driverLocation?: string
): Promise<void> {
  try {
    console.log('🚨 Accepting ambulance request:', { requestId, driverId, driverLocation });
    
    const updateData: any = {
      driver_id: driverId,
      status: 'accepted',
      driver_location: driverLocation || 'Location not provided',
      updated_at: new Date().toISOString()
    };

    // Calculate estimated arrival time (10 minutes from now)
    const estimatedArrival = new Date();
    estimatedArrival.setMinutes(estimatedArrival.getMinutes() + 10);
    updateData.estimated_arrival_time = estimatedArrival.toISOString();

    const { error } = await supabase
      .from('ambulance_requests')
      .update(updateData)
      .eq('id', requestId)
      .is('driver_id', null);

    if (error) {
      console.error('❌ Error accepting request:', error);
      throw error;
    }

    console.log('✅ Request accepted successfully');
  } catch (error) {
    console.error('❌ Error in acceptAmbulanceRequest:', error);
    throw error;
  }
}

// Update driver location during active request
export async function updateDriverLocation(requestId: string, driverLocation: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('ambulance_requests')
      .update({
        driver_location: driverLocation,
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId);

    if (error) {
      console.error('❌ Error updating driver location:', error);
      throw error;
    }

    console.log('✅ Driver location updated');
  } catch (error) {
    console.error('❌ Error in updateDriverLocation:', error);
    throw error;
  }
}

// Update request status (en-route, arrived, completed)
export async function updateAmbulanceRequestStatus(
  requestId: string,
  status: string,
  driverId?: string,
  driverLocation?: string
): Promise<void> {
  try {
    const updateData: any = { 
      status,
      updated_at: new Date().toISOString()
    };
    
    if (driverId) updateData.driver_id = driverId;
    if (driverLocation) updateData.driver_location = driverLocation;

    const { error } = await supabase
      .from('ambulance_requests')
      .update(updateData)
      .eq('id', requestId);

    if (error) {
      console.error('❌ Error updating request status:', error);
      throw error;
    }

    console.log('✅ Request status updated to:', status);
  } catch (error) {
    console.error('❌ Error in updateAmbulanceRequestStatus:', error);
    throw error;
  }
}

// Get active request for patient tracking
export async function getPatientActiveRequest(patientId: string): Promise<AmbulanceRequest | null> {
  try {
    console.log('🔍 Fetching active request for patient:', patientId);
    
    const { data, error } = await supabase
      .from('ambulance_requests')
      .select(`
        *,
        ambulance_drivers!inner (
          id,
          vehicle_registration,
          vehicle_type,
          current_location,
          profiles!inner (full_name, phone, avatar_url)
        )
      `)
      .eq('patient_id', patientId)
      .in('status', ['accepted', 'en-route', 'arrived'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('❌ Error fetching active request:', error);
      throw error;
    }

    console.log('✅ Active request found:', !!data);
    return data;
  } catch (error) {
    console.error('❌ Error in getPatientActiveRequest:', error);
    return null;
  }
}

// Get all requests for a patient (history)
export async function getPatientRequests(patientId: string): Promise<AmbulanceRequest[]> {
  try {
    const { data, error } = await supabase
      .from('ambulance_requests')
      .select(`
        *,
        ambulance_drivers (
          id,
          vehicle_registration,
          vehicle_type,
          profiles!inner (full_name, phone, avatar_url)
        )
      `)
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching patient requests:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('❌ Error in getPatientRequests:', error);
    return [];
  }
}

// Driver utility functions
export async function getDriverIdByUserId(userId: string): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('ambulance_drivers')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      throw new Error('Driver record not found');
    }

    return data.id;
  } catch (error) {
    console.error('❌ Error getting driver ID:', error);
    throw error;
  }
}

export async function updateDriverAvailabilityStatus(userId: string, isAvailable: boolean): Promise<void> {
  try {
    const { error } = await supabase
      .from('ambulance_drivers')
      .update({ 
        available_status: isAvailable,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (error) {
      console.error('❌ Error updating availability:', error);
      throw error;
    }

    console.log('✅ Availability updated to:', isAvailable);
  } catch (error) {
    console.error('❌ Error in updateDriverAvailabilityStatus:', error);
    throw error;
  }
}

export async function getDriverAvailabilityStatus(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('ambulance_drivers')
      .select('available_status')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return false;
    }

    return data.available_status || false;
  } catch (error) {
    console.error('❌ Error getting availability status:', error);
    return false;
  }
}

export async function getPatientIdByUserId(userId: string): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('patients')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      throw new Error('Patient record not found');
    }

    return data.id;
  } catch (error) {
    console.error('❌ Error getting patient ID:', error);
    throw error;
  }
}
// Update driver location with coordinates
export async function updateDriverLocationWithCoordinates(
  requestId: string, 
  driverLocation: string,
  latitude?: number,
  longitude?: number
): Promise<void> {
  try {
    const updateData: any = {
      driver_location: driverLocation,
      updated_at: new Date().toISOString()
    };

    // Add coordinates if provided
    if (latitude && longitude) {
      updateData.driver_latitude = latitude;
      updateData.driver_longitude = longitude;
    }

    const { error } = await supabase
      .from('ambulance_requests')
      .update(updateData)
      .eq('id', requestId);

    if (error) {
      console.error('❌ Error updating driver location:', error);
      throw error;
    }

    console.log('✅ Driver location updated with coordinates');
  } catch (error) {
    console.error('❌ Error in updateDriverLocationWithCoordinates:', error);
    throw error;
  }
}
export async function updateRequestStatus(
  requestId: string, 
  status: 'completed' | 'cancelled' | 'en-route' | 'arrived',
  reason?: string
): Promise<void> {
  try {
    console.log(`🔄 Updating request ${requestId} to status: ${status}`);
    
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };

    // Add cancellation reason if provided
    if (reason && status === 'cancelled') {
      updateData.cancellation_reason = reason;
    }

    // Add completion time if completing
    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('ambulance_requests')
      .update(updateData)
      .eq('id', requestId);

    if (error) {
      console.error('❌ Error updating request status:', error);
      throw error;
    }

    console.log('✅ Request status updated successfully');
  } catch (error) {
    console.error('❌ Error in updateRequestStatus:', error);
    throw error;
  }
}

// Get patient's request history with status tracking
export async function getPatientRequestHistory(patientId: string): Promise<AmbulanceRequest[]> {
  try {
    const { data, error } = await supabase
      .from('ambulance_requests')
      .select(`
        *,
        ambulance_drivers (
          id,
          vehicle_registration,
          vehicle_type,
          profiles!inner (full_name, phone, avatar_url)
        )
      `)
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching patient history:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('❌ Error in getPatientRequestHistory:', error);
    return [];
  }
}

// Check if patient has active request
// export async function getPatientActiveRequest(patientId: string): Promise<AmbulanceRequest | null> {
//   try {
//     const { data, error } = await supabase
//       .from('ambulance_requests')
//       .select(`
//         *,
//         ambulance_drivers (
//           id,
//           vehicle_registration,
//           vehicle_type,
//           current_location,
//           profiles!inner (full_name, phone, avatar_url)
//         )
//       `)
//       .eq('patient_id', patientId)
//       .in('status', ['pending', 'accepted', 'en-route', 'arrived'])
//       .order('created_at', { ascending: false })
//       .limit(1)
//       .single();

//     if (error && error.code !== 'PGRST116') {
//       console.error('❌ Error fetching active request:', error);
//       throw error;
//     }

//     return data;
//   } catch (error) {
//     console.error('❌ Error in getPatientActiveRequest:', error);
//     return null;
//   }
// }