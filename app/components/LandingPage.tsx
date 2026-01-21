'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem('user');
    setIsLoggedIn(!!user);
  }, []);

  const handleLoginClick = (e: React.MouseEvent) => {
    if (isLoggedIn) {
      e.preventDefault();
      router.push('/');
    }
  };

  const handleSignupClick = (e: React.MouseEvent) => {
    if (isLoggedIn) {
      e.preventDefault();
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-purple-500 to-violet-600 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2L3 14h8l-2 8 10-12h-8l2-8z" />
              </svg>
            </div>
            <span className="text-xl md:text-2xl font-bold bg-linear-to-r from-purple-400 to-violet-400 bg-clip-text text-transparent">
              Velon
            </span>
          </div>
          
          <div className="flex gap-2 md:gap-4">
            <Link 
              href="/login"
              onClick={handleLoginClick}
              className="px-3 md:px-6 py-2.5 rounded-xl text-white/90 hover:text-white transition-colors font-medium text-sm md:text-base"
            >
              Log In
            </Link>
            <Link 
              href="/signup"
              onClick={handleSignupClick}
              className="px-3 md:px-6 py-2.5 rounded-xl bg-linear-to-r from-purple-500 to-violet-600 text-white font-medium hover:shadow-lg hover:shadow-purple-500/50 transition-all text-sm md:text-base"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 md:pt-32 pb-12 md:pb-20 px-4 md:px-6">
        <div className="max-w-7xl mx-auto text-center">
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 md:mb-6 leading-tight">
            <span className="bg-linear-to-r from-purple-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
              Transform Your Body,
            </span>
            <br />
            <span className="text-white">
              Track Your Progress
            </span>
          </h1>
          
          <p className="text-base md:text-xl text-white/70 mb-8 md:mb-12 max-w-2xl mx-auto leading-relaxed px-4">
            The all-in-one fitness platform that helps you track calories, monitor fasting, 
            log workouts, and achieve your health goals with precision and ease.
          </p>

          {/* Hero Image/Stats Preview */}
          <div className="mt-12 md:mt-20 relative">
            <div className="glass rounded-2xl md:rounded-3xl border border-white/10 p-4 md:p-8 max-w-4xl mx-auto backdrop-blur-xl">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                <div className="text-center p-6 rounded-2xl bg-linear-to-br from-purple-500/10 to-transparent border border-purple-500/20">
                  <div className="text-4xl font-bold text-purple-400 mb-2">1K+</div>
                  <div className="text-white/60">Active Users</div>
                </div>
                <div className="text-center p-6 rounded-2xl bg-linear-to-br from-violet-500/10 to-transparent border border-violet-500/20">
                  <div className="text-4xl font-bold text-violet-400 mb-2">20K+</div>
                  <div className="text-white/60">Workouts Logged</div>
                </div>
                <div className="text-center p-6 rounded-2xl bg-linear-to-br from-purple-500/10 to-transparent border border-purple-500/20">
                  <div className="text-4xl font-bold text-purple-400 mb-2">4.9★</div>
                  <div className="text-white/60">User Rating</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 md:py-20 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
              Everything You Need in One Place
            </h2>
            <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto px-4">
              Powerful tools designed to help you reach your fitness goals faster
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="glass rounded-2xl p-8 border border-white/10 hover:border-purple-500/50 transition-all group">
              <div className="w-14 h-14 rounded-xl bg-linear-to-br from-purple-500 to-violet-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Calorie Tracking</h3>
              <p className="text-white/70 leading-relaxed">
                Log your meals effortlessly and track your daily calorie intake with our comprehensive food database and smart recommendations.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="glass rounded-2xl p-8 border border-white/10 hover:border-purple-500/50 transition-all group">
              <div className="w-14 h-14 rounded-xl bg-linear-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Fasting Timer</h3>
              <p className="text-white/70 leading-relaxed">
                Monitor your intermittent fasting windows with precision. Set custom fasting goals and track your progress in real-time.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="glass rounded-2xl p-8 border border-white/10 hover:border-purple-500/50 transition-all group">
              <div className="w-14 h-14 rounded-xl bg-linear-to-br from-purple-500 to-violet-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Workout Logger</h3>
              <p className="text-white/70 leading-relaxed">
                Create custom workout plans, log exercises, and track your strength gains with detailed analytics and progress charts.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="glass rounded-2xl p-8 border border-white/10 hover:border-purple-500/50 transition-all group">
              <div className="w-14 h-14 rounded-xl bg-linear-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Health Calculators</h3>
              <p className="text-white/70 leading-relaxed">
                Calculate your BMI, BMR, TDEE, and body fat percentage. Get personalized recommendations based on your metrics.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="glass rounded-2xl p-8 border border-white/10 hover:border-purple-500/50 transition-all group">
              <div className="w-14 h-14 rounded-xl bg-linear-to-br from-purple-500 to-violet-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Progress Analytics</h3>
              <p className="text-white/70 leading-relaxed">
                Visualize your fitness journey with beautiful charts and graphs. Track trends and celebrate milestones.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="glass rounded-2xl p-8 border border-white/10 hover:border-purple-500/50 transition-all group">
              <div className="w-14 h-14 rounded-xl bg-linear-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Custom Goals</h3>
              <p className="text-white/70 leading-relaxed">
                Set personalized fitness goals and get intelligent insights. Adjust your targets as you progress on your journey.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-12 md:py-20 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
              Getting Started is Easy
            </h2>
            <p className="text-lg md:text-xl text-white/70">
              Three simple steps to begin your transformation
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center relative">
              <div className="w-20 h-20 rounded-full bg-linear-to-br from-purple-500 to-violet-600 flex items-center justify-center mx-auto mb-6 text-3xl font-bold text-white">
                1
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Create Your Profile</h3>
              <p className="text-white/70">
                Sign up in seconds and tell us about your fitness goals and preferences
              </p>
            </div>

            <div className="text-center relative">
              <div className="w-20 h-20 rounded-full bg-linear-to-br from-violet-500 to-purple-600 flex items-center justify-center mx-auto mb-6 text-3xl font-bold text-white">
                2
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Log Your Activity</h3>
              <p className="text-white/70">
                Track meals, workouts, and fasting windows with our intuitive interface
              </p>
            </div>

            <div className="text-center relative">
              <div className="w-20 h-20 rounded-full bg-linear-to-br from-purple-500 to-violet-600 flex items-center justify-center mx-auto mb-6 text-3xl font-bold text-white">
                3
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Achieve Your Goals</h3>
              <p className="text-white/70">
                Watch your progress unfold and celebrate every milestone along the way
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 md:px-6 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-linear-to-br from-purple-500 to-violet-600 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <span className="text-xl font-bold text-white">Velon</span>
              </div>
              <p className="text-white/60 text-sm">
                Your complete fitness tracking solution
              </p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-white/60 text-sm">
                <li><a href="#" className="hover:text-purple-400 transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-purple-400 transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-purple-400 transition-colors">FAQ</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-white/60 text-sm">
                <li><a href="#" className="hover:text-purple-400 transition-colors">About</a></li>
                <li><a href="#" className="hover:text-purple-400 transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-purple-400 transition-colors">Careers</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-white/60 text-sm">
                <li><a href="#" className="hover:text-purple-400 transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-purple-400 transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-purple-400 transition-colors">Privacy</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 text-center text-white/60 text-sm">
            <p>© 2026 Velon. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
