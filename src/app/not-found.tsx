import Link from "next/link";

export default function GlobalNotFound() {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-[var(--color-background)] px-6 py-12 sm:px-8">
      <div className="mx-auto w-full max-w-xl">
        <Link
          href="/"
          className="font-serif text-2xl tracking-tight text-[var(--color-foreground)] hover:opacity-80 transition-opacity"
        >
          Wedora
        </Link>
      </div>

      <main className="mx-auto w-full max-w-xl text-center py-12">
        <span className="text-[11px] font-mono uppercase tracking-widest text-[var(--color-taupe)]">
          404 • Page Not Found
        </span>
        <h1 className="mt-4 font-serif text-4xl font-normal tracking-tight text-[var(--color-foreground)] sm:text-5xl">
          We couldn&apos;t find that page
        </h1>
        <p className="mt-4 text-base leading-relaxed text-[var(--color-muted)] max-w-md mx-auto">
          The page you requested does not exist or may have moved.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/"
            className="rounded-full bg-[var(--color-foreground)] px-6 py-3 text-sm font-medium text-[var(--color-background)] hover:opacity-90 transition-opacity w-full sm:w-auto"
          >
            Wedora Home
          </Link>
          <Link
            href="/weddings"
            className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-3 text-sm font-medium text-[var(--color-foreground)] hover:bg-[var(--color-ivory)] transition-colors w-full sm:w-auto"
          >
            Your Weddings
          </Link>
        </div>
      </main>

      <div className="mx-auto w-full max-w-xl text-center text-xs text-[var(--color-taupe)]">
        Wedora • Private, Calm Wedding Planning
      </div>
    </div>
  );
}
