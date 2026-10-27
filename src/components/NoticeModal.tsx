"use client";

import { useEffect } from "react";

interface NoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
}

export function NoticeModal({
  isOpen,
  onClose,
  title = "Development in Progress",
  message = "Wedora is actively being built as a completely free wedding management platform. Account creation and workspace tools will become available in upcoming releases.",
}: NoticeModalProps) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 sm:p-8 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <span className="inline-block rounded-full bg-[var(--color-champagne)] px-3 py-0.5 text-xs font-medium tracking-wide text-[var(--color-foreground)]">
            Phase 2 Notice
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded p-1 text-[var(--color-muted)] transition-colors hover:text-[var(--color-foreground)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-foreground)]"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <h3 id="modal-title" className="mt-4 font-serif text-2xl font-medium tracking-tight text-[var(--color-foreground)]">
          {title}
        </h3>

        <p className="mt-3 text-sm leading-relaxed text-[var(--color-muted)]">
          {message}
        </p>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-[var(--color-foreground)] px-4 py-2 text-sm font-medium text-[var(--color-background)] transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-foreground)]"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
}
