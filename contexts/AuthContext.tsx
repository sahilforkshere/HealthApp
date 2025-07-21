import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

interface Profile {
  id: string;
  user_type: 'patient' | 'doctor' | 'driver';
  full_name: string;
  phone?: string;
  avatar_url?: string;
}

interface AuthContextType {
  user: any | null;
  userProfile: Profile | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, userType: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any | null>(null);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session:', !!session?.user); // Debug log
      setUser(session?.user ?? null);
      if (session?.user) fetchUserProfile(session.user.id);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed:', _event, !!session?.user); // Debug log
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
    console.log('Fetching profile for:', userId); // Debug log
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (data && !error) {
        console.log('Profile loaded:', data.user_type); // Debug log
        setUserProfile(data);
      } else {
        console.error('Profile fetch error:', error); // Debug log
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
      console.log('Starting signup for:', email); // Debug log
      
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
        console.log('User created, checking for existing profile...'); // Debug log
        
        // Check if profile already exists before creating
        const { data: existingProfile, error: checkError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', data.user.id)
          .single();

        if (!existingProfile && checkError?.code === 'PGRST116') {
          // Profile doesn't exist, create it
          console.log('Creating new profile...'); // Debug log
          const { error: profileError } = await supabase.from('profiles').insert({
            id: data.user.id,
            user_type: userType,
            full_name: fullName,
          });
          
          if (profileError) {
            console.error('Profile creation error:', profileError);
            throw profileError;
          }
          console.log('Profile created successfully'); // Debug log
        } else if (existingProfile) {
          console.log('Profile already exists for user'); // Debug log
        } else if (checkError) {
          console.error('Error checking existing profile:', checkError);
          throw checkError;
        }
      }
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    console.log('Attempting sign in for:', email); // Debug log
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.error('Sign in error:', error); // Debug log
        throw error;
      }
      console.log('Sign in successful'); // Debug log
    } catch (error) {
      console.error('Sign in exception:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      console.log('Sign out successful'); // Debug log
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, userProfile, signIn, signUp, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
