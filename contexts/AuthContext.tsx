import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

interface Profile {
  id: string;
  user_type: 'patient' | 'doctor' | 'driver';
  full_name: string;
  phone?: string;
  avatar_url?: string;
  email?: string;
}

interface AuthContextType {
  user: any | null;
  userProfile: Profile | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, userType: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
  error: string | null;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any | null>(null);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session:', !!session?.user);
      setUser(session?.user ?? null);
      if (session?.user) fetchUserProfile(session.user.id);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed:', _event, !!session?.user);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    console.log('Fetching profile for:', userId);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (data && !error) {
        console.log('Profile loaded:', data.user_type);
        setUserProfile(data);
      } else {
        console.error('Profile fetch error:', error);
        if (error?.code === 'PGRST116') {
          console.log('No profile found for existing user');
        }
      }
    } catch (err) {
      console.error('Profile fetch exception:', err);
    }
  };

  const signUp = async (email: string, password: string, userType: string, fullName: string) => {
    try {
      setLoading(true);
      setError(null);
      
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
      
      if (error) throw error;
      
      if (data.user) {
        // Create profile
        const { error: profileError } = await supabase.from('profiles').insert({
          id: data.user.id,
          user_type: userType,
          full_name: fullName,
          email: email,
        });
        
        if (profileError) throw profileError;

        // Create role-specific record
        if (userType === 'patient') {
          const { error: patientError } = await supabase.from('patients').insert({
            user_id: data.user.id,
          });
          if (patientError) throw patientError;
        }
        
        if (userType === 'doctor') {
          const { error: doctorError } = await supabase.from('doctors').insert({
            user_id: data.user.id,
            specialty: '',
            license_number: '',
            hospital_name: '',
            hospital_address: '',
            available_status: false,
          });
          if (doctorError) throw doctorError;
        }

        if (userType === 'driver') {
          const { error: driverError } = await supabase.from('ambulance_drivers').insert({
            user_id: data.user.id,
            license_number: '',
            vehicle_registration: '',
            vehicle_type: '',
            available_status: false,
          });
          if (driverError) throw driverError;
        }
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    console.log('Attempting sign in for:', email);
    try {
      setLoading(true);
      setError(null);
      
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.error('Sign in error:', error);
        throw error;
      }
      console.log('Sign in successful');
    } catch (error: any) {
      console.error('Sign in exception:', error);
      setError(error.message || 'Sign in failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setUserProfile(null);
    } catch (error: any) {
      setError(error.message || 'Sign out failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) throw new Error('No user logged in');
    
    try {
      setLoading(true);
      setError(null);
      
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);
      
      if (error) throw error;
      
      // Update local state
      setUserProfile(prev => prev ? { ...prev, ...updates } : null);
    } catch (error: any) {
      setError(error.message || 'Profile update failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      userProfile,
      signIn,
      signUp,
      signOut,
      loading,
      error,
      updateProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};
