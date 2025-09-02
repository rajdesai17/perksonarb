'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';
import { useAppSelector } from '../store/hooks';

export function Navbar() {
  const { isConnected } = useAppSelector((state) => state.wallet);
  const { userProfile, isLoading } = useAppSelector((state) => state.profile);

  return (
    <header className="bg-white/80 backdrop-blur-sm border-b border-amber-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center">
              <span className="text-xl">☕</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">CoffeeTip</h1>
          </Link>
          
          <div className="flex items-center space-x-4">
            {isConnected && (
              <>
                {userProfile ? (
                  // User has a profile - show dashboard and profile links
                  <div className="flex items-center space-x-4">
                    <Link
                      href="/dashboard"
                      className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
                    >
                      Dashboard
                    </Link>
                    <Link
                      href={`/${userProfile.username}`}
                      className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
                    >
                      My Page
                    </Link>
                  </div>
                ) : (
                  // User connected but no profile - show create link
                  <Link
                    href="/create"
                    className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
                  >
                    Create Tip Jar
                  </Link>
                )}
              </>
            )}
            <ConnectButton />
          </div>
        </div>
      </div>
    </header>
  );
}
