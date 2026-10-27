export function WorkspaceMockup() {
  return (
    <div className="relative mx-auto w-full max-w-5xl">
      {/* Subtle background elevation */}
      <div className="relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_20px_50px_-20px_rgba(0,0,0,0.07)] transition-all">
        {/* Workspace Top Bar */}
        <div className="flex flex-wrap items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-ivory)] px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-taupe)]" />
            <span className="font-serif text-sm tracking-wide text-[var(--color-foreground)]">
              Clara &amp; Arjun&apos;s Celebration
            </span>
            <span className="hidden text-xs text-[var(--color-muted)] sm:inline-block">
              • October 17, 2026
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs text-[var(--color-muted)]">
            <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 font-mono text-[11px]">
              184 Days to Ceremony
            </span>
            <span className="hidden font-mono text-[11px] text-[var(--color-taupe)] md:inline-block">
              Free Platform
            </span>
          </div>
        </div>

        {/* Workspace Main Grid */}
        <div className="grid grid-cols-1 gap-6 p-6 sm:p-8 lg:grid-cols-12 bg-[var(--color-surface)]">
          {/* Guest Registry Module (5 cols) */}
          <div className="flex flex-col justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-ivory)]/40 p-5 lg:col-span-5">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-taupe)]">
                  Guest Registry &amp; RSVPs
                </span>
                <span className="font-mono text-xs text-[var(--color-foreground)]">
                  148 / 165 Confirmed
                </span>
              </div>

              {/* Attendance Progress indicator */}
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-border)]">
                <div className="h-full w-[90%] rounded-full bg-[var(--color-foreground)]" />
              </div>

              {/* Breakdown Tags */}
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <span className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 text-[var(--color-foreground)]">
                  142 Attending
                </span>
                <span className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 text-[var(--color-muted)]">
                  17 Awaiting
                </span>
                <span className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 text-[var(--color-muted)]">
                  14 Dietary Noted
                </span>
              </div>

              {/* Sample guest rows */}
              <div className="mt-5 space-y-2.5">
                <div className="flex items-center justify-between rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-2.5 text-xs">
                  <div>
                    <p className="font-medium text-[var(--color-foreground)]">Eleanor &amp; Thomas Vance</p>
                    <p className="text-[11px] text-[var(--color-muted)]">Table 02 • Attending All Events</p>
                  </div>
                  <span className="rounded bg-[var(--color-champagne-light)] px-2 py-0.5 text-[10px] font-medium text-[var(--color-foreground)]">
                    Confirmed
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-2.5 text-xs">
                  <div>
                    <p className="font-medium text-[var(--color-foreground)]">Liam Campbell + Guest</p>
                    <p className="text-[11px] text-[var(--color-muted)]">Table 04 • Dietary: Nut Allergy</p>
                  </div>
                  <span className="rounded bg-[var(--color-champagne-light)] px-2 py-0.5 text-[10px] font-medium text-[var(--color-foreground)]">
                    Confirmed
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-2.5 text-xs">
                  <div>
                    <p className="font-medium text-[var(--color-foreground)]">Maya Patel</p>
                    <p className="text-[11px] text-[var(--color-muted)]">Dietary: Vegan • Shuttle Requested</p>
                  </div>
                  <span className="rounded bg-[var(--color-champagne-light)] px-2 py-0.5 text-[10px] font-medium text-[var(--color-foreground)]">
                    Confirmed
                  </span>
                </div>
              </div>
            </div>

            <p className="mt-4 text-[11px] text-[var(--color-muted)]">
              Multi-event guest tracking and dietary registry
            </p>
          </div>

          {/* Schedule & Events Module (4 cols) */}
          <div className="flex flex-col justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 lg:col-span-4">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-taupe)]">
                  Itinerary &amp; Timeline
                </span>
                <span className="text-xs font-mono text-[var(--color-muted)]">
                  3 Events
                </span>
              </div>

              <div className="mt-4 space-y-3">
                <div className="border-l-2 border-[var(--color-taupe)] pl-3">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-muted)]">
                    Friday 18:30
                  </span>
                  <p className="text-xs font-medium text-[var(--color-foreground)]">
                    Welcome Dinner &amp; Wine
                  </p>
                  <p className="text-[11px] text-[var(--color-muted)]">Villa Terrace Lawn</p>
                </div>

                <div className="border-l-2 border-[var(--color-foreground)] pl-3">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-taupe)]">
                    Saturday 15:30
                  </span>
                  <p className="text-xs font-medium text-[var(--color-foreground)]">
                    Ceremony &amp; Vows
                  </p>
                  <p className="text-[11px] text-[var(--color-muted)]">The Olive Grove Arch</p>
                </div>

                <div className="border-l-2 border-[var(--color-border)] pl-3">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-muted)]">
                    Sunday 11:00
                  </span>
                  <p className="text-xs font-medium text-[var(--color-foreground)]">
                    Farewell Tuscan Brunch
                  </p>
                  <p className="text-[11px] text-[var(--color-muted)]">Courtyard Pavilion</p>
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-ivory)]/50 p-2.5 text-xs">
              <span className="font-serif italic text-[var(--color-foreground)]">
                &ldquo;Every guest receives a personal digital schedule.&rdquo;
              </span>
            </div>
          </div>

          {/* Collaboration & Milestones (3 cols) */}
          <div className="flex flex-col justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-ivory)]/40 p-5 lg:col-span-3">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-taupe)]">
                Planning Milestones
              </span>

              <div className="mt-4 space-y-3">
                <div className="flex items-start gap-2.5 text-xs">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[var(--color-foreground)] text-[9px] text-[var(--color-background)]">
                    ✓
                  </span>
                  <div>
                    <p className="font-medium text-[var(--color-foreground)]">Digital Invitations</p>
                    <p className="text-[10px] text-[var(--color-muted)]">Dispatched to 165 guests</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 text-xs">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[var(--color-foreground)] text-[9px] text-[var(--color-background)]">
                    ✓
                  </span>
                  <div>
                    <p className="font-medium text-[var(--color-foreground)]">Menu Tasting</p>
                    <p className="text-[10px] text-[var(--color-muted)]">Courses confirmed</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 text-xs">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-[var(--color-border)] text-[9px] text-[var(--color-muted)]">
                    •
                  </span>
                  <div>
                    <p className="font-medium text-[var(--color-foreground)]">Table Seating Plan</p>
                    <p className="text-[10px] text-[var(--color-muted)]">12 of 16 tables ready</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 border-t border-[var(--color-border-subtle)] pt-3 text-[11px] text-[var(--color-muted)]">
              Shared with 4 family collaborators
            </div>
          </div>
        </div>

        {/* Bottom Editorial Caption */}
        <div className="border-t border-[var(--color-border-subtle)] bg-[var(--color-surface)] px-6 py-3 text-center text-xs text-[var(--color-muted)]">
          Conceptual preview of future wedding workspace • Designed for clarity and serenity
        </div>
      </div>
    </div>
  );
}
