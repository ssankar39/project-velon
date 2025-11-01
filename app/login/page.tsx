'use client';

import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/app/types/firebase';
import { Mail, Lock, Loader2 } from 'lucide-react';
import Link from 'next/link';

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
      await signInWithEmailAndPassword(auth, form.email, form.password);
      setMessage({ text: '✅ Login successful!', type: 'success' });
      setTimeout(() => (window.location.href = '/'), 1000);
    } catch (error: unknown) {
      const authError = error as { code?: string; message?: string };
      const errorMap: Record<string, string> = {
        'auth/user-not-found': '❌ Email not found',
        'auth/wrong-password': '❌ Wrong password',
        'auth/invalid-email': '❌ Invalid email address',
        'auth/user-disabled': '❌ Account has been disabled',
        'auth/network-request-failed': '❌ Network error. Try again.',
      };
      setMessage({ text: errorMap[authError.code || ''] || `❌ ${authError.message}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-200 via-white to-green-100 flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm animate-fadeIn"
      >
        <h1 className="text-3xl font-bold text-center text-green-700 mb-8">Login</h1>

        {message.text && (
          <p className={`text-sm mb-4 ${message.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
            {message.text}
          </p>
        )}

        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-sm font-semibold text-gray-700">
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
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-green-600 focus:ring-2 focus:ring-green-200"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="text-sm font-semibold text-gray-700">
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
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-green-600 focus:ring-2 focus:ring-green-200"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-6 bg-green-500 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
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

        <p className="text-center mt-6 text-sm text-gray-700">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-green-700 font-semibold hover:underline">
            Sign up
          </Link>
        </p>
      </form>
    </div>
  );
}
