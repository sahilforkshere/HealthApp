import { supabase } from './supabase';

export interface PatientProfile {
  id: string;
  user_id: string;
  blood_group?: string;
  gender?: string;
  date_of_birth?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relation?: string;
  medical_history?: string;
  allergies?: string;
  current_medications?: string;
  height?: number;
  weight?: number;
  insurance_provider?: string;
  insurance_policy_number?: string;
  created_at: string;
  updated_at: string;
}

export async function getPatientProfile(userId: string): Promise<PatientProfile | null> {
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching patient profile:', error);
    throw error;
  }

  return data;
}

export async function updatePatientProfile(userId: string, profileData: Partial<PatientProfile>): Promise<void> {
  const { error } = await supabase
    .from('patients')
    .update({
      ...profileData,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId);

  if (error) {
    console.error('Error updating patient profile:', error);
    throw error;
  }
}

export async function getPatientProfileByPatientId(patientId: string): Promise<PatientProfile | null> {
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .eq('id', patientId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching patient profile:', error);
    throw error;
  }

  return data;
}
