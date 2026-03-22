"use client";

import { useState, useEffect } from "react";
import { CloseIcon } from "./icons";
import { createQuest } from "@/lib/api";

const CATEGORIES = [
  "kindness",
  "mindfulness",
  "social connection",
  "physical activity",
  "creativity",
  "gratitude",
];

const CATEGORY_COLORS = {
  kindness: "#E8A020",
  mindfulness: "#8B5CF6",
  "social connection": "#3B82F6",
  "physical activity": "#10B981",
  creativity: "#F472B6",
  gratitude: "#F59E0B",
};

export default function PostNeedSheet({ isOpen, onClose }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("kindness");
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

    setSubmitError("");
    setIsSubmitting(true);

    try {
      await createQuest({ title: title.trim(), category });
      setTitle("");
      setCategory("kindness");
      onClose();
    } catch {
      setSubmitError("Could not post quest right now. Please try again.");
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

      {/* Modal */}
      <div
        className={`fixed inset-0 z-[1201] flex items-center justify-center p-4 transition-all duration-300 ease-out ${
          isAnimating ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
      >
        <div className="post-need-box w-full max-w-md bg-surface rounded-3xl shadow-warm border border-border">
          {/* Header */}
          <div className="post-need-header flex items-center justify-between">
            <h2 className="font-pixel text-[12px] text-text-primary">Post a Quest</h2>
            <button
              onClick={onClose}
              className="text-text-muted hover:text-text-primary transition-colors"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="post-need-form">
            {/* Title */}
            <div>
              <label className="post-need-label text-sm text-text-secondary">
                Describe your quest
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Buy a coffee for someone studying alone"
                className="post-need-input bg-base rounded-xl border border-border text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
              />
            </div>

            {/* Category picker */}
            <div>
              <label className="post-need-label text-sm text-text-secondary">
                Category
              </label>
              <div className="post-need-pills">
                {CATEGORIES.map((cat) => {
                  const isActive = category === cat;
                  const color = CATEGORY_COLORS[cat];
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className="post-need-pill rounded-full text-xs font-medium capitalize transition-all"
                      style={{
                        backgroundColor: isActive ? color : color + "15",
                        color: isActive ? "#fff" : color,
                        border: `1.5px solid ${isActive ? color : "transparent"}`,
                      }}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={!title.trim() || isSubmitting}
              className="post-need-submit bg-accent text-text-on-accent font-semibold rounded-xl shadow-warm transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Posting..." : "Post Quest"}
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
