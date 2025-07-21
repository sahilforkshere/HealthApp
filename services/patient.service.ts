import { supabase } from './supabase';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

// Make sure this function is exported
export async function getPatientIdByUserId(userId: string): Promise<string> {
  console.log('🔍 Looking for patient with user_id:', userId);
  
  const { data, error } = await supabase
    .from('patients')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    console.error('❌ Patient lookup failed:', error);
    throw new Error('Patient record not found');
  }
  
  console.log('✅ Found patient ID:', data.id);
  return String(data.id); // Ensure it's returned as string (UUID)
}


export async function fetchDoctors() {
  const { data, error } = await supabase
    .from('doctors')
    .select(`
      id,
      specialty,
      hospital_name,
      hospital_address,
      experience_years,
      consultation_fee,
      available_status,
      user_id,
      profiles!inner(full_name, avatar_url)
    `)
    .eq('available_status', true);

  if (error) throw error;
  return data || [];
}

export async function uploadMedicalDocument(imageUri: string, patientId: string): Promise<string | null> {
  try {
    if (!imageUri?.startsWith('file://')) {
      console.log('❌ Invalid image URI:', imageUri);
      return null;
    }

    console.log('📤 Starting upload for:', imageUri);

    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: 'base64',
    });

    const fileExt = imageUri.split('.').pop() || 'png';
    const fileName = `${patientId}_${Date.now()}.${fileExt}`;
    const filePath = `medical-docs/${fileName}`;
    const contentType = `image/${fileExt}`;

    console.log('🗂️ Uploading to path:', filePath);

    const { data, error } = await supabase.storage
      .from('medical-documents')
      .upload(filePath, decode(base64), {
        contentType,
        upsert: false
      });

    if (error) {
      console.error('❌ Upload error:', error);
      throw error;
    }

    if (data) {
      console.log('✅ Document uploaded successfully:', data.path);
      return data.path;
    }

    return null;
  } catch (error) {
    console.error('❌ Error uploading medical document:', error);
    throw error;
  }
}

export async function submitConsultationRequest({
  user_id, 
  doctor_id, 
  problem_description, 
  medical_documents = []
}: {
  user_id: string;
  doctor_id: string;
  problem_description: string;
  medical_documents?: string[];
}) {
  try {
    // First get the patient_id from the patients table
    const patient_id = await getPatientIdByUserId(user_id);
    
    const { data, error } = await supabase
      .from('patient_requests')
      .insert([{
        patient_id,
        doctor_id,
        problem_description,
        medical_documents: medical_documents.length > 0 ? medical_documents : [],
        status: 'pending'
      }])
      .select();
    
    if (error) {
      console.error('Insert error:', error);
      throw error;
    }
    
    console.log('Request submitted successfully:', data);
    return data;
  } catch (error) {
    console.error('Submission error:', error);
    throw error;
  }
}
