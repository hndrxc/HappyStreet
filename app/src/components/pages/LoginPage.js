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
    <div className="min-h-[100dvh] bg-base">
      <div className="grain-overlay" />
      <div className="page-center px-6">
        <div className="w-full max-w-[var(--content-tight-width)]">
          <div className="text-center mb-8">
            <h1 className="font-heading text-3xl text-accent tracking-tight">
              HappyStreet
            </h1>
            <p className="text-text-secondary text-sm mt-2">
              {isRegister ? "Join the happiness economy" : "Welcome back"}
            </p>
          </div>

          <div className="w-full bg-surface rounded-2xl shadow-warm p-6">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="font-heading text-xs text-text-secondary uppercase tracking-wide">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full min-h-[var(--control-height)] px-4 bg-base rounded-xl border border-border focus:border-accent focus:outline-none text-text-primary placeholder:text-text-muted transition-colors"
                  placeholder="Enter username"
                  autoComplete="username"
                  disabled={isSubmitting}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-heading text-xs text-text-secondary uppercase tracking-wide">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full min-h-[var(--control-height)] px-4 bg-base rounded-xl border border-border focus:border-accent focus:outline-none text-text-primary placeholder:text-text-muted transition-colors"
                  placeholder="Enter password"
                  autoComplete={isRegister ? "new-password" : "current-password"}
                  disabled={isSubmitting}
                />
              </div>

              {error && (
                <p className="text-error text-sm text-center">{error}</p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 min-h-[var(--control-height)] bg-accent hover:bg-accent-light text-text-on-accent font-heading text-sm rounded-xl transition-colors disabled:opacity-70 shadow-warm-sm"
              >
                {isSubmitting ? "..." : isRegister ? "Create Account" : "Sign In"}
              </button>
            </form>

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
      </div>
    </div>
  );
}
