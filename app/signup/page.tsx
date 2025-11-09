'use client';

import { useState } from 'react';
import { Mail, Lock, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function SignupPage() {
  const [form, setForm] = useState({ email: '', password: '', name: '' });
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

    if (form.password.length < 6) {
      setMessage({ text: '❌ Password must be at least 6 characters', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          name: form.name || null,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        setMessage({ text: `❌ ${errorData.error || 'Signup failed'}`, type: 'error' });
        return;
      }

      setMessage({ text: '✅ Account created successfully!', type: 'success' });
      setForm({ email: '', password: '', name: '' });
      setTimeout(() => (window.location.href = '/login'), 1500);
    } catch {
      setMessage({ text: '❌ Network error. Try again.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-lime-200 via-white to-green-100 flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm animate-fadeIn">
        <h1 className="text-3xl font-bold text-center text-green-700 mb-8">Create Account</h1>

        {message.text && (
          <p className={`text-sm mb-4 ${message.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
            {message.text}
          </p>
        )}

        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="name" className="text-sm font-semibold text-gray-700">
              Name (optional):
            </label>
            <input
              id="name"
              name="name"
              type="text"
              placeholder="Your full name"
              value={form.name}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-green-600 focus:ring-2 focus:ring-green-200"
            />
          </div>

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
                placeholder="Password (minimum 6 characters)"
                value={form.password}
                onChange={handleChange}
                minLength={6}
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-green-600 focus:ring-2 focus:ring-green-200"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-6 bg-green-600 text-white font-semibold py-3 rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Creating...
            </>
          ) : (
            'Create Account'
          )}
        </button>

        <p className="text-center text-gray-600 mt-4 text-sm">
          Already have an account?{' '}
          <Link href="/login" className="text-green-600 font-semibold hover:underline">
            Log in
          </Link>
        </p>
      </form>
    </div>
  );
}
