// Standardize ID types across your system
export type DatabaseId = number; // Since your DB uses BIGINT

export interface BaseProfile {
  id: string; // Auth user ID (UUID)
  user_type: 'patient' | 'doctor' | 'driver';
  full_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface BaseEntity {
  id: DatabaseId;
  user_id: string;
  created_at: string;
  updated_at: string;
}
