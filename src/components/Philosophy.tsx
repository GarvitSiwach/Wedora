export function Philosophy() {
  const pillars = [
    {
      label: "Zero Subscriptions",
      description: "No monthly paywalls, expiring trials, or hidden fees. Every planning capability is open to all.",
    },
    {
      label: "Zero Advertisements",
      description: "An ad-free, serene environment for you and your guests. No sponsored popups or distractions.",
    },
    {
      label: "Zero Tiered Limits",
      description: "Unlimited guests, unlimited event timelines, and unlimited collaborators. No artificial restrictions.",
    },
  ];

  return (
    <section id="philosophy" className="relative scroll-mt-24 border-y border-[var(--color-border)] bg-[var(--color-ivory)] py-20 sm:py-28 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--color-taupe)]">
            Our Core Philosophy
          </span>

          <h2 className="mt-4 font-serif text-3xl font-normal tracking-tight text-[var(--color-foreground)] sm:text-5xl lg:text-6xl leading-[1.12]">
            Made for your day.
            <br />
            <span className="italic font-normal">Free for everyone.</span>
          </h2>

          <p className="mt-6 text-base leading-relaxed text-[var(--color-muted)] sm:text-lg sm:leading-8">
            Wedding planning should bring people together, not add another expense. Wedora is being built to give couples and families the tools to organise their celebrations without subscriptions, advertisements, or premium tiers.
          </p>
        </div>

        {/* The 3 Foundations */}
        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
          {pillars.map((pillar, index) => (
            <div
              key={pillar.label}
              className="relative rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 transition-all hover:border-[var(--color-taupe)]/50"
            >
              <span className="font-mono text-xs text-[var(--color-taupe)]">
                0{index + 1}
              </span>
              <h3 className="mt-3 font-serif text-xl font-medium tracking-tight text-[var(--color-foreground)]">
                {pillar.label}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">
                {pillar.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
