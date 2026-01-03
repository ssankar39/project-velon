'use client';

import { useEffect, useState } from 'react';

interface AuthUser {
  id: string;
  email: string;
  name?: string;
}

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is stored in localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        setLoading(false);
      } catch (e) {
        console.error('Failed to parse stored user:', e);
        window.location.href = '/login';
      }
    } else {
      setUser(null);
      window.location.href = '/login';
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl font-semibold text-gray-300">Loading...</div>
      </div>
    );
  }

  return user ? children : null;
}
