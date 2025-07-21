import { supabase } from './supabase';

export interface DriverProfile {
  id: string;
  user_id: string;
  license_number: string;
  vehicle_registration: string;
  vehicle_type: string;
  available_status: boolean;
  current_location?: string;
  created_at?: string;
  updated_at?: string;
}
export async function getCompleteDriverProfile(userId: string): Promise<any> {
  try {
    const { data, error } = await supabase
      .from('ambulance_drivers')
      .select(`
        *,
        profiles!inner(
          id,
          full_name,
          email,
          phone,
          avatar_url,
          user_type
        )
      `)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('❌ Error fetching complete driver profile:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('❌ Error in getCompleteDriverProfile:', error);
    return null;
  }
}

// Get driver profile with only existing columns
export async function getDriverProfile(userId: string): Promise<DriverProfile | null> {
  try {
    console.log('🔍 Fetching driver profile for user:', userId);
    
    const { data, error } = await supabase
      .from('ambulance_drivers')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('❌ Error fetching driver profile:', error);
      throw error;
    }

    console.log('✅ Driver profile loaded:', data);
    return data;
  } catch (error) {
    console.error('❌ Error fetching driver profile:', error);
    return null;
  }
}

// Update driver profile with only safe fields
export async function updateDriverProfile(userId: string, driverData: Partial<DriverProfile>, profileData?: {
  full_name?: string;
  phone?: string;
  avatar_url?: string;
}): Promise<void> {
  try {
    console.log('🔄 Updating driver profile for user:', userId);
    
    // Update ambulance_drivers table
    if (Object.keys(driverData).length > 0) {
      const cleanDriverData = Object.fromEntries(
        Object.entries(driverData).filter(([_, value]) => value !== undefined)
      );
      
      const { error: driverError } = await supabase
        .from('ambulance_drivers')
        .update({
          ...cleanDriverData,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (driverError) {
        console.error('❌ Error updating driver data:', driverError);
        throw driverError;
      }
    }

    // Update profiles table if profile data provided
    if (profileData && Object.keys(profileData).length > 0) {
      const cleanProfileData = Object.fromEntries(
        Object.entries(profileData).filter(([_, value]) => value !== undefined)
      );

      const { error: profileError } = await supabase
        .from('profiles')
        .update(cleanProfileData)
        .eq('id', userId);

      if (profileError) {
        console.error('❌ Error updating profile data:', profileError);
        throw profileError;
      }

      console.log('✅ Profile data updated successfully');
    }

    console.log('✅ Driver profile updated successfully');
  } catch (error) {
    console.error('❌ Driver profile update failed:', error);
    throw error;
  }
}


// Create initial driver profile
export async function createDriverProfile(userId: string, initialData: Partial<DriverProfile>): Promise<DriverProfile> {
  try {
    const { data, error } = await supabase
      .from('ambulance_drivers')
      .insert([{
        user_id: userId,
        license_number: initialData.license_number || '',
        vehicle_registration: initialData.vehicle_registration || '',
        vehicle_type: initialData.vehicle_type || '',
        available_status: false,
        current_location: initialData.current_location || ''
      }])
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating driver profile:', error);
      throw error;
    }

    console.log('✅ Driver profile created successfully');
    return data;
  } catch (error) {
    console.error('❌ Driver profile creation failed:', error);
    throw error;
  }
}
