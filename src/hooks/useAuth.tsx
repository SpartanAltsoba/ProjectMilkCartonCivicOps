import { useState, useEffect, useContext, createContext, ReactNode } from "react";
import { useRouter } from "next/router";
import { logger } from "../lib/logger";

interface User {
  id: number;
  email: string;
  name: string;
  emailVerified: boolean;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  refreshToken: () => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch("/api/auth/verify", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData.user);
      } else {
        localStorage.removeItem("authToken");
        localStorage.removeItem("refreshToken");
      }
    } catch (error) {
      await logger.error("Auth check failed", error);
      localStorage.removeItem("authToken");
      localStorage.removeItem("refreshToken");
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Login failed");
      }

      const data = await response.json();

      localStorage.setItem("authToken", data.token);
      localStorage.setItem("refreshToken", data.refreshToken);
      setUser(data.user);

      await logger.info("User logged in", { userId: data.user.id });
    } catch (error) {
      await logger.error("Login failed", error, { email });
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, name }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Registration failed");
      }

      const data = await response.json();

      // Don't auto-login after registration - require email verification
      await logger.info("User registered", { email });
    } catch (error) {
      await logger.error("Registration failed", error, { email });
      throw error;
    }
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (token) {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }

      localStorage.removeItem("authToken");
      localStorage.removeItem("refreshToken");
      setUser(null);

      await logger.info("User logged out", { userId: user?.id });
      router.push("/login");
    } catch (error) {
      await logger.error("Logout failed", error);
      // Still clear local state even if API call fails
      localStorage.removeItem("authToken");
      localStorage.removeItem("refreshToken");
      setUser(null);
      router.push("/login");
    }
  };

  const refreshToken = async () => {
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) {
        throw new Error("No refresh token available");
      }

      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        throw new Error("Token refresh failed");
      }

      const data = await response.json();
      localStorage.setItem("authToken", data.token);
      localStorage.setItem("refreshToken", data.refreshToken);
      setUser(data.user);
    } catch (error) {
      await logger.error("Token refresh failed", error);
      localStorage.removeItem("authToken");
      localStorage.removeItem("refreshToken");
      setUser(null);
      router.push("/login");
      throw error;
    }
  };

  const verifyEmail = async (token: string) => {
    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Email verification failed");
      }

      await logger.info("Email verified", { token: token.substring(0, 10) + "..." });
    } catch (error) {
      await logger.error("Email verification failed", error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    register,
    refreshToken,
    verifyEmail,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Auto-refresh token when it's about to expire
export function useTokenRefresh() {
  const { refreshToken } = useAuth();

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) return;

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const expirationTime = payload.exp * 1000;
      const currentTime = Date.now();
      const timeUntilExpiry = expirationTime - currentTime;

      // Refresh token 5 minutes before expiry
      const refreshTime = Math.max(timeUntilExpiry - 5 * 60 * 1000, 0);

      const timeoutId = setTimeout(() => {
        refreshToken().catch(console.error);
      }, refreshTime);

      return () => clearTimeout(timeoutId);
    } catch (error) {
      console.error("Error parsing token:", error);
    }
  }, [refreshToken]);
}
