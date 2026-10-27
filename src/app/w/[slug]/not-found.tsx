import Link from "next/link";

export default function PublicWeddingNotFound() {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-[var(--color-background)] px-6 py-12 sm:px-8">
      <header className="mx-auto w-full max-w-xl">
        <Link
          href="/"
          className="font-serif text-2xl tracking-tight text-[var(--color-foreground)] hover:opacity-80 transition-opacity"
        >
          Wedora
        </Link>
      </header>

      <main className="mx-auto w-full max-w-xl text-center py-16">
        <span className="text-[11px] font-mono uppercase tracking-widest text-[var(--color-taupe)]">
          404 • Celebration Unavailable
        </span>
        <h1 className="mt-4 font-serif text-4xl font-normal tracking-tight text-[var(--color-foreground)] sm:text-5xl">
          Celebration Not Found or Unpublished
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-[var(--color-muted)] max-w-md mx-auto">
          This digital wedding invitation and celebration website is either not yet published by the couple, or the web address has changed.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/"
            className="rounded-full bg-[var(--color-foreground)] px-6 py-3 text-xs font-medium text-[var(--color-background)] hover:opacity-90 transition-opacity w-full sm:w-auto"
          >
            Visit Wedora Home
          </Link>
        </div>
      </main>

      <footer className="mx-auto w-full max-w-xl text-center text-xs text-[var(--color-taupe)]">
        Wedora • Private, Calm Wedding Celebrations
      </footer>
    </div>
  );
}
