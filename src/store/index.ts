import { configureStore } from '@reduxjs/toolkit';
import walletReducer from './slices/walletSlice';
import profileReducer from './slices/profileSlice';
import contractReducer from './slices/contractSlice';

export const store = configureStore({
  reducer: {
    wallet: walletReducer,
    profile: profileReducer,
    contract: contractReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
        // Ignore these field paths in all actions
        ignoredActionPaths: ['meta.arg', 'payload.timestamp'],
        // Ignore these paths in the state
        ignoredPaths: ['items.dates'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
