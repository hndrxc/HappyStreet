"use client";

import { useState, useEffect } from "react";
import { CloseIcon } from "./icons";

export default function PostNeedSheet({ isOpen, onClose, onSubmitNeed }) {
  const [appearance, setAppearance] = useState("");
  const [location, setLocation] = useState("");
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      requestAnimationFrame(() => {
        setIsAnimating(true);
      });
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const payload = {
      appearance: appearance.trim(),
      location: location.trim(),
    };

    setSubmitError("");
    setIsSubmitting(true);

    try {
      if (onSubmitNeed) {
        await onSubmitNeed(payload);
      } else {
        // Keep frontend usable until backend endpoint is added.
        await new Promise((resolve) => setTimeout(resolve, 150));
      }
      setAppearance("");
      setLocation("");
      onClose();
    } catch {
      setSubmitError("Could not post this need right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!shouldRender) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-text-primary/30 z-[1200] transition-opacity duration-300 ${
          isAnimating ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />
      
      {/* Sheet */}
      <div 
        className={`fixed bottom-0 left-0 right-0 z-[1201] transition-transform duration-300 ease-out ${
          isAnimating ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="max-w-[680px] mx-auto bg-surface rounded-t-3xl shadow-warm border-t border-border">
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 rounded-full bg-border-warm" />
          </div>
          
          {/* Header */}
          <div className="flex items-center justify-between px-5 pb-4">
            <h2 className="font-pixel text-[12px] text-text-primary">Post a Need</h2>
            <button 
              onClick={onClose}
              className="p-2 -mr-2 text-text-muted hover:text-text-primary transition-colors"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-5 pb-8 space-y-4">
            <div>
              <label className="block text-sm text-text-secondary mb-2">
                What do you look like?
              </label>
              <input
                type="text"
                value={appearance}
                onChange={(e) => setAppearance(e.target.value)}
                placeholder="e.g., Red jacket, glasses"
                className="w-full px-4 py-3 bg-base rounded-xl border border-border text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
              />
            </div>
            
            <div>
              <label className="block text-sm text-text-secondary mb-2">
                Where are you?
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Near the fountain"
                className="w-full px-4 py-3 bg-base rounded-xl border border-border text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={!appearance.trim() || !location.trim() || isSubmitting}
              className="w-full py-4 bg-accent text-text-on-accent font-semibold rounded-xl shadow-warm transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Submitting..." : "Submit Need"}
            </button>

            {submitError && (
              <p className="text-sm text-error text-center">{submitError}</p>
            )}
          </form>
        </div>
      </div>
    </>
  );
}
