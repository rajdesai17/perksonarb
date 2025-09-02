'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getUserProfile, type UserProfile } from '../../lib/supabase';
import { Navbar } from '../../components/Navbar';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { fetchContractStats } from '../../store/slices/contractSlice';

export default function DashboardPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isConnected, address } = useAppSelector((state) => state.wallet);
  const { userProfile: user, isLoading: contextLoading, isInitialized } = useAppSelector((state) => state.profile);
  const { stats, isLoading: contractLoading } = useAppSelector((state) => state.contract);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!isConnected || !address) {
        setIsLoading(false);
        return;
      }

      // If we have a user profile from Redux, use it
      if (user && user.username) {
        // Only fetch contract stats if contract is deployed
        if (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS) {
          try {
            dispatch(fetchContractStats(user.username));
          } catch (error) {
            console.log('Contract not deployed yet, skipping stats fetch');
          }
        }
        setIsLoading(false);
        return;
      }

      // If profile is initialized but no user, redirect to create
      if (isInitialized && !user) {
        router.push('/create');
        return;
      }
    };

    fetchUserData();
  }, [address, isConnected, router, user, isInitialized, dispatch]);

  // No need for withdrawal in MVP - creators get paid directly

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
              Connect your wallet to access your dashboard
            </p>
            <ConnectButton />
          </div>
        </div>
      </div>
    );
  }

  if (isLoading || contextLoading || contractLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
        <header className="bg-white/80 backdrop-blur-sm border-b border-amber-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-xl">☕</span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900">CoffeeTip</h1>
              </Link>
              <ConnectButton />
            </div>
          </div>
        </header>

        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="bg-white rounded-2xl p-8 shadow-lg max-w-md mx-auto text-center">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl">☕</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Create Your Tip Jar</h2>
            <p className="text-gray-600 mb-6">
              You don't have a tip jar yet. Create one to get started!
            </p>
            <Link
              href="/create"
              className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold py-3 px-6 rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all duration-200"
            >
              Create Tip Jar
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
        {/* Welcome Section */}
        <div className="bg-white rounded-2xl p-8 shadow-lg mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Welcome back, @{user.username}!</h1>
              <p className="text-gray-600">Manage your coffee tip jar and track your support</p>
            </div>
          </div>
          
          <div className="text-center">
            <Link
              href={`/${user.username}`}
              className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold py-3 px-6 rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all duration-200 inline-block"
            >
              View Your Page
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Total Coffees</h3>
              <span className="text-2xl">☕</span>
            </div>
            <div className="text-3xl font-bold text-amber-600">{stats.totalCoffees}</div>
            <p className="text-sm text-gray-500">Coffees received</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Total Raised</h3>
              <span className="text-2xl">💰</span>
            </div>
            <div className="text-3xl font-bold text-green-600">{stats.totalRaised} ETH</div>
            <p className="text-sm text-gray-500">Direct to your wallet</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Supporters</h3>
              <span className="text-2xl">👥</span>
            </div>
            <div className="text-3xl font-bold text-blue-600">{stats.uniqueSupporters}</div>
            <p className="text-sm text-gray-500">Unique supporters</p>
          </div>
        </div>

        {/* Contract Status */}
        {!process.env.NEXT_PUBLIC_CONTRACT_ADDRESS && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <span className="text-yellow-600">⚠️</span>
              </div>
              <h3 className="font-semibold text-yellow-800">Contract Not Deployed</h3>
            </div>
            <p className="text-yellow-700 mb-4">
              The smart contract hasn't been deployed yet. Your profile is saved locally, but coffee purchases won't work until the contract is deployed.
            </p>
            <div className="text-sm text-yellow-600">
              <p><strong>To deploy the contract:</strong></p>
              <ol className="list-decimal list-inside mt-2 space-y-1">
                <li>Run: <code className="bg-yellow-100 px-2 py-1 rounded">npx hardhat run scripts/deploy-mvp.ts --network arbitrumSepolia</code></li>
                <li>Add the contract address to <code className="bg-yellow-100 px-2 py-1 rounded">.env.local</code></li>
                <li>Restart the app</li>
              </ol>
            </div>
          </div>
        )}

        {/* Page Settings */}
        <div className="bg-white rounded-2xl p-8 shadow-lg mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Page Settings</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Page URL
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={`coffeetip.com/${user.username}`}
                  readOnly
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-600"
                />
                <button
                  onClick={() => navigator.clipboard.writeText(`https://coffeetip.com/${user.username}`)}
                  className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Copy
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Wallet Address
              </label>
              <input
                type="text"
                value={user.wallet_address}
                readOnly
                className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Global Contract Address
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || 'Loading...'}
                  readOnly
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-600 text-sm"
                />
                <a
                  href={`https://arbiscan.io/address/${process.env.NEXT_PUBLIC_CONTRACT_ADDRESS}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-3 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 transition-colors"
                >
                  View
                </a>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                All creators use this same contract
              </p>
            </div>
          </div>
        </div>

        {/* Recent Activity Placeholder */}
        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Activity</h2>
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📊</span>
            </div>
            <p className="text-gray-600 mb-4">No activity yet</p>
            <p className="text-sm text-gray-500">
              Share your page to start receiving coffee tips!
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
