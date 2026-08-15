import { create } from "zustand";

interface AuthState {
  accessToken: string | null;
  setAccessToken: (token: string) => void;
  logout: () => void;
}

/**
 * El access token vive SOLO en memoria (no localStorage/sessionStorage):
 * mitiga XSS de robo persistente. El refresh token vive en cookie HttpOnly,
 * inaccesible desde JS. Al recargar la página, un POST /auth/refresh
 * silencioso (con la cookie) recupera el access token.
 */
export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  setAccessToken: (token) => set({ accessToken: token }),
  logout: () => set({ accessToken: null }),
}));
