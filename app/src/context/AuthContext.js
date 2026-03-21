"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { currentUser } from "@/lib/mockData";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored auth on mount
    const storedUser = localStorage.getItem("happystreet_user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = (username, password) => {
    // Mock login - in real app, validate against API
    // For demo, accept any non-empty username/password
    if (!username.trim() || !password.trim()) {
      return { success: false, error: "Username and password required" };
    }

    const userData = {
      ...currentUser,
      username: username.toLowerCase(),
    };

    localStorage.setItem("happystreet_user", JSON.stringify(userData));
    setUser(userData);
    return { success: true };
  };

  const register = (username, password) => {
    // Mock register - in real app, create account via API
    if (!username.trim() || !password.trim()) {
      return { success: false, error: "Username and password required" };
    }

    if (username.length < 3) {
      return { success: false, error: "Username must be at least 3 characters" };
    }

    if (password.length < 4) {
      return { success: false, error: "Password must be at least 4 characters" };
    }

    const userData = {
      ...currentUser,
      id: `user_${Date.now()}`,
      username: username.toLowerCase(),
      balance: 0,
    };

    localStorage.setItem("happystreet_user", JSON.stringify(userData));
    setUser(userData);
    return { success: true };
  };

  const logout = () => {
    localStorage.removeItem("happystreet_user");
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
