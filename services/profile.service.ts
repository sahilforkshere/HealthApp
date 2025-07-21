import { supabase } from './supabase';

export interface ProfileData {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  user_type: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  date_of_birth?: string;
  address?: string;
  updated_at?: string;
}

// Get user profile
export async function getUserProfile(userId: string): Promise<ProfileData | null> {
  try {
    console.log('🔍 Fetching profile for user:', userId);
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('❌ Error fetching profile:', error);
      throw error;
    }

    console.log('✅ Profile fetched:', data);
    return data;
  } catch (error) {
    console.error('❌ Error in getUserProfile:', error);
    return null;
  }
}

// Update user profile
export async function updateUserProfile(userId: string, profileData: Partial<ProfileData>): Promise<void> {
  try {
    console.log('🔄 Updating profile for user:', userId);
    console.log('📦 Profile data:', profileData);
    
    // Remove undefined values and add timestamp
    const cleanData = Object.fromEntries(
      Object.entries(profileData).filter(([_, value]) => value !== undefined && value !== '')
    );
    
    cleanData.updated_at = new Date().toISOString();

    console.log('📝 Clean data for update:', cleanData);

    const { data, error } = await supabase
      .from('profiles')
      .update(cleanData)
      .eq('id', userId)
      .select();

    if (error) {
      console.error('❌ Error updating profile:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      throw new Error('No profile record found to update');
    }

    console.log('✅ Profile updated successfully:', data[0]);
  } catch (error) {
    console.error('❌ Profile update failed:', error);
    throw error;
  }
}

// Create or update profile
export async function upsertProfile(userId: string, profileData: Partial<ProfileData>): Promise<ProfileData> {
  try {
    const cleanData = {
      id: userId,
      ...Object.fromEntries(
        Object.entries(profileData).filter(([_, value]) => value !== undefined && value !== '')
      ),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('profiles')
      .upsert(cleanData)
      .select()
      .single();

    if (error) {
      console.error('❌ Error upserting profile:', error);
      throw error;
    }

    console.log('✅ Profile upserted successfully:', data);
    return data;
  } catch (error) {
    console.error('❌ Profile upsert failed:', error);
    throw error;
  }
}
