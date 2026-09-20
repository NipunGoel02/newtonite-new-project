import { createContext, useEffect, useState } from "react";
import api from "../services/api";

export const AuthContext = createContext(null);

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");

    if (!accessToken) {
      setLoading(false);
      return;
    }

    const loadUser = async () => {
      try {
        const response = await api.get("/auth/me");

        if (response.data?.user) {
          setUser(response.data.user);
          localStorage.setItem(
            "user",
            JSON.stringify(response.data.user)
          );
        }
      } catch {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (email, password) => {
    const response = await api.post("/auth/login", {
      email,
      password,
    });

    const { accessToken, refreshToken, user } = response.data;

    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    localStorage.setItem("user", JSON.stringify(user));

    setUser(user);

    return response.data;
  };

  const register = async (name, email, password) => {
    const response = await api.post("/auth/register", {
      name,
      email,
      password,
    });

    return response.data;
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem("refreshToken");

    try {
      if (refreshToken) {
        await api.post("/auth/logout", {
          refreshToken,
        });
      }
    } catch {}

    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");

    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        isAdmin: user?.role === "admin",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}