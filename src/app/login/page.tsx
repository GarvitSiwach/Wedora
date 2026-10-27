"use client";

import { Suspense, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/weddings";
  const callbackError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(
    callbackError ? "Authentication callback failed. Please try signing in again." : null
  );
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    startTransition(async () => {
      try {
        const supabase = createClient();
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setErrorMessage(error.message);
          return;
        }

        router.push(next);
        router.refresh();
      } catch {
        setErrorMessage("An unexpected error occurred. Please try again.");
      }
    });
  };

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-xs sm:p-10">
      <div className="text-center">
        <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-taupe)]">
          Welcome Back
        </span>
        <h1 className="mt-2 font-serif text-3xl font-medium tracking-tight text-[var(--color-foreground)]">
          Sign in to your wedding
        </h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Enter your email and password to access your workspace.
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

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
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
          <div className="flex items-center justify-between">
            <label
              htmlFor="password"
              className="block text-xs font-medium uppercase tracking-wider text-[var(--color-foreground)]"
            >
              Password
            </label>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="mt-2 block w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3.5 py-2.5 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-taupe-muted)] focus:border-[var(--color-foreground)] focus:outline-hidden"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-full bg-[var(--color-foreground)] py-3 text-center text-sm font-medium text-[var(--color-background)] transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {isPending ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <div className="mt-8 border-t border-[var(--color-border-subtle)] pt-6 text-center text-xs text-[var(--color-muted)]">
        Don&apos;t have a wedding yet?{" "}
        <Link
          href="/signup"
          className="font-medium text-[var(--color-foreground)] underline underline-offset-4 hover:opacity-80"
        >
          Create an account
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
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

      {/* Main Login Card with Suspense boundary for useSearchParams */}
      <main className="mx-auto w-full max-w-md">
        <Suspense
          fallback={
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center text-sm text-[var(--color-muted)]">
              Loading sign in...
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </main>

      {/* Footer minimal info */}
      <div className="mx-auto w-full max-w-md text-center text-xs text-[var(--color-taupe)]">
        Wedora • Completely free wedding planning
      </div>
    </div>
  );
}
