import { WorkspaceMockup } from "./WorkspaceMockup";

interface HeroProps {
  onStartClick: () => void;
}

export function Hero({ onStartClick }: HeroProps) {
  return (
    <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28 lg:pt-24 lg:pb-32">
      {/* Decorative subtle ambient warm aura */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-96 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,var(--color-champagne-light),transparent)] opacity-70"
        aria-hidden="true"
      />

      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
        {/* Editorial Heading Column */}
        <div className="mx-auto max-w-3xl text-center">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-ivory)] px-4 py-1.5 text-[11px] font-medium tracking-[0.2em] uppercase text-[var(--color-taupe)]">
            Wedding planning, reimagined
          </div>

          {/* Headline */}
          <h1 className="mt-8 font-serif text-4xl font-normal tracking-tight text-[var(--color-foreground)] sm:text-6xl lg:text-7xl leading-[1.08]">
            Your wedding.
            <br />
            Your people.
            <br />
            <span className="italic font-normal">All in one place.</span>
          </h1>

          {/* Supporting Copy */}
          <p className="mt-6 text-base leading-relaxed text-[var(--color-muted)] sm:text-lg sm:leading-8 max-w-2xl mx-auto">
            Bring your guests, celebrations, plans, and little details together in one thoughtful space. Less chaos, more time for what matters.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <button
              type="button"
              onClick={onStartClick}
              className="w-full sm:w-auto rounded-full bg-[var(--color-foreground)] px-8 py-3.5 text-sm font-medium text-[var(--color-background)] transition-all hover:opacity-90 active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-foreground)] shadow-xs"
            >
              Start your wedding
            </button>
            <a
              href="#features"
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-7 py-3.5 text-sm font-medium text-[var(--color-foreground)] transition-colors hover:bg-[var(--color-ivory)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-foreground)]"
            >
              Explore the features
            </a>
          </div>

          <p className="mt-4 text-xs tracking-wide text-[var(--color-taupe)]">
            Always free • No credit card • No subscriptions
          </p>
        </div>

        {/* Hero Visual Mockup */}
        <div className="mt-14 sm:mt-20">
          <WorkspaceMockup />
        </div>
      </div>
    </section>
  );
}
