interface ClosingCtaProps {
  onStartClick: () => void;
}

export function ClosingCta({ onStartClick }: ClosingCtaProps) {
  return (
    <section className="relative overflow-hidden border-t border-[var(--color-border)] py-20 sm:py-28 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
        <div className="relative mx-auto max-w-4xl overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-ivory)] px-6 py-16 text-center sm:px-12 sm:py-20 lg:px-16">
          {/* Subtle ambient light */}
          <div
            className="pointer-events-none absolute inset-x-0 -top-24 h-64 bg-[radial-gradient(circle_at_50%_0%,var(--color-champagne),transparent)] opacity-60"
            aria-hidden="true"
          />

          <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--color-taupe)]">
            Begin with Wedora
          </span>

          <h2 className="mt-4 font-serif text-3xl font-normal tracking-tight text-[var(--color-foreground)] sm:text-5xl lg:text-6xl leading-[1.12]">
            Make room for what matters.
          </h2>

          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-[var(--color-muted)] sm:text-lg sm:leading-8">
            Spend less time coordinating the details and more time celebrating the people you love.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <button
              type="button"
              onClick={onStartClick}
              className="w-full sm:w-auto rounded-full bg-[var(--color-foreground)] px-8 py-3.5 text-sm font-medium text-[var(--color-background)] transition-all hover:opacity-90 active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-foreground)] shadow-xs"
            >
              Start your wedding
            </button>
          </div>

          <p className="mt-4 text-xs text-[var(--color-taupe)]">
            Wedora is in active development • 100% free for couples and families
          </p>
        </div>
      </div>
    </section>
  );
}
