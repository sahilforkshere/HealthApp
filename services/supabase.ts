import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://swgmyigthwxtlnstztsi.supabase.co';  
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3Z215aWd0aHd4dGxuc3R6dHNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwOTQwNTcsImV4cCI6MjA2ODY3MDA1N30.XFwxXtxOY2Lv2DRRoPSz-Tq_IzyfYToVzqaVGxdHbaQ';  

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
