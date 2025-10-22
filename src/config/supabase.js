import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = 'https://qsluketrgwgmzijkfqtc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFzbHVrZXRyZ3dnbXppamtmcXRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwOTQ5NDksImV4cCI6MjA3NjY3MDk0OX0.ebFtCDukIyy_xhdjFldq979MQiDhynFywEb1sQteJvE';

// Create Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false, // Disable auth for demo
    autoRefreshToken: false,
  },
});

export default supabase;
