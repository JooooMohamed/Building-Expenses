import { create } from "zustand";
import type { User } from "../types";
import * as authApi from "../api/auth";
import { getSecureItem } from "../utils/secureStorage";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isHydrated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  rehydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  isAuthenticated: false,
  isHydrated: false,

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const user = await authApi.login(email, password);
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    await authApi.logout();
    set({ user: null, isAuthenticated: false });
  },

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  rehydrate: async () => {
    try {
      const token = await getSecureItem("accessToken");
      if (!token) {
        set({ isHydrated: true });
        return;
      }
      const user = await authApi.getMe();
      set({ user, isAuthenticated: true, isHydrated: true });
    } catch {
      // Token expired or invalid — stay logged out
      set({ isHydrated: true });
    }
  },
}));
