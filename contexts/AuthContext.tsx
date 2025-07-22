import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

interface Profile {
  id: string;
  user_type: 'patient' | 'doctor' | 'driver';
  full_name: string;
  phone?: string;
  avatar_url?: string;
  email?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  date_of_birth?: string;
  address?: string;
  updated_at?: string;
}

interface AuthContextType {
  user: any | null;
  userProfile: Profile | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, userType: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>; // Added this
  loading: boolean;
  error: string | null;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any | null>(null);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('🔐 Initial session check:', !!session?.user);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state changed:', event, !!session?.user);
      
      setUser(session?.user ?? null);
      
      if (session?.user && event === 'SIGNED_IN') {
        await fetchUserProfile(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setUserProfile(null);
        setError(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    console.log('👤 Fetching profile for user:', userId);
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          user_type,
          full_name,
          phone,
          avatar_url,
          email,
          emergency_contact_name,
          emergency_contact_phone,
          emergency_contact_relationship,
          date_of_birth,
          address,
          updated_at
        `)
        .eq('id', userId)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') {
        console.error('❌ Profile fetch error:', error);
        throw error;
      }
      
      if (data) {
        console.log('✅ Profile loaded:', {
          user_type: data.user_type,
          full_name: data.full_name,
          has_emergency_contact: !!data.emergency_contact_name
        });
        setUserProfile(data);
      } else {
        console.log('⚠️ No profile found - creating default profile');
        await createDefaultProfile(userId);
      }
    } catch (err: any) {
      console.error('❌ Profile fetch exception:', err);
      setError(err.message || 'Failed to load profile');
      setUserProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const createDefaultProfile = async (userId: string) => {
    try {
      console.log('🔧 Creating default profile for user:', userId);
      
      const { data: authUser } = await supabase.auth.getUser();
      const userEmail = authUser.user?.email || '';
      const userData = authUser.user?.user_metadata || {};
      
      const defaultProfile = {
        id: userId,
        user_type: (userData.user_type as 'patient' | 'doctor' | 'driver') || 'patient',
        full_name: userData.full_name || userEmail.split('@')[0] || 'User',
        email: userEmail,
        phone: null,
        avatar_url: null,
        emergency_contact_name: null,
        emergency_contact_phone: null,
        emergency_contact_relationship: null,
        date_of_birth: null,
        address: null,
        updated_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('profiles')
        .insert([defaultProfile])
        .select()
        .single();
      
      if (error) {
        console.error('❌ Error creating default profile:', error);
        throw error;
      }
      
      console.log('✅ Default profile created:', data);
      setUserProfile(data);
      
      await createRoleSpecificRecord(userId, defaultProfile.user_type);
      
    } catch (error: any) {
      console.error('❌ Error creating default profile:', error);
      setError(error.message || 'Failed to create profile');
    }
  };

  const createRoleSpecificRecord = async (userId: string, userType: string) => {
    try {
      console.log(`🔧 Creating ${userType} record for user:`, userId);
      
      if (userType === 'patient') {
        const { error } = await supabase.from('patients').insert([{
          user_id: userId,
        }]);
        if (error && error.code !== '23505') {
          console.error('❌ Error creating patient record:', error);
        } else {
          console.log('✅ Patient record created');
        }
      }
      
      if (userType === 'doctor') {
        const { error } = await supabase.from('doctors').insert([{
          user_id: userId,
          specialty: '',
          license_number: '',
          hospital_name: '',
          hospital_address: '',
          available_status: false,
        }]);
        if (error && error.code !== '23505') {
          console.error('❌ Error creating doctor record:', error);
        } else {
          console.log('✅ Doctor record created');
        }
      }

      if (userType === 'driver') {
        const { error } = await supabase.from('ambulance_drivers').insert([{
          user_id: userId,
          license_number: '',
          vehicle_registration: '',
          vehicle_type: '',
          available_status: false,
        }]);
        if (error && error.code !== '23505') {
          console.error('❌ Error creating driver record:', error);
        } else {
          console.log('✅ Driver record created');
        }
      }
    } catch (error: any) {
      console.error(`❌ Error creating ${userType} record:`, error);
    }
  };

  const signUp = async (email: string, password: string, userType: string, fullName: string) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📝 Starting sign up process...');
      
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            full_name: fullName,
            user_type: userType,
          }
        }
      });
      
      if (error) {
        console.error('❌ Auth sign up error:', error);
        throw error;
      }
      
      if (data.user && !data.session) {
        console.log('📧 Email confirmation required');
        setError('Please check your email and click the confirmation link to complete registration.');
        return;
      }
      
      if (data.user && data.session) {
        console.log('✅ User created with session, creating profile...');
        
        const profileData = {
          id: data.user.id,
          user_type: userType as 'patient' | 'doctor' | 'driver',
          full_name: fullName,
          email: email,
          phone: null,
          avatar_url: null,
          emergency_contact_name: null,
          emergency_contact_phone: null,
          emergency_contact_relationship: null,
          date_of_birth: null,
          address: null,
          updated_at: new Date().toISOString()
        };
        
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([profileData]);
        
        if (profileError) {
          console.error('❌ Profile creation error:', profileError);
          throw profileError;
        }
        
        console.log('✅ Profile created successfully');
        setUserProfile(profileData);
        
        await createRoleSpecificRecord(data.user.id, userType);
      }
    } catch (err: any) {
      console.error('❌ Registration failed:', err);
      setError(err.message || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    console.log('🔐 Attempting sign in for:', email);
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      
      if (error) {
        console.error('❌ Sign in error:', error);
        throw error;
      }
      
      if (data.user) {
        console.log('✅ Sign in successful');
      }
    } catch (error: any) {
      console.error('❌ Sign in exception:', error);
      setError(error.message || 'Sign in failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🚪 Signing out...');
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ Sign out error:', error);
        throw error;
      }
      
      console.log('✅ Sign out successful');
      setUser(null);
      setUserProfile(null);
    } catch (error: any) {
      console.error('❌ Sign out exception:', error);
      setError(error.message || 'Sign out failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteAccount = async () => {
    if (!user || !userProfile) {
      throw new Error('No user logged in');
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('🗑️ Starting complete account deletion for:', user.id);

      // Call the database function to delete user completely
      const { data, error } = await supabase.rpc('delete_user_completely', {
        user_uuid: user.id
      });

      if (error) {
        console.error('❌ Error deleting user account:', error);
        throw error;
      }

      console.log('✅ Account deleted successfully:', data);

      // Clear local state immediately
      setUser(null);
      setUserProfile(null);
      setError(null);

      return data;
    } catch (error: any) {
      console.error('❌ Account deletion failed:', error);
      setError(error.message || 'Failed to delete account');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) {
      throw new Error('No user logged in');
    }
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Updating profile with:', updates);
      
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id)
        .select()
        .single();
      
      if (error) {
        console.error('❌ Profile update error:', error);
        throw error;
      }
      
      console.log('✅ Profile updated successfully');
      setUserProfile(data);
      
    } catch (error: any) {
      console.error('❌ Profile update exception:', error);
      setError(error.message || 'Profile update failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchUserProfile(user.id);
    }
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      userProfile,
      signIn,
      signUp,
      signOut,
      deleteAccount, // Added this
      loading,
      error,
      updateProfile,
      refreshProfile,
      clearError
    }}>
      {children}
    </AuthContext.Provider>
  );
};
