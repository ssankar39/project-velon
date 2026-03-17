'use client';

import { useState } from 'react';
import { Mail, Lock, Loader2, Zap } from 'lucide-react';
import Link from 'next/link';

interface AuthUser {
  id: string;
  email: string;
  name?: string;
  onboardingComplete?: boolean;
}

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' }>({ text: '', type: 'error' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ text: '', type: 'error' });

    if (!form.email || !form.password) {
      setMessage({ text: '❌ Please fill in all fields', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        setMessage({ text: `❌ ${errorData.error || 'Login failed'}`, type: 'error' });
        return;
      }

      const data = await res.json();

      // Determine whether onboarding is complete before choosing the post-login route.
      let onboardingComplete = false;
      try {
        const preferencesRes = await fetch(`/api/user/preferences?userId=${encodeURIComponent(data.user.email)}`);
        if (preferencesRes.ok) {
          const preferences = await preferencesRes.json();
          onboardingComplete = Boolean(preferences?.onboardingComplete);
        }
      } catch {
        onboardingComplete = false;
      }

      const userWithOnboarding: AuthUser = {
        ...data.user,
        onboardingComplete,
      };

      // Store user info in localStorage
      localStorage.setItem('user', JSON.stringify(userWithOnboarding));

      setMessage({ text: '✅ Login successful!', type: 'success' });
      setTimeout(() => {
        window.location.href = onboardingComplete ? '/' : '/onboarding';
      }, 1000);
    } catch {
      setMessage({ text: '❌ Network error. Try again.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="glass rounded-2xl shadow-2xl p-8 w-full max-w-sm animate-fadeIn"
      >
        <div className="mb-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-linear-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-lg">
            <Zap className="w-10 h-10 text-white" fill="currentColor" />
          </div>
          <h1 className="text-3xl font-bold text-white">Welcome Back</h1>
          <p className="text-gray-400 mt-2">Login to Velon</p>
        </div>

        {message.text && (
          <div className={`text-sm mb-4 p-3 rounded-lg ${message.type === 'error' ? 'bg-red-500/20 text-red-300 border border-red-500/50' : 'bg-green-500/20 text-green-300 border border-green-500/50'}`}>
            {message.text}
          </div>
        )}

        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-sm font-semibold text-gray-300">
              Email:
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                value={form.email}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-4 py-3 glass-light rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-500/50 border border-white/10"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="text-sm font-semibold text-gray-300">
              Password:
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                value={form.password}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-4 py-3 glass-light rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-500/50 border border-white/10"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-6 bg-linear-to-r from-purple-600 to-purple-700 text-white font-semibold py-3 rounded-lg hover:from-purple-700 hover:to-purple-800 transition flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Logging in...
            </>
          ) : (
            'Login'
          )}
        </button>

        <p className="text-center text-gray-400 mt-4 text-sm">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-purple-400 font-semibold hover:text-purple-300 transition">
            Sign up
          </Link>
        </p>
      </form>
    </div>
  );
}
