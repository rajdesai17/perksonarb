'use client';

import { useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setWalletConnection, clearWallet } from '../store/slices/walletSlice';
import { fetchUserProfile, clearProfile, resetProfileState } from '../store/slices/profileSlice';

export function WalletSync() {
  const { address, isConnected } = useAccount();
  const dispatch = useAppDispatch();
  const { userProfile, isInitialized } = useAppSelector((state) => state.profile);

  // Sync wallet connection state with Redux
  useEffect(() => {
    dispatch(setWalletConnection({ isConnected, address: address || null }));
  }, [isConnected, address, dispatch]);

  // Fetch user profile when wallet connects
  useEffect(() => {
    if (isConnected && address) {
      dispatch(fetchUserProfile(address));
    } else if (!isConnected) {
      // Clear profile when wallet disconnects
      dispatch(clearProfile());
    }
  }, [isConnected, address, dispatch]);

  // Reset profile state when wallet changes
  useEffect(() => {
    if (address && userProfile && userProfile.wallet_address !== address.toLowerCase()) {
      dispatch(resetProfileState());
      dispatch(fetchUserProfile(address));
    }
  }, [address, userProfile, dispatch]);

  return null; // This component doesn't render anything
}
