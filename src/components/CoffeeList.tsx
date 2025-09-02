'use client';

import { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { fetchRecentCoffees } from '../store/slices/contractSlice';

interface Coffee {
  id: number;
  creatorUsername: string;
  supporter: string;
  message: string;
  amount: string;
  timestamp: number;
}

interface CoffeeListProps {
  username?: string;
}

export function CoffeeList({ username }: CoffeeListProps) {
  const dispatch = useAppDispatch();
  const { recentCoffees: coffees, isLoading, error } = useAppSelector((state) => state.contract);

  useEffect(() => {
    if (username) {
      dispatch(fetchRecentCoffees({ username, limit: 10 }));
    }
  }, [username, dispatch]);

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-lg">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">Recent Supporters</h3>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-8 shadow-lg">
      <h3 className="text-2xl font-bold text-gray-900 mb-6">Recent Supporters</h3>
      
      {coffees.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">☕</span>
          </div>
          <p className="text-gray-600 mb-2">No coffees yet</p>
          <p className="text-sm text-gray-500">Be the first to buy a coffee!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {coffees.map((coffee) => (
            <div key={coffee.id} className="border-b border-gray-100 pb-6 last:border-b-0 last:pb-0">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {coffee.supporter.slice(2, 4).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900 truncate">{coffee.supporter.slice(0, 6)}...{coffee.supporter.slice(-4)}</h4>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-amber-600">{coffee.amount} ETH</span>
                      <span className="text-xs text-gray-500">{formatTimeAgo(coffee.timestamp * 1000)}</span>
                    </div>
                  </div>
                  {coffee.message && (
                    <p className="text-gray-700 text-sm mb-2 break-words">{coffee.message}</p>
                  )}
                  <div className="text-xs text-gray-500">
                    Coffee #{coffee.id}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
