import { supabase } from './supabase';

export interface PatientRequest {
  id: string;
  patient_id: string;
  doctor_id: string;
  problem_description: string;
  medical_documents: string[];
  status: 'pending' | 'accepted' | 'scheduled' | 'completed' | 'cancelled';
  appointment_time?: string;
  appointment_location?: string;
  doctor_reply?: string;
  created_at: string;
  updated_at: string;
  patients: {
    user_id: string;
    profiles: {
      full_name: string;
      phone?: string;
      avatar_url?: string;
    };
  };
}

export async function fetchDoctorRequests(doctorId: string): Promise<PatientRequest[]> {
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

export async function updateRequestStatus({
  requestId,
  status,
  doctorReply,
  appointmentTime,
  appointmentLocation
}: {
  requestId: string;
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

  const { data, error } = await supabase
    .from('patient_requests')
    .update(updateData)
    .eq('id', requestId)
    .select(); // Add select to see what was updated

  console.log('📊 Database response:', { data, error });

  if (error) {
    console.error('❌ Database error:', error);
    throw error;
  }
  
  if (!data || data.length === 0) {
    console.warn('⚠️ No rows were updated. Check if request ID exists:', requestId);
    throw new Error('No request found with that ID');
  }
  
  console.log('✅ Database update successful:', data[0]);
}


// In services/doctor.service.ts
export async function getDoctorIdByUserId(userId: string): Promise<string> {
  console.log('🔍 Looking for doctor with user_id:', userId);
  
  const { data, error } = await supabase
    .from('doctors')
    .select('id')
    .eq('user_id', userId)
    .single();

  console.log('📊 Doctor query result:', { data, error });

  if (error || !data) throw new Error('Doctor record not found');
  return data.id;
}

