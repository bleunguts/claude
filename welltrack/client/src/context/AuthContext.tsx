import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { setAccessToken, setUnauthorizedHandler } from "../lib/apiClient";
import { loginRequest, logoutRequest, refreshRequest, registerRequest } from "../lib/authApi";
import type { AuthResult, LoginInput, RegisterInput, User } from "../types/api";

const REFRESH_TOKEN_KEY = "welltrack.refreshToken";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Avoids a race where two 401s in flight both try to refresh at once.
  const refreshInFlight = useRef<Promise<boolean> | null>(null);

  function applyAuthResult(result: AuthResult) {
    setUser(result.user);
    setAccessToken(result.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, result.refreshToken);
  }

  function clearAuthState() {
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }

  async function attemptSilentRefresh(): Promise<boolean> {
    const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!storedRefreshToken) return false;

    try {
      const result = await refreshRequest(storedRefreshToken);
      applyAuthResult(result);
      return true;
    } catch {
      clearAuthState();
      return false;
    }
  }

  useEffect(() => {
    setUnauthorizedHandler(() => {
      if (!refreshInFlight.current) {
        refreshInFlight.current = attemptSilentRefresh().finally(() => {
          refreshInFlight.current = null;
        });
      }
      return refreshInFlight.current;
    });

    void attemptSilentRefresh().finally(() => setIsLoading(false));

    return () => setUnauthorizedHandler(null);
  }, []);

  async function login(input: LoginInput) {
    const result = await loginRequest(input);
    applyAuthResult(result);
  }

  async function register(input: RegisterInput) {
    const result = await registerRequest(input);
    applyAuthResult(result);
  }

  async function logout() {
    const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    clearAuthState();
    if (storedRefreshToken) {
      await logoutRequest(storedRefreshToken).catch(() => undefined);
    }
  }

  const value = useMemo(() => ({ user, isLoading, login, register, logout }), [user, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
