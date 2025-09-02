'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { isUsernameAvailable } from '../../lib/supabase';
import { Navbar } from '../../components/Navbar';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { createUserProfileAsync } from '../../store/slices/profileSlice';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { LoadingScreen } from '../../components/LoadingScreen';
import { useRegisterCreator } from '../../lib/useContract';

export default function CreatePage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isConnected, address } = useAppSelector((state) => state.wallet);
  const { userProfile, isLoading, isInitialized } = useAppSelector((state) => state.profile);
  const [username, setUsername] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [step, setStep] = useState<'form' | 'creating' | 'registering' | 'success'>('form');
  
  // Wagmi hook for blockchain registration
  const { 
    registerCreator, 
    isPending: isRegistering, 
    isConfirming, 
    isConfirmed, 
    error: registrationError 
  } = useRegisterCreator();

  // Redirect to dashboard if user already has a profile
  useEffect(() => {
    if (isInitialized && userProfile) {
      router.push('/dashboard');
    }
  }, [isInitialized, userProfile, router]);

  // Handle registration confirmation
  useEffect(() => {
    if (isConfirmed && step === 'registering') {
      // Registration successful, create profile in database
      handleCreateProfile();
    }
  }, [isConfirmed, step]);

  // Handle registration errors
  useEffect(() => {
    if (registrationError && step === 'registering') {
      console.error('Registration error:', registrationError);
      setLocalError('Failed to register on blockchain. Please try again.');
      setStep('form');
    }
  }, [registrationError, step]);

  const validateUsername = (username: string): string | null => {
    if (!username) return 'Username is required';
    if (username.length < 3) return 'Username must be at least 3 characters';
    if (username.length > 20) return 'Username must be less than 20 characters';
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      return 'Username can only contain letters, numbers, underscores, and hyphens';
    }
    return null;
  };

  const handleCreateProfile = async () => {
    if (!address) {
      setLocalError('Wallet address not available');
      setStep('form');
      return;
    }

    try {
      // Create user profile using Redux thunk (database only)
      const result = await dispatch(createUserProfileAsync({ address, username })).unwrap();
      
      if (result) {
        setStep('success');
        // Redirect to dashboard after success
        setTimeout(() => {
          router.push('/dashboard');
        }, 3000);
      }
    } catch (err: any) {
      console.error('Error creating profile:', err);
      
      // Handle specific error messages from Redux thunk
      if (err?.message) {
        setLocalError(err.message);
      } else {
        setLocalError('Failed to create profile. Please try again.');
      }
      setStep('form');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected || !address) {
      setLocalError('Please connect your wallet first');
      return;
    }

    const validationError = validateUsername(username);
    if (validationError) {
      setLocalError(validationError);
      return;
    }

    setLocalError(null);
    setStep('creating');

    try {
      // Check if username is available in database first (faster check)
      const usernameAvailable = await isUsernameAvailable(username);
      if (!usernameAvailable) {
        setLocalError('Username is already taken. Please choose a different username.');
        setStep('form');
        return;
      }

      // Start blockchain registration
      setStep('registering');
      registerCreator(username);

    } catch (err: any) {
      console.error('Error starting registration:', err);
      setLocalError('Failed to start registration. Please try again.');
      setStep('form');
    }
  };

  // Show loading while profile is being fetched
  if (!isInitialized || isLoading) {
    return <LoadingScreen message="Checking your profile..." />;
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
        <Navbar />

        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="bg-white rounded-2xl p-8 shadow-lg max-w-md mx-auto text-center">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl">🔒</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Connect Your Wallet</h2>
            <p className="text-gray-600 mb-6">
              You need to connect your wallet to create a tip jar
            </p>
            <ConnectButton />
          </div>
        </div>
      </div>
    );
  }

  if (step === 'creating') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 shadow-lg max-w-md mx-auto text-center">
          <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Preparing Registration</h2>
          <p className="text-gray-600">
            Checking username availability and preparing blockchain registration...
          </p>
        </div>
      </div>
    );
  }

  if (step === 'registering') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 shadow-lg max-w-md mx-auto text-center">
          <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Registering on Blockchain</h2>
          <p className="text-gray-600 mb-4">
            {isRegistering ? 'Please confirm the transaction in your wallet...' : 
             isConfirming ? 'Transaction confirmed! Creating your profile...' :
             'Registering your username on the blockchain...'}
          </p>
          {isRegistering && (
            <p className="text-sm text-amber-600">
              Check your wallet to approve the transaction
            </p>
          )}
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 shadow-lg max-w-md mx-auto text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl">✅</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Tip Jar Created!</h2>
          <p className="text-gray-600 mb-6">
            Your tip jar @{username} has been created successfully!
          </p>
          <div className="space-y-3">
            <p className="text-sm text-gray-500">Redirecting to dashboard...</p>
            <Link
              href={`/${username}`}
              className="inline-block bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold py-2 px-4 rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all duration-200"
            >
              View Your Page
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
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full mb-6">
              <span className="text-3xl">☕</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Create Your Tip Jar</h1>
            <p className="text-gray-600">
              Choose a unique username for your coffee tip jar. Keep it simple and memorable!
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500">@</span>
                </div>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  placeholder="your-username"
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                  required
                  minLength={3}
                  maxLength={20}
                  pattern="[a-zA-Z0-9_-]+"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                3-20 characters, letters, numbers, underscores, and hyphens only
              </p>
              {username && (
                <p className="text-sm text-amber-600 mt-2">
                  Your page will be: {(process.env.NEXT_PUBLIC_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : ''))}/<strong>{username}</strong>
                </p>
              )}
            </div>

                         {localError && (
               <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                 <p className="text-red-600 text-sm">{localError}</p>
               </div>
             )}

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h3 className="font-medium text-amber-800 mb-2">What happens next?</h3>
              <ul className="text-sm text-amber-700 space-y-1">
                <li>• Your personal tip jar page will be created</li>
                <li>• People can send you crypto tips via your page</li>
                <li>• You'll get access to a dashboard to manage your jar</li>
                <li>• All transactions are on the Arbitrum blockchain</li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={isLoading || !username}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold py-3 px-6 rounded-xl hover:from-amber-600 hover:to-orange-600 transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating...</span>
                </div>
              ) : (
                'Create My Tip Jar'
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
