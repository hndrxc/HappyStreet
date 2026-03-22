"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    // Small delay for UX feedback
    await new Promise((r) => setTimeout(r, 300));

    const result = isRegister
      ? await register(username, password)
      : await login(username, password);

    if (!result.success) {
      setError(result.error);
    }
    setIsSubmitting(false);
  };

  const toggleMode = () => {
    setIsRegister(!isRegister);
    setError("");
  };

  return (
    <div className="min-h-screen bg-base flex flex-col items-center justify-center p-6">
      <div className="grain-overlay" />
      
      {/* Logo / Title */}
      <div className="text-center mb-10">
        <h1 className="font-pixel text-accent text-[14px] leading-relaxed tracking-tight">
          HappyStreet
        </h1>
        <p className="text-text-secondary text-sm mt-2">
          {isRegister ? "Join the happiness economy" : "Welcome back"}
        </p>
      </div>

      {/* Form Card */}
      <div className="w-full max-w-[320px] bg-surface rounded-2xl shadow-warm p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Username Field */}
          <div className="flex flex-col gap-1.5">
            <label className="font-pixel text-[8px] text-text-secondary uppercase tracking-wide">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-base rounded-xl border border-border focus:border-accent focus:outline-none text-text-primary placeholder:text-text-muted transition-colors"
              placeholder="Enter username"
              autoComplete="username"
              disabled={isSubmitting}
            />
          </div>

          {/* Password Field */}
          <div className="flex flex-col gap-1.5">
            <label className="font-pixel text-[8px] text-text-secondary uppercase tracking-wide">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-base rounded-xl border border-border focus:border-accent focus:outline-none text-text-primary placeholder:text-text-muted transition-colors"
              placeholder="Enter password"
              autoComplete={isRegister ? "new-password" : "current-password"}
              disabled={isSubmitting}
            />
          </div>

          {/* Error Message */}
          {error && (
            <p className="text-error text-xs text-center">{error}</p>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-3.5 bg-accent hover:bg-accent-light text-text-on-accent font-pixel text-[10px] rounded-xl transition-colors disabled:opacity-70 shadow-warm-sm"
          >
            {isSubmitting ? "..." : isRegister ? "Create Account" : "Sign In"}
          </button>
        </form>

        {/* Toggle Mode Link */}
        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={toggleMode}
            className="text-accent hover:text-accent-light text-sm transition-colors"
          >
            {isRegister ? "Already have an account? Sign In" : "Create Account"}
          </button>
        </div>
      </div>
    </div>
  );
}
