"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function NewWeddingPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [weddingDate, setWeddingDate] = useState("");
  const [location, setLocation] = useState("");
  const [slug, setSlug] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleTitleChange = (val: string) => {
    setTitle(val);
    // Auto-generate clean slug from title if user hasn't explicitly customized slug
    const generated = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 50);
    setSlug(generated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!title.trim()) {
      setErrorMessage("Please enter a wedding title.");
      return;
    }

    startTransition(async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          router.push("/login?next=/weddings/new");
          return;
        }

        const finalSlug = slug.trim()
          ? `${slug.trim()}-${Math.random().toString(36).substring(2, 6)}`
          : undefined;

        const { error: insertError } = await supabase
          .from("weddings")
          .insert({
            title: title.trim(),
            slug: finalSlug,
            wedding_date: weddingDate || null,
            location: location.trim() || null,
            creator_id: user.id,
          });

        if (insertError) {
          setErrorMessage(insertError.message);
          return;
        }

        // Success: the on_wedding_created trigger automatically assigned the user as owner
        router.push("/weddings");
        router.refresh();
      } catch {
        setErrorMessage("An unexpected error occurred while creating your wedding.");
      }
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-background)]">
      {/* Header Bar */}
      <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-4 sm:px-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link
            href="/weddings"
            className="font-serif text-2xl tracking-tight text-[var(--color-foreground)] hover:opacity-80"
          >
            Wedora
          </Link>
          <Link
            href="/weddings"
            className="text-xs font-medium text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
          >
            Cancel
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-6 py-12 sm:px-8">
        <div className="mx-auto max-w-xl">
          <div className="text-center">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-taupe)]">
              Phase 3 • New Wedding
            </span>
            <h1 className="mt-2 font-serif text-3xl font-medium tracking-tight text-[var(--color-foreground)] sm:text-4xl">
              Create your wedding workspace
            </h1>
            <p className="mt-2 text-sm text-[var(--color-muted)]">
              You will automatically become the owner of this workspace.
            </p>
          </div>

          <div className="mt-8 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-xs sm:p-10">
            {errorMessage && (
              <div
                role="alert"
                className="mb-6 rounded-lg border border-red-200 bg-red-50/70 p-3.5 text-xs text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
              >
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="weddingTitle"
                  className="block text-xs font-medium uppercase tracking-wider text-[var(--color-foreground)]"
                >
                  Wedding Title <span className="text-red-500">*</span>
                </label>
                <input
                  id="weddingTitle"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="e.g. Clara & Arjun's Celebration"
                  className="mt-2 block w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3.5 py-2.5 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-taupe-muted)] focus:border-[var(--color-foreground)] focus:outline-hidden"
                />
              </div>

              <div>
                <label
                  htmlFor="weddingDate"
                  className="block text-xs font-medium uppercase tracking-wider text-[var(--color-foreground)]"
                >
                  Celebration Date (Optional)
                </label>
                <input
                  id="weddingDate"
                  type="date"
                  value={weddingDate}
                  onChange={(e) => setWeddingDate(e.target.value)}
                  className="mt-2 block w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3.5 py-2.5 text-sm text-[var(--color-foreground)] focus:border-[var(--color-foreground)] focus:outline-hidden"
                />
              </div>

              <div>
                <label
                  htmlFor="weddingLocation"
                  className="block text-xs font-medium uppercase tracking-wider text-[var(--color-foreground)]"
                >
                  Location / Venue (Optional)
                </label>
                <input
                  id="weddingLocation"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Florence, Italy"
                  className="mt-2 block w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3.5 py-2.5 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-taupe-muted)] focus:border-[var(--color-foreground)] focus:outline-hidden"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full rounded-full bg-[var(--color-foreground)] py-3 text-center text-sm font-medium text-[var(--color-background)] transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {isPending ? "Creating workspace..." : "Create wedding workspace"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
