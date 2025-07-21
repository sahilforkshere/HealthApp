import { supabase } from './supabase';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

export interface VehicleDetails {
  id: number;
  user_id: string;
  license_number: string;
  vehicle_registration: string;
  vehicle_type: string;
  vehicle_model?: string;
  vehicle_year?: number;
  vehicle_color?: string;
  insurance_number?: string;
  insurance_expiry?: string;
  license_expiry?: string;
  vehicle_photos?: string[];
  available_status: boolean;
  current_location?: string;
  created_at: string;
  updated_at: string;
}

// Get driver's vehicle details
export async function getDriverVehicleDetails(userId: string): Promise<VehicleDetails | null> {
  const { data, error } = await supabase
    .from('ambulance_drivers')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching vehicle details:', error);
    throw error;
  }

  return data;
}

// Update vehicle details
export async function updateVehicleDetails(userId: string, vehicleData: Partial<VehicleDetails>): Promise<void> {
  const { error } = await supabase
    .from('ambulance_drivers')
    .update({
      ...vehicleData,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId);

  if (error) {
    console.error('Error updating vehicle details:', error);
    throw error;
  }
}

// Upload vehicle photo
export async function uploadVehiclePhoto(imageUri: string, driverId: string): Promise<string> {
  try {
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: 'base64',
    });

    const fileExt = imageUri.split('.').pop() || 'jpg';
    const fileName = `vehicle_${driverId}_${Date.now()}.${fileExt}`;
    const filePath = `vehicle-photos/${fileName}`;

    const { data, error } = await supabase.storage
      .from('vehicle-documents')
      .upload(filePath, decode(base64), {
        contentType: `image/${fileExt}`,
        upsert: false
      });

    if (error) throw error;
    return data.path;
  } catch (error) {
    console.error('Error uploading vehicle photo:', error);
    throw error;
  }
}

// Delete vehicle photo
export async function deleteVehiclePhoto(photoPath: string): Promise<void> {
  const { error } = await supabase.storage
    .from('vehicle-documents')
    .remove([photoPath]);

  if (error) {
    console.error('Error deleting vehicle photo:', error);
    throw error;
  }
}
