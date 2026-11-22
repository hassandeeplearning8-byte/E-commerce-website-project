import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, verifyUserFromToken, extractRole, UserRole } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
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
        { error: 'Forbidden: Only administrators can view and manage user roles.' },
        { status: 403 }
      );
    }

    // Admin verified - list all users
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 100,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const formattedUsers = users.map((u) => ({
      id: u.id,
      email: u.email || 'No email',
      role: extractRole(u),
      createdAt: u.created_at,
      lastSignInAt: u.last_sign_in_at,
    }));

    return NextResponse.json({ users: formattedUsers });
  } catch (err: any) {
    console.error('[Admin Users API] Error:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing token' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const caller = await verifyUserFromToken(token);

    if (!caller || caller.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Only administrators can create users with specific roles.' },
        { status: 403 }
      );
    }

    const { email, password, role } = (await req.json()) as {
      email: string;
      password: string;
      role: UserRole;
    };

    if (!email || !password || !role) {
      return NextResponse.json({ error: 'Missing email, password, or role' }, { status: 400 });
    }

    if (role !== 'admin' && role !== 'viewer') {
      return NextResponse.json({ error: 'Invalid role specified' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: { role },
      user_metadata: { role },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        role,
        createdAt: data.user.created_at,
      },
    });
  } catch (err: any) {
    console.error('[Admin Create User API] Error:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
