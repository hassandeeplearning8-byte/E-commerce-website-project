'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, UserRole } from '@/lib/supabase/AuthProvider';
import Link from 'next/link';
import { ShieldCheck, Eye, Lock, Mail, ArrowRight, Sparkles, UserCheck } from 'lucide-react';
import { integralCF } from '@/styles/fonts';

export default function LoginPage() {
  const router = useRouter();
  const { user, role, signIn, signUp, loading } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('viewer');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setSubmitting(true);

    try {
      if (mode === 'signin') {
        const res = await signIn(email, password);
        if (res.error) {
          setErrorMsg(res.error);
        } else {
          router.push('/dashboard');
        }
      } else {
        const res = await signUp(email, password, selectedRole);
        if (res.error) {
          setErrorMsg(res.error);
        } else {
          setSuccessMsg('Account created successfully! Redirecting to dashboard...');
          setTimeout(() => router.push('/dashboard'), 1000);
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50/50">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-3xl shadow-xl border border-black/5">
        <div className="text-center">
          <Link
            href="/"
            className={`${integralCF.className} text-3xl font-extrabold tracking-tight text-black inline-block`}
          >
            SHOP.CO
          </Link>
          <h2 className="mt-4 text-2xl font-bold text-gray-900">
            {mode === 'signin' ? 'Sign in to your account' : 'Create your account'}
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Secure Authentication powered by <span className="font-semibold text-emerald-600">Supabase</span>
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex bg-gray-100 p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => { setMode('signin'); setErrorMsg(null); }}
            className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all ${
              mode === 'signin'
                ? 'bg-white text-black shadow-sm'
                : 'text-gray-500 hover:text-black'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setErrorMsg(null); }}
            className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all ${
              mode === 'signup'
                ? 'bg-white text-black shadow-sm'
                : 'text-gray-500 hover:text-black'
            }`}
          >
            Sign Up
          </button>
        </div>

        {errorMsg && (
          <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm rounded-xl">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs sm:text-sm rounded-xl">
            {successMsg}
          </div>
        )}

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <div className="relative rounded-xl border border-gray-300 focus-within:border-black focus-within:ring-1 focus-within:ring-black">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Mail size={18} />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-3 text-sm bg-transparent rounded-xl focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Password
            </label>
            <div className="relative rounded-xl border border-gray-300 focus-within:border-black focus-within:ring-1 focus-within:ring-black">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Lock size={18} />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                minLength={6}
                className="w-full pl-10 pr-4 py-3 text-sm bg-transparent rounded-xl focus:outline-none"
              />
            </div>
          </div>

          {/* Role Selection (on Sign Up) */}
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Select Account Role
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedRole('viewer')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    selectedRole === 'viewer'
                      ? 'border-black bg-black text-white shadow-md'
                      : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-sm">
                    <Eye size={16} />
                    <span>Viewer</span>
                  </div>
                  <p className={`text-[11px] mt-1 leading-tight ${selectedRole === 'viewer' ? 'text-gray-300' : 'text-gray-500'}`}>
                    Can only view dashboard metrics
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRole('admin')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    selectedRole === 'admin'
                      ? 'border-purple-600 bg-purple-600 text-white shadow-md'
                      : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-sm">
                    <ShieldCheck size={16} />
                    <span>Admin</span>
                  </div>
                  <p className={`text-[11px] mt-1 leading-tight ${selectedRole === 'admin' ? 'text-purple-200' : 'text-gray-500'}`}>
                    Can create & assign user roles
                  </p>
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-full font-semibold text-sm text-white bg-black hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-50"
          >
            {submitting ? (
              <span>Processing...</span>
            ) : mode === 'signin' ? (
              <>
                <span>Sign In</span>
                <ArrowRight size={16} />
              </>
            ) : (
              <>
                <span>Create {selectedRole === 'admin' ? 'Admin' : 'Viewer'} Account</span>
                <UserCheck size={16} />
              </>
            )}
          </button>
        </form>

        <div className="pt-2 text-center text-xs text-gray-400">
          Role-Based Access Control • Supabase Auth & JWT
        </div>
      </div>
    </div>
  );
}
