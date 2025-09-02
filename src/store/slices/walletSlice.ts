import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface WalletState {
  isConnected: boolean;
  address: string | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: WalletState = {
  isConnected: false,
  address: null,
  isLoading: false,
  error: null,
};

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    setWalletConnection: (state, action: PayloadAction<{ isConnected: boolean; address: string | null }>) => {
      state.isConnected = action.payload.isConnected;
      state.address = action.payload.address;
      state.isLoading = false;
      state.error = null;
    },
    setWalletLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setWalletError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    clearWallet: (state) => {
      state.isConnected = false;
      state.address = null;
      state.isLoading = false;
      state.error = null;
    },
  },
});

export const { setWalletConnection, setWalletLoading, setWalletError, clearWallet } = walletSlice.actions;
export default walletSlice.reducer;



