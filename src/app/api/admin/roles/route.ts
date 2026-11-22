import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, verifyUserFromToken, UserRole } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing token' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const caller = await verifyUserFromToken(token);

    if (!caller) {
      return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 });
    }

    if (caller.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Only administrators can assign or modify user roles.' },
        { status: 403 }
      );
    }

    const { targetUserId, newRole } = (await req.json()) as {
      targetUserId: string;
      newRole: UserRole;
    };

    if (!targetUserId || !newRole) {
      return NextResponse.json({ error: 'Missing targetUserId or newRole' }, { status: 400 });
    }

    if (newRole !== 'admin' && newRole !== 'viewer') {
      return NextResponse.json({ error: 'Invalid role specified' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
      app_metadata: { role: newRole },
      user_metadata: { role: newRole },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `User role updated to ${newRole}`,
      user: {
        id: data.user.id,
        email: data.user.email,
        role: newRole,
      },
    });
  } catch (err: any) {
    console.error('[Admin Update Role API] Error:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
