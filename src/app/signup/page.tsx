"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignUpPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessNotice(null);

    if (!fullName.trim() || !email || !password) {
      setErrorMessage("Please complete all required fields.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    startTransition(async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName.trim(),
            },
          },
        });

        if (error) {
          setErrorMessage(error.message);
          return;
        }

        // If email confirmation is enabled and no session is returned immediately:
        if (data?.user && !data?.session) {
          setSuccessNotice(
            "Account created! Please check your email to confirm your account before signing in."
          );
          return;
        }

        // Session returned directly: proceed to create wedding
        router.push("/weddings/new");
        router.refresh();
      } catch {
        setErrorMessage("An unexpected error occurred. Please try again.");
      }
    });
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[var(--color-background)] px-6 py-12 sm:px-8">
      {/* Top Header Wordmark */}
      <div className="mx-auto w-full max-w-md">
        <Link
          href="/"
          className="inline-block font-serif text-2xl tracking-tight text-[var(--color-foreground)] transition-opacity hover:opacity-80"
        >
          Wedora
        </Link>
      </div>

      {/* Main Sign Up Card */}
      <main className="mx-auto w-full max-w-md">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-xs sm:p-10">
          <div className="text-center">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-taupe)]">
              Begin Your Journey
            </span>
            <h1 className="mt-2 font-serif text-3xl font-medium tracking-tight text-[var(--color-foreground)]">
              Create your account
            </h1>
            <p className="mt-2 text-sm text-[var(--color-muted)]">
              Always free. No credit card required.
            </p>
          </div>

          {errorMessage && (
            <div
              role="alert"
              className="mt-6 rounded-lg border border-red-200 bg-red-50/70 p-3.5 text-xs text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
            >
              {errorMessage}
            </div>
          )}

          {successNotice ? (
            <div className="mt-6 rounded-lg border border-[var(--color-border)] bg-[var(--color-ivory)] p-5 text-center">
              <span className="font-serif text-lg text-[var(--color-foreground)]">
                Check your inbox
              </span>
              <p className="mt-2 text-xs leading-relaxed text-[var(--color-muted)]">
                {successNotice}
              </p>
              <div className="mt-6">
                <Link
                  href="/login"
                  className="inline-block rounded-full bg-[var(--color-foreground)] px-6 py-2.5 text-xs font-medium text-[var(--color-background)]"
                >
                  Return to sign in
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <div>
                <label
                  htmlFor="fullName"
                  className="block text-xs font-medium uppercase tracking-wider text-[var(--color-foreground)]"
                >
                  Your full name
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Clara Dupont"
                  className="mt-2 block w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3.5 py-2.5 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-taupe-muted)] focus:border-[var(--color-foreground)] focus:outline-hidden"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-medium uppercase tracking-wider text-[var(--color-foreground)]"
                >
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="mt-2 block w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3.5 py-2.5 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-taupe-muted)] focus:border-[var(--color-foreground)] focus:outline-hidden"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-medium uppercase tracking-wider text-[var(--color-foreground)]"
                >
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="mt-2 block w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3.5 py-2.5 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-taupe-muted)] focus:border-[var(--color-foreground)] focus:outline-hidden"
                />
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-xs font-medium uppercase tracking-wider text-[var(--color-foreground)]"
                >
                  Confirm password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="mt-2 block w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3.5 py-2.5 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-taupe-muted)] focus:border-[var(--color-foreground)] focus:outline-hidden"
                />
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full rounded-full bg-[var(--color-foreground)] py-3 text-center text-sm font-medium text-[var(--color-background)] transition-opacity hover:opacity-90 disabled:opacity-50 mt-2"
              >
                {isPending ? "Creating account..." : "Create account"}
              </button>
            </form>
          )}

          <div className="mt-8 border-t border-[var(--color-border-subtle)] pt-6 text-center text-xs text-[var(--color-muted)]">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-[var(--color-foreground)] underline underline-offset-4 hover:opacity-80"
            >
              Sign in
            </Link>
          </div>
        </div>
      </main>

      {/* Footer minimal info */}
      <div className="mx-auto w-full max-w-md text-center text-xs text-[var(--color-taupe)]">
        Wedora • Purely free wedding management
      </div>
    </div>
  );
}
