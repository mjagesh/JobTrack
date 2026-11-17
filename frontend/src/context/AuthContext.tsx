"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { getCurrentUser, type AuthUser } from "@/lib/auth-api";
import { getToken, removeToken } from "@/lib/auth";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    if (!getToken()) {
      setUser(null);
      return;
    }

    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch {
      removeToken();
      setUser(null);
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function loadUser() {
      if (!getToken()) {
        if (active) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      try {
        const currentUser = await getCurrentUser();
        if (active) setUser(currentUser);
      } catch {
        removeToken();
        if (active) setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadUser();

    return () => {
      active = false;
    };
  }, []);

  const logout = useCallback(() => {
    removeToken();
    setUser(null);
    router.replace("/login");
  }, [router]);

  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401 && getToken()) {
          removeToken();
          setUser(null);
          router.replace("/login");
        }

        return Promise.reject(error);
      },
    );

    return () => {
      api.interceptors.response.eject(interceptor);
    };
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, loading, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
