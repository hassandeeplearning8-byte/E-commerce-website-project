import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://akvqrcjwxdijbtlodewh.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrdnFyY2p3eGRpamJ0bG9kZXdoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5NTM1NjA1NiwiZXhwIjoyMTEwOTMyMDU2fQ.0-gcHp987d4tMqvQ0Hack1FwllSmEm4W-We8HL9vYIQ';

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export type UserRole = 'admin' | 'viewer';

export interface AppUser {
  id: string;
  email: string;
  role: UserRole;
  createdAt: string;
  lastSignInAt?: string;
}

/**
 * Extracts the user's role from app_metadata or user_metadata.
 * Defaults to 'viewer'.
 */
export function extractRole(user: any): UserRole {
  if (!user) return 'viewer';
  const role = user.app_metadata?.role || user.user_metadata?.role;
  return role === 'admin' ? 'admin' : 'viewer';
}

/**
 * Verifies an incoming authorization bearer token and returns the user & their role.
 */
export async function verifyUserFromToken(token: string): Promise<{ user: any; role: UserRole } | null> {
  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) {
      return null;
    }
    const role = extractRole(user);
    return { user, role };
  } catch (err) {
    console.error('[Supabase Admin] Error verifying token:', err);
    return null;
  }
}
