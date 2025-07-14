import { authApi } from '@/services';
import type { User } from '@/types';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
  callbackHandled?: boolean;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  isInitialized: false,
  callbackHandled: false,
};

export const initializeAuth = createAsyncThunk(
  'auth/initialize',
  async (_, { rejectWithValue }) => {
    try {
      const user = await authApi.getCurrentUser();
      return user;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Authentication failed',
      );
    }
  },
);

export const loginWithGoogle = createAsyncThunk(
  'auth/loginWithGoogle',
  async (_, { rejectWithValue }) => {
    try {
      const { auth_url } = await authApi.loginWithGoogle();
      // Redirect to Google OAuth
      window.location.href = auth_url;
      return null; // We'll handle the result after redirect
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Google login failed',
      );
    }
  },
);

export const loginWithEmailPassword = createAsyncThunk(
  'auth/loginWithEmailPassword',
  async (
    { email, password }: { email: string; password: string },
    { rejectWithValue },
  ) => {
    try {
      const user = await authApi.login({ email, password });
      return user;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Login failed',
      );
    }
  },
);

export const registerWithEmailPassword = createAsyncThunk(
  'auth/registerWithEmailPassword',
  async (
    {
      name,
      email,
      password,
    }: { name: string; email: string; password: string },
    { rejectWithValue },
  ) => {
    try {
      const user = await authApi.register({ name, email, password });
      return user;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Registration failed',
      );
    }
  },
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await authApi.logout();
      return null;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Logout failed',
      );
    }
  },
);

export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async ({ email }: { email: string }, { rejectWithValue }) => {
    try {
      await authApi.forgotPassword({ email });
      return null;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to send reset email',
      );
    }
  },
);

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async (
    { token, password }: { token: string; password: string },
    { rejectWithValue },
  ) => {
    try {
      await authApi.resetPassword({ token, password });
      return null;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Password reset failed',
      );
    }
  },
);

export const verifyEmail = createAsyncThunk(
  'auth/verifyEmail',
  async ({ token }: { token: string }, { rejectWithValue }) => {
    try {
      await authApi.verifyEmail({ token });
      return null;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Email verification failed',
      );
    }
  },
);

export const addPassword = createAsyncThunk(
  'auth/addPassword',
  async ({ password }: { password: string }, { rejectWithValue }) => {
    try {
      await authApi.addPassword({ password });
      return null;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to add password',
      );
    }
  },
);

export const handleAuthCallback = createAsyncThunk(
  'auth/handleAuthCallback',
  async (_, { rejectWithValue }) => {
    try {
      const success = await authApi.handleAuthCallback();
      if (success) {
        // Get the user data after successful OAuth
        const user = await authApi.getCurrentUser();
        return user;
      }
      return null;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Auth callback failed',
      );
    }
  },
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    resetCallbackHandled: (state) => {
      state.callbackHandled = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Initialize auth
      .addCase(initializeAuth.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = !!action.payload;
        state.isInitialized = true;
        state.error = null;
        state.callbackHandled = true;
      })
      .addCase(initializeAuth.rejected, (state, action) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.isInitialized = true;
        state.callbackHandled = false;
        state.error = action.payload as string;
      })

      // Google login
      .addCase(loginWithGoogle.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginWithGoogle.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
        // Don't set user here - will be set after redirect
      })
      .addCase(loginWithGoogle.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Email/password login
      .addCase(loginWithEmailPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginWithEmailPassword.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginWithEmailPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Register
      .addCase(registerWithEmailPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerWithEmailPassword.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(registerWithEmailPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Logout
      .addCase(logout.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(logout.fulfilled, (state) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(logout.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Forgot password
      .addCase(forgotPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(forgotPassword.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Reset password
      .addCase(resetPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Verify email
      .addCase(verifyEmail.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyEmail.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(verifyEmail.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Add password
      .addCase(addPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addPassword.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(addPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Handle auth callback
      .addCase(handleAuthCallback.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(handleAuthCallback.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = !!action.payload;
        state.error = null;
        state.callbackHandled = true;
      })
      .addCase(handleAuthCallback.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.callbackHandled = true;
      });
  },
});

export const { setUser, clearError, resetCallbackHandled } = authSlice.actions;
export default authSlice.reducer;
