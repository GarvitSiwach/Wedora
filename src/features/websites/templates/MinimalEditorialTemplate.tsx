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

export function MinimalEditorialTemplate({
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
    <div className={`min-h-screen bg-[#faf9f5] text-[#1a1918] selection:bg-[#e8dfd1] ${isPreview ? "rounded-xl border border-[#e8e5de]" : ""}`}>
      {/* Top Subtle Announcement */}
      <header className="border-b border-[#e8e5de] py-4 text-center">
        <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#8c827a]">
          Wedding Celebration
        </span>
      </header>

      {/* Hero Section */}
      <section className="px-6 py-20 sm:py-28 lg:py-36 text-center max-w-4xl mx-auto">
        <span className="text-xs font-mono uppercase tracking-widest text-[#8c827a]">
          Together with their families
        </span>

        <h1 className="mt-6 font-serif text-5xl sm:text-7xl lg:text-8xl font-normal tracking-tight text-[#1a1918] leading-[1.08]">
          {coupleNames}
        </h1>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm text-[#66635e]">
          {formattedDate && <span>{formattedDate}</span>}
          {formattedDate && venueDisplay && <span>•</span>}
          {venueDisplay && <span>{venueDisplay}</span>}
        </div>

        {welcomeMessage && (
          <p className="mt-10 text-base sm:text-lg leading-relaxed text-[#66635e] max-w-2xl mx-auto font-light">
            {welcomeMessage}
          </p>
        )}
      </section>

      {/* Story Section */}
      {story && (
        <section className="border-t border-[#e8e5de] px-6 py-20 bg-white">
          <div className="max-w-2xl mx-auto text-center">
            <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#8c827a]">
              Our Journey
            </span>
            <h2 className="mt-3 font-serif text-3xl sm:text-4xl font-normal text-[#1a1918]">
              How It Began
            </h2>
            <div className="mt-6 text-sm sm:text-base leading-relaxed text-[#66635e] whitespace-pre-line text-left">
              {story}
            </div>
          </div>
        </section>
      )}

      {/* Itinerary / Events Section */}
      {events.length > 0 && (
        <section className="border-t border-[#e8e5de] px-6 py-20 bg-[#faf9f5]">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-14">
              <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#8c827a]">
                Schedule of Events
              </span>
              <h2 className="mt-3 font-serif text-3xl sm:text-4xl font-normal text-[#1a1918]">
                Celebration Itinerary
              </h2>
            </div>

            <div className="divide-y divide-[#e8e5de]">
              {events.map((event) => {
                const eventFormattedDate = event.event_date
                  ? new Date(`${event.event_date}T00:00:00`).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "long",
                      day: "numeric",
                    })
                  : null;

                const startTime = formatTime(event.start_time);
                const endTime = formatTime(event.end_time);

                return (
                  <div key={event.id} className="py-8 grid sm:grid-cols-3 gap-4 items-start">
                    <div>
                      {eventFormattedDate && (
                        <p className="font-mono text-xs text-[#8c827a] uppercase tracking-wider">
                          {eventFormattedDate}
                        </p>
                      )}
                      {(startTime || endTime) && (
                        <p className="text-xs font-mono text-[#1a1918] mt-1">
                          {startTime}
                          {endTime ? ` – ${endTime}` : ""}
                        </p>
                      )}
                    </div>

                    <div className="sm:col-span-2">
                      <h3 className="font-serif text-2xl font-normal text-[#1a1918]">
                        {event.title}
                      </h3>
                      {event.location && (
                        <p className="mt-1 text-xs text-[#8c827a] flex items-center gap-1.5">
                          <span>📍</span> {event.location}
                        </p>
                      )}
                      {event.description && (
                        <p className="mt-3 text-xs leading-relaxed text-[#66635e]">
                          {event.description}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Elegant Minimal Footer */}
      <footer className="border-t border-[#e8e5de] py-12 text-center text-xs text-[#8c827a]">
        <p className="font-serif text-base text-[#1a1918]">{title}</p>
        <p className="mt-2 text-[11px] text-[#8c827a]">
          Created with Wedora • Calm, Ad-Free Wedding Planning
        </p>
      </footer>
    </div>
  );
}
