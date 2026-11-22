'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, UserRole } from '@/lib/supabase/AuthProvider';
import Link from 'next/link';
import {
  ShieldCheck,
  Eye,
  LogOut,
  UserPlus,
  Users,
  Package,
  DollarSign,
  TrendingUp,
  RefreshCw,
  Lock,
  CheckCircle,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { integralCF } from '@/styles/fonts';

interface ManagedUser {
  id: string;
  email: string;
  role: UserRole;
  createdAt: string;
  lastSignInAt?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, session, role, loading, signOut, refreshProfile } = useAuth();

  // Admin state
  const [usersList, setUsersList] = useState<ManagedUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userActionMsg, setUserActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New user form state
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('viewer');
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Load user list if admin
  const fetchUsers = async () => {
    if (!session?.access_token || role !== 'admin') return;
    setLoadingUsers(true);
    try {
      const res = await fetch('/api/admin/users', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setUsersList(data.users || []);
      } else {
        const err = await res.json();
        console.error('Failed to load users:', err);
      }
    } catch (e) {
      console.error('Error fetching users:', e);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (role === 'admin' && session?.access_token) {
      fetchUsers();
    }
  }, [role, session]);

  const handleRoleChange = async (targetUserId: string, newRoleValue: UserRole) => {
    if (!session?.access_token) return;
    setUserActionMsg(null);

    try {
      const res = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          targetUserId,
          newRole: newRoleValue,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setUserActionMsg({
          type: 'success',
          text: `Role successfully updated to ${newRoleValue}!`,
        });
        // Update local list
        setUsersList((prev) =>
          prev.map((u) => (u.id === targetUserId ? { ...u, role: newRoleValue } : u))
        );
        // If updating self, refresh profile
        if (targetUserId === user?.id) {
          await refreshProfile();
        }
      } else {
        setUserActionMsg({
          type: 'error',
          text: data.error || 'Failed to update user role.',
        });
      }
    } catch (err: any) {
      setUserActionMsg({
        type: 'error',
        text: err?.message || 'Network error updating role.',
      });
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.access_token) return;
    setIsCreatingUser(true);
    setUserActionMsg(null);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          email: newEmail,
          password: newPassword,
          role: newRole,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setUserActionMsg({
          type: 'success',
          text: `Successfully created user ${newEmail} with role: ${newRole}!`,
        });
        setNewEmail('');
        setNewPassword('');
        setShowCreateModal(false);
        fetchUsers();
      } else {
        setUserActionMsg({
          type: 'error',
          text: data.error || 'Failed to create user.',
        });
      }
    } catch (err: any) {
      setUserActionMsg({
        type: 'error',
        text: err?.message || 'Network error creating user.',
      });
    } finally {
      setIsCreatingUser(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500">
          <RefreshCw className="animate-spin" size={20} />
          <span>Loading dashboard session...</span>
        </div>
      </div>
    );
  }

  const isAdmin = role === 'admin';

  return (
    <div className="min-h-screen bg-gray-50/70 pb-20">
      {/* Top Banner / Dashboard Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className={`${integralCF.className} text-2xl sm:text-3xl font-extrabold text-black`}>
                  DASHBOARD
                </h1>
                {isAdmin ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
                    <ShieldCheck size={14} className="text-purple-600" />
                    ADMIN (Full Control)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                    <Eye size={14} className="text-blue-600" />
                    VIEWER (Read-Only)
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Logged in as <span className="font-semibold text-gray-900">{user.email}</span>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
              >
                Go to Storefront
              </Link>
              <button
                onClick={async () => {
                  await signOut();
                  router.push('/login');
                }}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-black hover:bg-gray-800 rounded-full transition-colors"
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        {/* Role Notice Banner */}
        {!isAdmin ? (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
            <Eye size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-blue-900">Viewer Mode Active</h4>
              <p className="text-xs text-blue-700 mt-0.5">
                You have <strong>Viewer permissions</strong>. You can monitor the live metrics, inventory status, and store performance below. Administrative actions (creating and assigning user roles) are restricted to <strong>Admins</strong>.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 flex items-start gap-3">
            <ShieldCheck size={20} className="text-purple-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-purple-900">Administrator Privileges Active</h4>
              <p className="text-xs text-purple-700 mt-0.5">
                You have <strong>Admin permissions</strong>. You have full access to view the dashboard as well as create, modify, and assign user roles in the Role Management section below.
              </p>
            </div>
          </div>
        )}

        {/* Global Overview Cards (Visible to both Roles) */}
        <div>
          <h2 className="text-base font-bold text-gray-900 mb-4 tracking-wide uppercase text-xs text-gray-400">
            Store Performance & Live Cloud Metrics
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white p-5 rounded-3xl border border-black/5 shadow-sm">
              <div className="flex items-center justify-between text-gray-400">
                <span className="text-xs font-semibold uppercase tracking-wider">Total Sales</span>
                <DollarSign size={20} className="text-emerald-500" />
              </div>
              <div className="mt-3 text-2xl font-black text-gray-900">$18,429.50</div>
              <div className="mt-1 text-xs text-emerald-600 font-medium flex items-center gap-1">
                <TrendingUp size={12} />
                <span>+12.4% from last week</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-black/5 shadow-sm">
              <div className="flex items-center justify-between text-gray-400">
                <span className="text-xs font-semibold uppercase tracking-wider">Cloud Inventory</span>
                <Package size={20} className="text-blue-500" />
              </div>
              <div className="mt-3 text-2xl font-black text-gray-900">5 Products</div>
              <div className="mt-1 text-xs text-gray-500 font-medium">
                Live Google Sheets sync active
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-black/5 shadow-sm">
              <div className="flex items-center justify-between text-gray-400">
                <span className="text-xs font-semibold uppercase tracking-wider">AI Assistant</span>
                <Sparkles size={20} className="text-yellow-500" />
              </div>
              <div className="mt-3 text-2xl font-black text-gray-900">Gemini Flash</div>
              <div className="mt-1 text-xs text-emerald-600 font-medium">
                Free-tier operational
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-black/5 shadow-sm">
              <div className="flex items-center justify-between text-gray-400">
                <span className="text-xs font-semibold uppercase tracking-wider">Auth Engine</span>
                <Users size={20} className="text-purple-500" />
              </div>
              <div className="mt-3 text-2xl font-black text-gray-900">Supabase</div>
              <div className="mt-1 text-xs text-purple-600 font-medium">
                RBAC (Admin / Viewer)
              </div>
            </div>
          </div>
        </div>

        {/* Live Inventory Status (Visible to both Roles) */}
        <div className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-900 text-lg">Product Catalog & Inventory</h3>
              <p className="text-xs text-gray-500">Live data synced from Google Sheet ID: 1U9S_q3f8nrt_r7Ik6--jtFC1125itIk-g0-tsmpMTus</p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Auto-Synced
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-400 border-b border-gray-100">
                <tr>
                  <th className="py-3 px-6">Product</th>
                  <th className="py-3 px-6">Category</th>
                  <th className="py-3 px-6">Price</th>
                  <th className="py-3 px-6">Stock Status</th>
                  <th className="py-3 px-6">AI Knowledge Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="py-4 px-6 font-semibold text-gray-900">Wireless Noise-Canceling Headphones</td>
                  <td className="py-4 px-6">Electronics</td>
                  <td className="py-4 px-6 font-semibold text-gray-900">$199.99</td>
                  <td className="py-4 px-6">
                    <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                      In Stock
                    </span>
                  </td>
                  <td className="py-4 px-6 text-xs text-emerald-600">Active in Gemini prompt</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-semibold text-gray-900">Ergonomic Office Chair</td>
                  <td className="py-4 px-6">Furniture</td>
                  <td className="py-4 px-6 font-semibold text-gray-900">$249.50</td>
                  <td className="py-4 px-6">
                    <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                      Out of Stock
                    </span>
                  </td>
                  <td className="py-4 px-6 text-xs text-red-600">Flagged as unavailable by AI</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-semibold text-gray-900">Stainless Steel Water Bottle</td>
                  <td className="py-4 px-6">Home & Kitchen</td>
                  <td className="py-4 px-6 font-semibold text-gray-900">$24.99</td>
                  <td className="py-4 px-6">
                    <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                      In Stock
                    </span>
                  </td>
                  <td className="py-4 px-6 text-xs text-emerald-600">Active in Gemini prompt</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-semibold text-gray-900">Mechanical Gaming Keyboard</td>
                  <td className="py-4 px-6">Electronics</td>
                  <td className="py-4 px-6 font-semibold text-gray-900">$89.99</td>
                  <td className="py-4 px-6">
                    <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                      In Stock
                    </span>
                  </td>
                  <td className="py-4 px-6 text-xs text-emerald-600">Active in Gemini prompt</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-semibold text-gray-900">Organic Cotton T-Shirt</td>
                  <td className="py-4 px-6">Apparel</td>
                  <td className="py-4 px-6 font-semibold text-gray-900">$19.99</td>
                  <td className="py-4 px-6">
                    <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                      In Stock
                    </span>
                  </td>
                  <td className="py-4 px-6 text-xs text-emerald-600">Active in Gemini prompt</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ROLE MANAGEMENT SECTION */}
        {isAdmin ? (
          /* ADMIN ONLY SECTION: User & Role Management */
          <div className="bg-white rounded-3xl border border-purple-200 shadow-md p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="text-purple-600" size={24} />
                  <h3 className="text-xl font-bold text-gray-900">Role Administration Center</h3>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  As an <strong>Admin</strong>, you can assign, toggle, and create user accounts with specific roles.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={fetchUsers}
                  disabled={loadingUsers}
                  className="p-2.5 text-gray-600 hover:text-black rounded-full hover:bg-gray-100 border border-gray-200 transition-colors"
                  title="Refresh Users"
                >
                  <RefreshCw size={16} className={loadingUsers ? 'animate-spin' : ''} />
                </button>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-full transition-colors shadow-sm"
                >
                  <UserPlus size={16} />
                  <span>Create User with Role</span>
                </button>
              </div>
            </div>

            {userActionMsg && (
              <div
                className={`p-4 rounded-2xl text-xs sm:text-sm flex items-center gap-2 ${
                  userActionMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {userActionMsg.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                <span>{userActionMsg.text}</span>
              </div>
            )}

            {/* Create User Modal / Box */}
            {showCreateModal && (
              <div className="bg-purple-50/60 border border-purple-200 p-5 rounded-2xl space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-purple-950 flex items-center gap-2">
                    <UserPlus size={16} />
                    <span>Create New User & Assign Role</span>
                  </h4>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="text-xs font-semibold text-gray-500 hover:text-black"
                  >
                    Cancel
                  </button>
                </div>

                <form onSubmit={handleCreateUser} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 uppercase mb-1">
                      User Email
                    </label>
                    <input
                      type="email"
                      required
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="user@example.com"
                      className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-purple-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 uppercase mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-purple-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 uppercase mb-1">
                      Assign Role
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value as UserRole)}
                        className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-purple-600"
                      >
                        <option value="viewer">Viewer (Dashboard only)</option>
                        <option value="admin">Admin (Full Control)</option>
                      </select>
                      <button
                        type="submit"
                        disabled={isCreatingUser}
                        className="px-5 py-2 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl disabled:opacity-50 whitespace-nowrap shadow-sm"
                      >
                        {isCreatingUser ? 'Creating...' : 'Create'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {/* User List Table */}
            <div className="overflow-x-auto rounded-2xl border border-gray-100">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-400 border-b border-gray-100">
                  <tr>
                    <th className="py-3 px-5">User Email</th>
                    <th className="py-3 px-5">Current Role</th>
                    <th className="py-3 px-5">Registered Date</th>
                    <th className="py-3 px-5 text-right">Change Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {usersList.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-gray-400">
                        {loadingUsers ? 'Loading registered users...' : 'No other users found.'}
                      </td>
                    </tr>
                  ) : (
                    usersList.map((u) => {
                      const isSelf = u.id === user.id;
                      return (
                        <tr key={u.id} className="hover:bg-gray-50/50">
                          <td className="py-4 px-5">
                            <div className="font-semibold text-gray-900 flex items-center gap-1.5">
                              <span>{u.email}</span>
                              {isSelf && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-200 text-gray-700">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-gray-400 font-mono">{u.id}</div>
                          </td>

                          <td className="py-4 px-5">
                            {u.role === 'admin' ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
                                <ShieldCheck size={12} />
                                Admin
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                                <Eye size={12} />
                                Viewer
                              </span>
                            )}
                          </td>

                          <td className="py-4 px-5 text-xs text-gray-500">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>

                          <td className="py-4 px-5 text-right">
                            {u.role === 'admin' ? (
                              <button
                                onClick={() => handleRoleChange(u.id, 'viewer')}
                                className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
                              >
                                Demote to Viewer
                              </button>
                            ) : (
                              <button
                                onClick={() => handleRoleChange(u.id, 'admin')}
                                className="px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors"
                              >
                                Promote to Admin
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* VIEWER LOCKED VIEW */
          <div className="bg-gray-100/60 rounded-3xl border border-gray-200 p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center mx-auto">
              <Lock size={22} />
            </div>
            <h3 className="font-bold text-gray-900 text-lg">Role Administration Restricted</h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              Your account currently has the <strong>Viewer</strong> role. You can inspect all store analytics, metrics, and Google Sheets inventory above. Only <strong>Admins</strong> can create or reassign user roles.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
