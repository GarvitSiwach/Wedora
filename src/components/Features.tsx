export function Features() {
  const features = [
    {
      title: "Guest lists and RSVPs",
      description:
        "Collect addresses, track real-time attendance across multiple events, and manage plus-ones in a single, effortless registry.",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a3.75 3.75 0 017.067-1.892 9.4 9.4 0 002.482.367c.732 0 1.442-.085 2.12-.246M12 7.5a3 3 0 11-6 0 3 3 0 016 0zm6 2.25a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
        </svg>
      ),
      badge: "Core Planning",
    },
    {
      title: "Invitations and wedding websites",
      description:
        "Craft digital invitations and personalized guest websites that match your celebration's aesthetic, with zero hosting fees.",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
        </svg>
      ),
      badge: "Guest Experience",
    },
    {
      title: "Events and schedules",
      description:
        "Coordinate welcome parties, ceremonies, toasts, and morning-after brunches with bespoke itineraries for each guest group.",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.253M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
      ),
      badge: "Logistics",
    },
    {
      title: "Food preferences",
      description:
        "Organize dietary needs, allergies, and custom course choices with clear exportable summaries ready for catering teams.",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-16.5-.52c-1.01.143-2.01.317-3 .52m16.5 0a48.667 48.667 0 013.75 3.107m-20.25-3.107A48.667 48.667 0 001.5 8.597m18.75 0c-.86 3.01-2.92 5.518-5.625 6.78M3.75 8.597c.86 3.01 2.92 5.518 5.625 6.78" />
        </svg>
      ),
      badge: "Hospitality",
    },
    {
      title: "Budget and planning",
      description:
        "Track expenses, vendor payment deadlines, and deposit milestones without confusing spreadsheets or paywalled formulas.",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      badge: "Coordination",
    },
    {
      title: "Family collaboration",
      description:
        "Delegate tasks and invite partners, parents, or wedding parties into specific sections with tailored permissions.",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.999-3.198a5.971 5.971 0 01-.94-3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
        </svg>
      ),
      badge: "Teamwork",
    },
  ];

  return (
    <section id="features" className="scroll-mt-24 py-20 sm:py-28 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--color-taupe)]">
            Platform Capabilities
          </span>
          <h2 className="mt-4 font-serif text-3xl font-normal tracking-tight text-[var(--color-foreground)] sm:text-5xl lg:text-6xl leading-[1.12]">
            Thoughtful tools for every detail.
          </h2>
          <p className="mt-6 text-base leading-relaxed text-[var(--color-muted)] sm:text-lg sm:leading-8">
            Every feature is being developed with an emphasis on calm, clarity, and ease of collaboration — without a single paywall.
          </p>
        </div>

        {/* Feature Grid with Restrained Visual Treatment */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group relative flex flex-col justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-7 transition-all duration-200 hover:border-[var(--color-taupe)]/60 hover:bg-[var(--color-ivory)]/30"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-ivory)] text-[var(--color-foreground)] transition-colors group-hover:border-[var(--color-taupe)]">
                    {feature.icon}
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-taupe)]">
                    {feature.badge}
                  </span>
                </div>

                <h3 className="mt-5 font-serif text-xl font-medium tracking-tight text-[var(--color-foreground)]">
                  {feature.title}
                </h3>

                <p className="mt-2.5 text-sm leading-relaxed text-[var(--color-muted)]">
                  {feature.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-[var(--color-border-subtle)] flex items-center justify-between text-[11px] text-[var(--color-taupe)]">
                <span>Planned capability</span>
                <span className="opacity-0 transition-opacity group-hover:opacity-100">→</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
