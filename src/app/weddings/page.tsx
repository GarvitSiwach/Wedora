import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "./SignOutButton";

export const metadata = {
  title: "Your Weddings — Wedora",
  description: "View and manage your wedding workspaces on Wedora.",
};

interface WeddingMemberItem {
  role: string;
  wedding: {
    id: string;
    title: string;
    slug: string | null;
    wedding_date: string | null;
    location: string | null;
    created_at: string;
  } | null;
}

async function UserHeaderNav() {
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const displayName = profile?.full_name?.trim() || user.email?.split("@")[0] || "Planner";

  return (
    <div className="flex items-center gap-4">
      <div className="hidden sm:flex flex-col items-end">
        <span className="text-xs font-medium text-[var(--color-foreground)]">
          {displayName}
        </span>
        <span className="text-[11px] text-[var(--color-taupe-muted)]">
          {user.email}
        </span>
      </div>
      <div className="h-4 w-px bg-[var(--color-border)] hidden sm:block" />
      <SignOutButton />
    </div>
  );
}

async function WeddingsList() {
  await connection();
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login?next=/weddings");
  }

  // Fetch weddings the user belongs to via wedding_members
  const { data: rawMemberships, error: weddingsError } = await supabase
    .from("wedding_members")
    .select(`
      role,
      wedding:weddings (
        id,
        title,
        slug,
        wedding_date,
        location,
        created_at
      )
    `)
    .eq("user_id", user.id);

  const memberships = (rawMemberships as unknown as WeddingMemberItem[]) || [];

  if (weddingsError) {
    return (
      <div
        role="alert"
        className="rounded-lg border border-red-200 bg-red-50/70 p-4 text-xs text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
      >
        Could not load weddings: {weddingsError.message}
      </div>
    );
  }

  if (memberships.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)]/50 p-12 text-center sm:p-16">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-ivory)] text-[var(--color-taupe)]">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </div>
        <h2 className="mt-4 font-serif text-xl font-normal text-[var(--color-foreground)]">
          No weddings created yet
        </h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-[var(--color-muted)]">
          Start your journey by creating your first wedding workspace. You will automatically be assigned as the owner.
        </p>
        <div className="mt-6">
          <Link
            href="/weddings/new"
            className="inline-flex items-center rounded-full bg-[var(--color-foreground)] px-6 py-2.5 text-sm font-medium text-[var(--color-background)] hover:opacity-90 transition-opacity"
          >
            Create a Wedding
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {memberships.map((item) => {
        const wedding = item.wedding;
        if (!wedding) return null;

        return (
          <article
            key={wedding.id}
            className="group flex flex-col justify-between rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-xs transition-all hover:border-[var(--color-foreground)]/30 hover:shadow-md"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center rounded-full border border-[var(--color-border)] bg-[var(--color-ivory)] px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-[var(--color-taupe)]">
                  {item.role}
                </span>
                {wedding.wedding_date && (
                  <span className="text-[11px] text-[var(--color-taupe)] font-mono">
                    {new Date(wedding.wedding_date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                )}
              </div>

              <h2 className="mt-4 font-serif text-2xl font-normal tracking-tight text-[var(--color-foreground)] group-hover:text-[var(--color-foreground)]/90">
                <Link href={`/weddings/${wedding.id}`} className="hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-foreground)] rounded-xs">
                  {wedding.title}
                </Link>
              </h2>

              {wedding.location && (
                <p className="mt-2 text-xs text-[var(--color-muted)] flex items-center gap-1.5">
                  <svg className="h-3.5 w-3.5 text-[var(--color-taupe)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                  {wedding.location}
                </p>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-[var(--color-border-subtle)] flex items-center justify-between">
              <span className="text-[10px] text-[var(--color-taupe-muted)]">
                Created {new Date(wedding.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
              </span>
              <Link
                href={`/weddings/${wedding.id}`}
                className="text-xs font-medium text-[var(--color-foreground)] group-hover:underline inline-flex items-center gap-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-foreground)] rounded-xs"
              >
                View details &rarr;
              </Link>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function WeddingsSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {[1, 2].map((i) => (
        <div
          key={i}
          className="h-48 animate-pulse rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6"
        />
      ))}
    </div>
  );
}

export default function WeddingsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-background)]">
      {/* Top App Header */}
      <header className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-[var(--color-surface)]/95 px-6 py-4 backdrop-blur-md sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="group flex items-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-foreground)] rounded-sm"
            >
              <span className="font-serif text-2xl font-normal tracking-tight text-[var(--color-foreground)] transition-opacity group-hover:opacity-80">
                Wedora
              </span>
            </Link>
            <span className="hidden text-xs text-[var(--color-taupe)] sm:inline-block">
              / Workspaces
            </span>
          </div>

          <Suspense fallback={<div className="h-8 w-24 animate-pulse rounded bg-[var(--color-ivory)]" />}>
            <UserHeaderNav />
          </Suspense>
        </div>
      </header>

      {/* Main Dashboard Section */}
      <main className="flex-1 px-6 py-12 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-6xl">
          {/* Page Heading & Actions */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-[var(--color-border-subtle)] pb-8">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-taupe)]">
                Wedora Workspace
              </span>
              <h1 className="mt-2 font-serif text-3xl font-normal tracking-tight text-[var(--color-foreground)] sm:text-4xl">
                Your Weddings & Celebrations
              </h1>
              <p className="mt-2 text-sm text-[var(--color-muted)] max-w-xl">
                Manage your wedding workspaces, schedules, and details. Free forever, no paywalls.
              </p>
            </div>

            <div>
              <Link
                href="/weddings/new"
                className="inline-flex items-center justify-center rounded-full bg-[var(--color-foreground)] px-6 py-2.5 text-sm font-medium text-[var(--color-background)] transition-all hover:opacity-90 active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-foreground)] shadow-xs"
              >
                + New Wedding
              </Link>
            </div>
          </div>

          {/* Wedding Cards Grid or Empty State with Suspense streaming */}
          <div className="mt-10">
            <Suspense fallback={<WeddingsSkeleton />}>
              <WeddingsList />
            </Suspense>
          </div>
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="border-t border-[var(--color-border)] py-6 text-center text-xs text-[var(--color-taupe)]">
        Wedora • Private, Calm, Free Wedding Planning
      </footer>
    </div>
  );
}
