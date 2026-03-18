'use client';

import { useEffect, useState } from 'react';

interface AuthUser {
  id: string;
  email: string;
  name?: string;
  onboardingComplete?: boolean;
}

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is stored in localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser) as AuthUser;
        setUser(parsedUser);
        
        // If user is not onboarded, redirect to onboarding
        if (!parsedUser.onboardingComplete) {
          window.location.href = '/onboarding';
          return;
        }
        
        setLoading(false);
      } catch (e) {
        console.error('Failed to parse stored user:', e);
        localStorage.removeItem('user');
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
