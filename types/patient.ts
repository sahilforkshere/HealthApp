import { BaseEntity, BaseProfile, DatabaseId } from './index';

export interface Patient extends BaseEntity {
  blood_group?: string;
  gender?: 'male' | 'female' | 'other';
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
}

export interface PatientRequest extends BaseEntity {
  patient_id: DatabaseId;
  doctor_id: DatabaseId;
  problem_description: string;
  medical_documents: string[];
  status: 'pending' | 'accepted' | 'scheduled' | 'completed' | 'cancelled';
  doctor_reply?: string;
  appointment_time?: string;
  appointment_location?: string;
}
