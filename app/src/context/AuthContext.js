"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { authLogin, authRegister, authMe } from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(() => {
    if (typeof window === "undefined") return true;
    return Boolean(localStorage.getItem("happystreet_token"));
  });

  useEffect(() => {
    const token = localStorage.getItem("happystreet_token");
    if (!token) return;

    authMe(token).then((userData) => {
      if (userData) setUser(userData);
      else localStorage.removeItem("happystreet_token");
    }).finally(() => setIsLoading(false));
  }, []);

  const login = async (username, password) => {
    try {
      const { token, user: userData } = await authLogin(username, password);
      localStorage.setItem("happystreet_token", token);
      setUser(userData);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const register = async (username, password) => {
    try {
      const { token, user: userData } = await authRegister(username, password);
      localStorage.setItem("happystreet_token", token);
      setUser(userData);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const logout = () => {
    localStorage.removeItem("happystreet_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
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
