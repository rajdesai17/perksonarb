'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CoffeeForm } from '../../components/CoffeeForm';
import { CoffeeList } from '../../components/CoffeeList';
import { getUserByUsername, type UserProfile } from '../../lib/supabase';
import { Navbar } from '../../components/Navbar';

export default function UserPage() {
  const params = useParams();
  const username = params?.username as string;
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      if (!username) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const userData = await getUserByUsername(username);
        if (!userData) {
          setError('User not found');
        } else {
          setUser(userData);
        }
      } catch (err) {
        console.error('Error fetching user:', err);
        setError('Failed to load user profile');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [username]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
        <Navbar />

        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">😞</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Profile Not Found</h1>
            <p className="text-gray-600 mb-8">
              The user @{username} doesn't exist or hasn't created a tip jar yet.
            </p>
            <Link
              href="/"
              className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold py-3 px-6 rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all duration-200"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
      <Navbar />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* User Profile Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full mb-6 shadow-lg">
            <span className="text-4xl text-white font-bold">
              {user.username.charAt(0).toUpperCase()}
            </span>
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            @{user.username}
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-6">
            Buy me a coffee to support my work! Every contribution helps and is greatly appreciated.
          </p>
          <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
            <span>☕ Coffee tip jar</span>
            <span>•</span>
            <span>⚡ Powered by Arbitrum</span>
          </div>
        </div>

        {/* Coffee Form and List */}
        <div className="grid lg:grid-cols-2 gap-12">
          <CoffeeForm username={user.username} />
          <CoffeeList username={user.username} />
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-20 bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center items-center mb-4">
            <span className="text-2xl mr-2">☕</span>
            <span className="text-xl font-semibold">@{user.username} on CoffeeTip</span>
          </div>
          <p className="text-gray-400">
            Powered by Arbitrum • Built with Next.js & Tailwind CSS
          </p>
        </div>
      </footer>
    </div>
  );
}
