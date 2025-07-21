import { supabase } from './supabase';

export interface PatientRequest {
  id: number;
  patient_id: number;
  doctor_id: number;
  problem_description: string;
  medical_documents: string[];
  status: 'pending' | 'accepted' | 'scheduled' | 'completed' | 'cancelled';
  appointment_time?: string;
  appointment_location?: string;
  doctor_reply?: string;
  created_at: string;
  updated_at: string;
  patients?: {
    user_id: string;
    profiles: {
      full_name: string;
      phone?: string;
      avatar_url?: string;
    };
  };
}

export interface DoctorAvailability {
  id: number;
  doctor_id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
  created_at: string;
}

export interface Doctor {
  id: number;
  user_id: string;
  specialty: string;
  license_number: string;
  hospital_name: string;
  hospital_address: string;
  experience_years: number;
  consultation_fee: number;
  available_status: boolean;
  created_at: string;
  updated_at: string;
}

// Get doctor ID from user ID
export async function getDoctorIdByUserId(userId: string): Promise<number> {
  console.log('🔍 Looking for doctor with user_id:', userId);
  
  const { data, error } = await supabase
    .from('doctors')
    .select('id, user_id, specialty, available_status')
    .eq('user_id', userId)
    .single();

  console.log('📊 Doctor query result:', { data, error });

  if (error) {
    console.error('❌ Database error:', error);
    throw new Error(`Doctor lookup failed: ${error.message}`);
  }
  
  if (!data) {
    console.error('❌ No doctor record found for user:', userId);
    throw new Error('Doctor record not found');
  }
  
  console.log('✅ Found doctor:', data);
  return Number(data.id);
}

// Get doctor profile
export async function getDoctorProfile(userId: string): Promise<Doctor | null> {
  try {
    const { data, error } = await supabase
      .from('doctors')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching doctor profile:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching doctor profile:', error);
    return null;
  }
}

// Fetch doctor's incoming patient requests
export async function fetchDoctorRequests(doctorId: number): Promise<PatientRequest[]> {
  console.log('🔍 Fetching requests for doctor ID:', doctorId);
  
  const { data, error } = await supabase
    .from('patient_requests')
    .select(`
      *,
      patients!inner(
        id,
        user_id,
        profiles!inner(full_name, phone, avatar_url)
      )
    `)
    .eq('doctor_id', doctorId)
    .order('created_at', { ascending: false });

  console.log('📊 Query result:', { 
    dataCount: data?.length, 
    error,
    firstRecord: data?.[0] 
  });

  if (error) {
    console.error('❌ Database error:', error);
    throw error;
  }
  
  console.log('✅ Successfully fetched requests:', data?.length || 0);
  return data || [];
}

// Update patient request status
export async function updateRequestStatus({
  requestId,
  status,
  doctorReply,
  appointmentTime,
  appointmentLocation
}: {
  requestId: string | number;
  status: string;
  doctorReply?: string;
  appointmentTime?: string;
  appointmentLocation?: string;
}) {
  console.log('🔄 updateRequestStatus service called');
  console.log('Request ID:', requestId, typeof requestId);
  console.log('Status:', status);
  
  const updateData: any = {
    status,
    updated_at: new Date().toISOString()
  };

  if (doctorReply) updateData.doctor_reply = doctorReply;
  if (appointmentTime) updateData.appointment_time = appointmentTime;
  if (appointmentLocation) updateData.appointment_location = appointmentLocation;

  console.log('📦 Update data:', updateData);

  // Convert requestId to number if your database uses BIGINT
  const numericRequestId = typeof requestId === 'string' ? parseInt(requestId) : requestId;

  const { data, error } = await supabase
    .from('patient_requests')
    .update(updateData)
    .eq('id', numericRequestId)
    .select();

  console.log('📊 Database response:', { data, error });

  if (error) {
    console.error('❌ Database error:', error);
    throw error;
  }
  
  if (!data || data.length === 0) {
    console.warn('⚠️ No rows were updated. Check if request ID exists:', requestId);
    throw new Error('No request found with that ID or insufficient permissions');
  }
  
  console.log('✅ Database update successful:', data[0]);
  return data[0];
}

// Update doctor availability status (online/offline)
export async function updateDoctorAvailabilityStatus(userId: string, isAvailable: boolean): Promise<void> {
  try {
    console.log('🔄 Updating doctor availability status:', { userId, isAvailable });
    
    // Update the availability status
    const { data, error } = await supabase
      .from('doctors')
      .update({ 
        available_status: isAvailable,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select();

    if (error) {
      console.error('❌ Availability update error:', error);
      throw new Error(`Failed to update availability: ${error.message}`);
    }

    if (!data || data.length === 0) {
      throw new Error('No doctor record found to update');
    }

    console.log('✅ Availability updated successfully:', data[0]);
  } catch (error) {
    console.error('❌ Error updating doctor availability:', error);
    throw error;
  }
}

// Get current doctor availability status
export async function getDoctorAvailabilityStatus(userId: string): Promise<boolean> {
  try {
    console.log('🔍 Getting availability status for user:', userId);
    
    const { data, error } = await supabase
      .from('doctors')
      .select('available_status')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('❌ Error getting availability status:', error);
      return false;
    }

    if (!data) {
      console.warn('⚠️ No doctor record found for user:', userId);
      return false;
    }

    console.log('✅ Current availability status:', data.available_status);
    return data.available_status || false;
  } catch (error) {
    console.error('❌ Error getting availability status:', error);
    return false;
  }
}

// Update doctor weekly availability schedule
export async function updateDoctorWeeklyAvailability(
  doctorId: number, 
  availability: Omit<DoctorAvailability, 'id' | 'doctor_id' | 'created_at'>[]
): Promise<void> {
  try {
    console.log('🔄 Updating doctor weekly availability:', doctorId);
    
    // First, delete existing availability
    const { error: deleteError } = await supabase
      .from('doctor_availability')
      .delete()
      .eq('doctor_id', doctorId);

    if (deleteError) {
      console.error('❌ Error deleting old availability:', deleteError);
      throw deleteError;
    }

    // Insert new availability
    if (availability.length > 0) {
      const { error: insertError } = await supabase
        .from('doctor_availability')
        .insert(availability.map(item => ({ ...item, doctor_id: doctorId })));

      if (insertError) {
        console.error('❌ Error inserting new availability:', insertError);
        throw insertError;
      }
    }

    console.log('✅ Weekly availability updated successfully');
  } catch (error) {
    console.error('❌ Error updating weekly availability:', error);
    throw error;
  }
}

// Get doctor weekly availability schedule
export async function getDoctorWeeklyAvailability(doctorId: number): Promise<DoctorAvailability[]> {
  try {
    const { data, error } = await supabase
      .from('doctor_availability')
      .select('*')
      .eq('doctor_id', doctorId)
      .order('day_of_week');

    if (error) {
      console.error('❌ Error fetching weekly availability:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('❌ Error fetching weekly availability:', error);
    return [];
  }
}

// Update doctor profile
export async function updateDoctorProfile(userId: string, updates: Partial<Doctor>): Promise<void> {
  try {
    console.log('🔄 Updating doctor profile:', updates);
    
    const { error } = await supabase
      .from('doctors')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (error) {
      console.error('❌ Error updating doctor profile:', error);
      throw error;
    }

    console.log('✅ Doctor profile updated successfully');
  } catch (error) {
    console.error('❌ Error updating doctor profile:', error);
    throw error;
  }
}

// Get doctor statistics
export async function getDoctorStatistics(doctorId: number): Promise<{
  totalRequests: number;
  pendingRequests: number;
  completedRequests: number;
  scheduledRequests: number;
}> {
  try {
    const { data, error } = await supabase
      .from('patient_requests')
      .select('status')
      .eq('doctor_id', doctorId);

    if (error) {
      console.error('❌ Error fetching doctor statistics:', error);
      throw error;
    }

    const stats = {
      totalRequests: data?.length || 0,
      pendingRequests: data?.filter(r => r.status === 'pending').length || 0,
      completedRequests: data?.filter(r => r.status === 'completed').length || 0,
      scheduledRequests: data?.filter(r => r.status === 'scheduled').length || 0,
    };

    console.log('📊 Doctor statistics:', stats);
    return stats;
  } catch (error) {
    console.error('❌ Error calculating doctor statistics:', error);
    return {
      totalRequests: 0,
      pendingRequests: 0,
      completedRequests: 0,
      scheduledRequests: 0,
    };
  }
}
