import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { contractService } from '../../lib/contractService';

interface ContractStats {
  totalCoffees: number;
  totalRaised: string;
  uniqueSupporters: number;
}

interface Coffee {
  id: number;
  creatorUsername: string;
  supporter: string;
  message: string;
  timestamp: number;
  amount: string;
}

interface ContractState {
  stats: ContractStats;
  recentCoffees: Coffee[];
  isLoading: boolean;
  error: string | null;
}

const initialState: ContractState = {
  stats: {
    totalCoffees: 0,
    totalRaised: '0',
    uniqueSupporters: 0
  },
  recentCoffees: [],
  isLoading: false,
  error: null,
};

// Async thunk to fetch contract stats for a creator
export const fetchContractStats = createAsyncThunk(
  'contract/fetchStats',
  async (username: string, { rejectWithValue }) => {
    try {
      const [totalCoffees, totalRaised] = await Promise.all([
        contractService.getTotalCoffeesForCreator(username),
        contractService.getTotalRaisedForCreator(username)
      ]);

      // Calculate unique supporters from recent coffees
      const recentCoffees = await contractService.getRecentCoffeesForCreator(username, 100);
      const uniqueSupporters = new Set(recentCoffees.map(coffee => coffee.supporter)).size;

      return {
        totalCoffees,
        totalRaised,
        uniqueSupporters
      };
    } catch (error) {
      return rejectWithValue('Failed to fetch contract stats');
    }
  }
);

// Async thunk to fetch recent coffees for a creator
export const fetchRecentCoffees = createAsyncThunk(
  'contract/fetchRecentCoffees',
  async ({ username, limit }: { username: string; limit?: number }, { rejectWithValue }) => {
    try {
      const coffees = await contractService.getRecentCoffeesForCreator(username, limit);
      return coffees;
    } catch (error) {
      return rejectWithValue('Failed to fetch recent coffees');
    }
  }
);

// Async thunk to buy coffee for a creator
export const buyCoffeeAsync = createAsyncThunk(
  'contract/buyCoffee',
  async ({ username, message, amount }: { username: string; message: string; amount: string }, { rejectWithValue }) => {
    try {
      const success = await contractService.buyCoffee(username, message, amount);
      if (!success) {
        throw new Error('Failed to buy coffee');
      }
      return { username, message, amount };
    } catch (error) {
      return rejectWithValue('Failed to buy coffee');
    }
  }
);

// Note: registerCreatorAsync removed - registration should be handled via wagmi hooks in components
// This is because wagmi hooks need to be used in React components, not in Redux thunks

const contractSlice = createSlice({
  name: 'contract',
  initialState,
  reducers: {
    clearContractData: (state) => {
      state.stats = initialState.stats;
      state.recentCoffees = [];
      state.isLoading = false;
      state.error = null;
    },
    setContractError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch stats
      .addCase(fetchContractStats.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchContractStats.fulfilled, (state, action) => {
        state.stats = action.payload;
        state.isLoading = false;
        state.error = null;
      })
      .addCase(fetchContractStats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch recent coffees
      .addCase(fetchRecentCoffees.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchRecentCoffees.fulfilled, (state, action) => {
        state.recentCoffees = action.payload;
        state.isLoading = false;
        state.error = null;
      })
      .addCase(fetchRecentCoffees.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Buy coffee
      .addCase(buyCoffeeAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(buyCoffeeAsync.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(buyCoffeeAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Register creator cases removed - handled via wagmi hooks in components
  },
});

export const { clearContractData, setContractError } = contractSlice.actions;
export default contractSlice.reducer;


