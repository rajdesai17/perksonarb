'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { getTotalUserCount, getRecentUsers, type UserProfile } from '../lib/supabase';
import { Navbar } from '../components/Navbar';

export default function Home() {
  const [userCount, setUserCount] = useState(0);
  const [recentUsers, setRecentUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [count, recent] = await Promise.all([
          getTotalUserCount(),
          getRecentUsers(6)
        ]);
        setUserCount(count);
        setRecentUsers(recent);
      } catch (error) {
        console.error('Error fetching platform stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
      <Navbar />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full mb-8 shadow-lg">
            <span className="text-4xl">☕</span>
          </div>
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            The Multi-User Coffee Tip Platform
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Create your own tip jar and receive crypto donations. Support creators, developers, 
            and anyone doing great work. Built on Arbitrum for fast, low-cost transactions.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/create"
              className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold py-3 px-8 rounded-xl hover:from-amber-600 hover:to-orange-600 transform hover:scale-105 transition-all duration-200"
            >
              Create Your Tip Jar
            </Link>
            <Link
              href="#explore"
              className="bg-white text-gray-700 font-semibold py-3 px-8 rounded-xl hover:bg-gray-100 transition-colors duration-200 border border-gray-300 shadow-sm"
            >
              Explore Creators
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Fast & Secure</h3>
            <p className="text-gray-600">Built on Arbitrum for lightning-fast transactions with minimal fees.</p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Your Own Space</h3>
            <p className="text-gray-600">Get your personalized page with custom username and profile.</p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">100% Transparent</h3>
            <p className="text-gray-600">All transactions are recorded on the blockchain for complete transparency.</p>
          </div>
        </div>

        {/* Platform Stats */}
        <div className="bg-white rounded-2xl p-8 shadow-lg mb-16">
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">Platform Statistics</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-amber-600 mb-2">
                {isLoading ? '...' : userCount}
              </div>
              <div className="text-gray-600">Active Creators</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-600 mb-2">∞</div>
              <div className="text-gray-600">Coffees Served</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">24/7</div>
              <div className="text-gray-600">Always Open</div>
            </div>
          </div>
        </div>

        {/* Recent Creators */}
        {!isLoading && recentUsers.length > 0 && (
          <div id="explore" className="mb-16">
            <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">Recent Creators</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentUsers.map((user) => (
                <Link
                  key={user.id}
                  href={`/${user.username}`}
                  className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">@{user.username}</h4>
                      <p className="text-sm text-gray-500">Coffee tip jar</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center items-center mb-4">
            <span className="text-2xl mr-2">☕</span>
            <span className="text-xl font-semibold">CoffeeTip Platform</span>
          </div>
          <p className="text-gray-400">
            Powered by Arbitrum • Built with Next.js & Tailwind CSS
          </p>
        </div>
      </footer>
    </div>
  );
}
