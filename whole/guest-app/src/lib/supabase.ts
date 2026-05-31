import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://chnzfuszszkoaginjfwzi.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNobmpmdXN6c3prb2FnaW5qZnd6aSIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzEyNDg0MDAwLCJleHAiOjIwMjgwNjAwMDB9.PLACEHOLDER';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
