export function Footer() {
  const currentYear = 2026;

  const internalLinks = [
    { label: "Features", href: "#features" },
    { label: "How it works", href: "#how-it-works" },
    { label: "Our philosophy", href: "#philosophy" },
    { label: "Back to top", href: "#top" },
  ];

  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-background)] py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
        <div className="flex flex-col justify-between gap-10 md:flex-row md:items-start">
          {/* Brand & Mission Statement */}
          <div className="max-w-md">
            <a
              href="#top"
              className="inline-block font-serif text-2xl font-normal tracking-tight text-[var(--color-foreground)] transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-foreground)] rounded-sm"
              aria-label="Wedora home"
            >
              Wedora
            </a>
            <p className="mt-3 text-sm leading-relaxed text-[var(--color-muted)]">
              A minimalist, all-in-one wedding management platform built to help couples and families coordinate their celebrations with calm and care.
            </p>
            <p className="mt-4 text-xs text-[var(--color-taupe)]">
              Wedora is being built to be free for everyone — without subscriptions, advertisements, or premium tiers.
            </p>
          </div>

          {/* Navigation Links */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-taupe)]">
              Navigation
            </span>
            <ul className="flex flex-col gap-2.5">
              {internalLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-[var(--color-muted)] transition-colors hover:text-[var(--color-foreground)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-foreground)] rounded-sm"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom border & copyright */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-[var(--color-border-subtle)] pt-8 sm:flex-row text-xs text-[var(--color-muted)]">
          <p>© {currentYear} Wedora. All rights reserved.</p>
          <p>Phase 2 • Public Landing Page</p>
        </div>
      </div>
    </footer>
  );
}
