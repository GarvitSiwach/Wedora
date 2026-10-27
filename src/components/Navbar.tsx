"use client";

import { useState } from "react";

interface NavbarProps {
  onStartClick: () => void;
  onSignInClick: () => void;
}

export function Navbar({ onStartClick, onSignInClick }: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: "Features", href: "#features" },
    { label: "How it works", href: "#how-it-works" },
    { label: "Our philosophy", href: "#philosophy" },
  ];

  const handleLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[var(--color-border)] bg-[var(--color-background)]/90 backdrop-blur-md transition-colors">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 sm:px-8 lg:px-12">
        {/* Wordmark */}
        <a
          href="#top"
          className="group flex items-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-foreground)] rounded-sm"
          aria-label="Wedora home"
        >
          <span className="font-serif text-2xl font-normal tracking-tight text-[var(--color-foreground)] sm:text-3xl transition-opacity group-hover:opacity-80">
            Wedora
          </span>
          <span className="hidden text-[10px] font-medium uppercase tracking-widest text-[var(--color-taupe)] sm:inline-block">
            Free Platform
          </span>
        </a>

        {/* Desktop Navigation Links */}
        <nav aria-label="Main Navigation" className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-[var(--color-muted)] transition-colors hover:text-[var(--color-foreground)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-foreground)] rounded-sm"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Desktop Action CTAs */}
        <div className="hidden md:flex items-center gap-4">
          <button
            type="button"
            onClick={onSignInClick}
            className="text-sm font-medium text-[var(--color-muted)] transition-colors hover:text-[var(--color-foreground)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-foreground)] px-2 py-1.5 rounded-sm"
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={onStartClick}
            className="rounded-full bg-[var(--color-foreground)] px-5 py-2.5 text-sm font-medium text-[var(--color-background)] transition-all hover:opacity-90 active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-foreground)]"
          >
            Start your wedding
          </button>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden items-center gap-2">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-navigation"
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            className="inline-flex items-center justify-center rounded-lg p-2 text-[var(--color-foreground)] hover:bg-[var(--color-ivory)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-foreground)]"
          >
            {isMobileMenuOpen ? (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {isMobileMenuOpen && (
        <div
          id="mobile-navigation"
          className="border-b border-[var(--color-border)] bg-[var(--color-background)] px-6 py-6 md:hidden transition-all duration-200"
        >
          <nav aria-label="Mobile Navigation" className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={handleLinkClick}
                className="text-base font-medium text-[var(--color-foreground)] hover:text-[var(--color-taupe)] transition-colors py-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-foreground)] rounded-sm"
              >
                {link.label}
              </a>
            ))}
            <div className="mt-4 flex flex-col gap-3 pt-4 border-t border-[var(--color-border-subtle)]">
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onSignInClick();
                }}
                className="w-full text-left py-2 text-base font-medium text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors"
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onStartClick();
                }}
                className="w-full rounded-full bg-[var(--color-foreground)] py-3 text-center text-sm font-medium text-[var(--color-background)] transition-opacity hover:opacity-90"
              >
                Start your wedding
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
