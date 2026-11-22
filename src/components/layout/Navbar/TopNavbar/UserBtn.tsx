'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/supabase/AuthProvider';
import { ShieldCheck, Eye } from 'lucide-react';

export default function UserBtn() {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="p-1 opacity-50">
        <Image
          priority
          src="/icons/user.svg"
          height={100}
          width={100}
          alt="user"
          className="max-w-[22px] max-h-[22px]"
        />
      </div>
    );
  }

  if (user) {
    const isAdmin = role === 'admin';
    return (
      <Link
        href="/dashboard"
        className="relative p-1 flex items-center gap-1.5 hover:opacity-80 transition-opacity"
        title={`Dashboard (${isAdmin ? 'Admin' : 'Viewer'}) - ${user.email}`}
      >
        <div className="relative">
          <Image
            priority
            src="/icons/user.svg"
            height={100}
            width={100}
            alt="user"
            className="max-w-[22px] max-h-[22px]"
          />
          <span
            className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-white ${
              isAdmin ? 'bg-purple-600' : 'bg-blue-500'
            }`}
          />
        </div>
        <span
          className={`hidden lg:inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
            isAdmin ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
          }`}
        >
          {isAdmin ? <ShieldCheck size={12} /> : <Eye size={12} />}
          <span>{isAdmin ? 'Admin' : 'Viewer'}</span>
        </span>
      </Link>
    );
  }

  return (
    <Link
      href="/login"
      className="p-1 hover:opacity-80 transition-opacity"
      title="Sign In / Register"
    >
      <Image
        priority
        src="/icons/user.svg"
        height={100}
        width={100}
        alt="user"
        className="max-w-[22px] max-h-[22px]"
      />
    </Link>
  );
}
