import { create } from 'zustand';
import type { AuthTokens, User } from '../types';

interface AuthState {
  tokens: AuthTokens | null;
  user: User | null;
  isAuthenticated: boolean;
  setTokens: (accessToken: string, refreshToken: string) => void;
  login: (tokens: AuthTokens) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
    // Rehydrate from local storage if needed, but for simplicity we keep it in memory
    // or we could use zustand/middleware persist
    const storedTokens = localStorage.getItem('auth-tokens');
    let initialTokens = null;
    let initialUser = null;
    let initialAuth = false;
    
    if (storedTokens) {
        try {
            initialTokens = JSON.parse(storedTokens);
            initialUser = initialTokens.user;
            initialAuth = true;
        } catch {
            localStorage.removeItem('auth-tokens');
        }
    }

    return {
        tokens: initialTokens,
        user: initialUser,
        isAuthenticated: initialAuth,
        setTokens: (accessToken, refreshToken) => set((state) => {
            if (!state.tokens) return state;
            const newTokens = { ...state.tokens, accessToken, refreshToken };
            localStorage.setItem('auth-tokens', JSON.stringify(newTokens));
            return { tokens: newTokens };
        }),
        login: (tokens) => {
            localStorage.setItem('auth-tokens', JSON.stringify(tokens));
            set({ tokens, user: tokens.user, isAuthenticated: true });
        },
        logout: () => {
            localStorage.removeItem('auth-tokens');
            set({ tokens: null, user: null, isAuthenticated: false });
        }
    }
});
