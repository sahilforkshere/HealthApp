import { supabase } from './supabase';

export interface PatientAppointment {
  id: number;              // Changed to number to match your database
  patient_id: number;      // Changed to number
  doctor_id: number;       // Changed to number
  problem_description: string;
  medical_documents: string[];
  status: 'pending' | 'accepted' | 'scheduled' | 'completed' | 'cancelled';
  doctor_reply?: string;
  appointment_time?: string;
  appointment_location?: string;
  created_at: string;
  updated_at: string;
  doctors: {
    specialty: string;
    hospital_name: string;
    experience_years: number;
    consultation_fee: number;
    profiles: {
      full_name: string;
      avatar_url?: string;
      phone?: string;
    };
  };
}

// Get patient's own consultation requests
export async function fetchPatientAppointments(userId: string): Promise<PatientAppointment[]> {
  try {
    console.log('🔍 Fetching appointments for user:', userId);
    
    // First get patient ID
    const { data: patientData, error: patientError } = await supabase
      .from('patients')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (patientError || !patientData) {
      console.error('❌ Patient lookup error:', patientError);
      throw new Error('Patient record not found');
    }

    console.log('✅ Found patient ID:', patientData.id);

    // Get patient requests with doctor info
    const { data, error } = await supabase
      .from('patient_requests')
      .select(`
        *,
        doctors!inner(
          specialty,
          hospital_name,
          experience_years,
          consultation_fee,
          profiles!inner(full_name, avatar_url, phone)
        )
      `)
      .eq('patient_id', patientData.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Appointments fetch error:', error);
      throw error;
    }

    console.log('✅ Loaded appointments:', data?.length || 0);
    return data || [];
  } catch (error) {
    console.error('❌ Error in fetchPatientAppointments:', error);
    return [];
  }
}

// Get single appointment details
export async function getAppointmentById(appointmentId: string, userId: string): Promise<PatientAppointment | null> {
  try {
    const appointments = await fetchPatientAppointments(userId);
    const appointment = appointments.find(apt => String(apt.id) === String(appointmentId));
    console.log('🔍 Looking for appointment ID:', appointmentId);
    console.log('📊 Available appointments:', appointments.map(a => ({ id: a.id, status: a.status })));
    return appointment || null;
  } catch (error) {
    console.error('❌ Error getting appointment by ID:', error);
    return null;
  }
}
