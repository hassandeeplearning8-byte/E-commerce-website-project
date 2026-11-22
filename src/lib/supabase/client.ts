import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://akvqrcjwxdijbtlodewh.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrdnFyY2p3eGRpamJ0bG9kZXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUzNTYwNTYsImV4cCI6MjExMDkzMjA1Nn0.tNGAAMMZNbQe696xaoCJGcxESVeWPDk48R0DCc5vFMw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
