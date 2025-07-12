export interface User {
  id: string;
  email: string;
  name?: string;
  createdAt: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name?: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
  message?: string;
}
export interface UserInfo {
  sub: string;
  name: string;
  email: string;
  picture?: string;
  [key: string]: unknown;
}

export interface AuthStorage {
  auth0_token?: string;
  token_expiry?: number;
  user_info?: UserInfo;
}

export type AuthMessage =
  | {
      type: 'AUTH0_TOKEN_UPDATE';
      token: string;
      expiry: number;
      user: UserInfo;
    }
  | { type: 'AUTH0_LOGOUT' };
