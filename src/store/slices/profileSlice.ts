import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { getUserProfile, createUserProfile, isUsernameAvailable as isUsernameAvailableDb, type UserProfile } from '../../lib/supabase';

interface ProfileState {
  userProfile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
}

const initialState: ProfileState = {
  userProfile: null,
  isLoading: false,
  error: null,
  isInitialized: false,
};

// Async thunk to fetch user profile
export const fetchUserProfile = createAsyncThunk(
  'profile/fetchUserProfile',
  async (address: string, { rejectWithValue }) => {
    try {
      const profile = await getUserProfile(address);
      return profile;
    } catch (error) {
      return rejectWithValue('Failed to fetch user profile');
    }
  }
);

// Async thunk to create user profile (database only - blockchain registration handled separately)
export const createUserProfileAsync = createAsyncThunk(
  'profile/createUserProfile',
  async ({ address, username }: { address: string; username: string }, { rejectWithValue }) => {
    try {
      // Ensure username unique in DB
      const available = await isUsernameAvailableDb(username)
      if (!available) {
        throw new Error('Username is already taken')
      }
      // Create profile in Supabase for caching and faster lookups
      console.log('💾 Creating profile in database...');
      const profile = await createUserProfile(address, username);
      if (!profile) {
        throw new Error('Failed to create profile in database');
      }

      // For MVP, we return the created profile as-is
      return profile;
    } catch (error) {
      console.error('❌ Error creating user profile:', error);
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('Username is already taken')) {
          return rejectWithValue('Username is already taken');
        }
        if (error.message.includes('network') || error.message.includes('NETWORK_ERROR')) {
          return rejectWithValue('Network error. Please check your connection and try again.');
        }
        if (error.message.includes('user rejected') || error.message.includes('User denied')) {
          return rejectWithValue('Transaction was cancelled by user');
        }
      }
      
      return rejectWithValue('Failed to create user profile. Please try again.');
    }
  }
);

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    setProfile: (state, action: PayloadAction<UserProfile | null>) => {
      state.userProfile = action.payload;
      state.isLoading = false;
      state.error = null;
      state.isInitialized = true;
    },
    clearProfile: (state) => {
      state.userProfile = null;
      state.isLoading = false;
      state.error = null;
      state.isInitialized = true;
    },
    setProfileLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setProfileError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    resetProfileState: (state) => {
      state.userProfile = null;
      state.isLoading = false;
      state.error = null;
      state.isInitialized = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch profile
      .addCase(fetchUserProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.userProfile = action.payload;
        state.isLoading = false;
        state.error = null;
        state.isInitialized = true;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isInitialized = true;
      })
      // Create profile
      .addCase(createUserProfileAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createUserProfileAsync.fulfilled, (state, action) => {
        state.userProfile = action.payload;
        state.isLoading = false;
        state.error = null;
        state.isInitialized = true;
      })
      .addCase(createUserProfileAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { 
  setProfile, 
  clearProfile, 
  setProfileLoading, 
  setProfileError, 
  resetProfileState 
} = profileSlice.actions;

export default profileSlice.reducer;
