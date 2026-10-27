export function HowItWorks() {
  const steps = [
    {
      number: "01",
      title: "Create your wedding",
      description: "Set up your wedding workspace with key dates, locations, and personal celebration preferences.",
    },
    {
      number: "02",
      title: "Bring your people together",
      description: "Invite family members, delegate responsibilities, and organise your guest list and RSVPs effortlessly.",
    },
    {
      number: "03",
      title: "Plan everything in one place",
      description: "Keep track of the details as your day comes together — from multi-event timelines to dietary notes.",
    },
  ];

  return (
    <section id="how-it-works" className="scroll-mt-24 border-t border-[var(--color-border)] bg-[var(--color-ivory)] py-20 sm:py-28 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--color-taupe)]">
            Simple Process
          </span>
          <h2 className="mt-4 font-serif text-3xl font-normal tracking-tight text-[var(--color-foreground)] sm:text-5xl lg:text-6xl leading-[1.12]">
            How it works
          </h2>
          <p className="mt-6 text-base leading-relaxed text-[var(--color-muted)] sm:text-lg sm:leading-8">
            Three simple steps designed to replace fragmented spreadsheets, multiple apps, and endless messaging threads.
          </p>
        </div>

        {/* 3-Step Journey Grid */}
        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3 relative">
          {steps.map((step, idx) => (
            <div
              key={step.number}
              className="relative flex flex-col justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 transition-all hover:border-[var(--color-taupe)]"
            >
              <div>
                <div className="flex items-baseline justify-between">
                  <span className="font-serif text-3xl font-light text-[var(--color-taupe)]">
                    {step.number}
                  </span>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--color-muted)]">
                    Step {idx + 1} of 3
                  </span>
                </div>

                <h3 className="mt-6 font-serif text-2xl font-medium tracking-tight text-[var(--color-foreground)]">
                  {step.title}
                </h3>

                <p className="mt-3 text-sm leading-relaxed text-[var(--color-muted)]">
                  {step.description}
                </p>
              </div>

              <div className="mt-8 pt-4 border-t border-[var(--color-border-subtle)] text-xs text-[var(--color-taupe)]">
                Intuitive setup • No technical expertise needed
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
