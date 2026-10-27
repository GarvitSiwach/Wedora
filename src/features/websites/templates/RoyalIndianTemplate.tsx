import { PublicEventItem } from "@/types";

interface TemplateProps {
  title: string;
  coupleNames: string;
  welcomeMessage?: string | null;
  story?: string | null;
  venueDisplay?: string | null;
  dateDisplay?: string | null;
  events: PublicEventItem[];
  isPreview?: boolean;
}

export function RoyalIndianTemplate({
  title,
  coupleNames,
  welcomeMessage,
  story,
  venueDisplay,
  dateDisplay,
  events,
  isPreview = false,
}: TemplateProps) {
  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return null;
    const [hours, minutes] = timeStr.split(":");
    const h = parseInt(hours, 10);
    const m = minutes || "00";
    const ampm = h >= 12 ? "PM" : "AM";
    const formattedH = h % 12 === 0 ? 12 : h % 12;
    return `${formattedH}:${m} ${ampm}`;
  };

  const formattedDate = dateDisplay
    ? new Date(dateDisplay.includes("T") ? dateDisplay : `${dateDisplay}T00:00:00`).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <div className={`min-h-screen bg-[#fcfaf6] text-[#2c1810] selection:bg-[#f2e6cf] ${isPreview ? "rounded-xl border border-[#e8dfcf]" : ""}`}>
      {/* Top Ornamental Header */}
      <header className="border-b border-[#e8dfcf] bg-[#4a0e17] py-3 text-center text-[#d4af37]">
        <div className="flex items-center justify-center gap-2 text-[11px] font-mono uppercase tracking-[0.3em]">
          <span>✦</span>
          <span>Shubh Vivaah • Wedding Celebration</span>
          <span>✦</span>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-6 py-20 sm:py-28 lg:py-36 text-center max-w-4xl mx-auto overflow-hidden">
        {/* Subtle decorative gold motif */}
        <div className="mx-auto mb-6 flex items-center justify-center gap-3 text-[#c5a059]">
          <span className="h-px w-12 bg-[#c5a059]/40" />
          <span className="text-sm">ॐ</span>
          <span className="h-px w-12 bg-[#c5a059]/40" />
        </div>

        <span className="text-xs font-mono uppercase tracking-widest text-[#8c5040]">
          With the blessings of our elders and families
        </span>

        <h1 className="mt-5 font-serif text-5xl sm:text-7xl lg:text-8xl font-normal text-[#4a0e17] tracking-tight leading-[1.1]">
          {coupleNames}
        </h1>

        <div className="mt-6 flex items-center justify-center gap-3 text-[#c5a059]">
          <span className="h-px w-16 bg-[#c5a059]/50" />
          <span className="text-xs">✦</span>
          <span className="h-px w-16 bg-[#c5a059]/50" />
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm text-[#5c3a21] font-medium">
          {formattedDate && <span>{formattedDate}</span>}
          {formattedDate && venueDisplay && <span>•</span>}
          {venueDisplay && <span>{venueDisplay}</span>}
        </div>

        {welcomeMessage && (
          <p className="mt-8 text-base sm:text-lg leading-relaxed text-[#684b35] max-w-2xl mx-auto font-light">
            {welcomeMessage}
          </p>
        )}
      </section>

      {/* Story Section */}
      {story && (
        <section className="border-y border-[#e8dfcf] px-6 py-20 bg-white">
          <div className="max-w-2xl mx-auto text-center">
            <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#c5a059]">
              Our Story
            </span>
            <h2 className="mt-2 font-serif text-3xl sm:text-4xl font-normal text-[#4a0e17]">
              Two Families, One Journey
            </h2>
            <div className="mt-6 text-sm sm:text-base leading-relaxed text-[#684b35] whitespace-pre-line text-left">
              {story}
            </div>
          </div>
        </section>
      )}

      {/* Celebration Events / Itinerary */}
      {events.length > 0 && (
        <section className="px-6 py-20 bg-[#fbf7f0]">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-14">
              <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#c5a059]">
                Festivities & Ceremonies
              </span>
              <h2 className="mt-2 font-serif text-3xl sm:text-4xl font-normal text-[#4a0e17]">
                Wedding Itinerary
              </h2>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              {events.map((event) => {
                const eventFormattedDate = event.event_date
                  ? new Date(`${event.event_date}T00:00:00`).toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })
                  : null;

                const startTime = formatTime(event.start_time);
                const endTime = formatTime(event.end_time);

                return (
                  <article
                    key={event.id}
                    className="rounded-2xl border border-[#e8dfcf] bg-white p-6 shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 border-b border-[#f2e6cf] pb-3">
                        <span className="text-[11px] font-mono text-[#8c5040] uppercase tracking-wider">
                          {eventFormattedDate || "Celebration"}
                        </span>
                        {(startTime || endTime) && (
                          <span className="rounded-full bg-[#fcfaf6] border border-[#e8dfcf] px-2.5 py-0.5 text-[10px] font-mono text-[#4a0e17]">
                            {startTime}
                            {endTime ? ` – ${endTime}` : ""}
                          </span>
                        )}
                      </div>

                      <h3 className="mt-4 font-serif text-2xl font-normal text-[#4a0e17]">
                        {event.title}
                      </h3>

                      {event.location && (
                        <p className="mt-2 text-xs text-[#8c5040] flex items-center gap-1.5">
                          <span>📍</span> {event.location}
                        </p>
                      )}

                      {event.description && (
                        <p className="mt-3 text-xs leading-relaxed text-[#684b35]">
                          {event.description}
                        </p>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Royal Footer */}
      <footer className="border-t border-[#e8dfcf] bg-[#4a0e17] py-12 text-center text-xs text-[#d4af37]">
        <p className="font-serif text-lg text-white">{title}</p>
        <p className="mt-2 text-[11px] text-[#c5a059]">
          Hosted with Wedora • 100% Free Wedding Platform
        </p>
      </footer>
    </div>
  );
}
