import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, UserRole } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const { userId, role } = (await req.json()) as { userId: string; role: UserRole };

    if (!userId || !role) {
      return NextResponse.json({ error: 'Missing userId or role' }, { status: 400 });
    }

    if (role !== 'admin' && role !== 'viewer') {
      return NextResponse.json({ error: 'Invalid role specified' }, { status: 400 });
    }

    // Update the user's app_metadata securely using service_role
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      app_metadata: { role },
      user_metadata: { role },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, user: data.user });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
