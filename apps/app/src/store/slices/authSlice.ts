import type { User } from '@/types';
import { createSlice } from '@reduxjs/toolkit';

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  error: string | null;
  isInitialized: boolean;
  isLoading: boolean;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  error: null,
  isInitialized: false,
  isLoading: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    loginSuccess: (state, action) => {
      state.isLoading = false;
      state.user = action.payload.user;
      state.isAuthenticated = true;
    },
    loginFailure: (state, action) => {
      state.isLoading = false;
      state.user = null;
      state.isAuthenticated = false;
      state.error = action.payload || 'Login failed';
    },
    setUser: (state, action) => {
      const user = action.payload;
      state.user = user;
      state.isAuthenticated = !!user;
      state.isInitialized = true;
      state.error = null;

      if (user) {
        // TODO: handle user-specific logic
      }
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.isInitialized = true;
      state.error = null;
    },
    setAuthError: (state, action) => {
      state.error = action.payload;
      state.isInitialized = true;
    },
    setInitialized: (state, action) => {
      state.isInitialized = action.payload;
    },
  },
});

export const {
  setUser,
  logout,
  setAuthError,
  setInitialized,
  loginStart,
  loginSuccess,
  loginFailure,
} = authSlice.actions;
export default authSlice.reducer;
