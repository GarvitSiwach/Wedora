import { PublicEventItem } from "@/types";
import { PublicRsvpSection } from "@/features/rsvp/PublicRsvpSection";

interface TemplateProps {
  title: string;
  coupleNames: string;
  welcomeMessage?: string | null;
  story?: string | null;
  venueDisplay?: string | null;
  dateDisplay?: string | null;
  events: PublicEventItem[];
  slug?: string;
  rsvpToken?: string | null;
  isPreview?: boolean;
}

export function BotanicalRomanceTemplate({
  title,
  coupleNames,
  welcomeMessage,
  story,
  venueDisplay,
  dateDisplay,
  events,
  slug,
  rsvpToken,
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
    <div className={`min-h-screen bg-[#f7f9f7] text-[#24332c] selection:bg-[#d8e4dc] ${isPreview ? "rounded-xl border border-[#d9e2dc]" : ""}`}>
      {/* Top Header */}
      <header className="border-b border-[#e1e9e3] py-4 text-center">
        <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#587366]">
          🌿 Wedding Celebration
        </span>
      </header>

      {/* Hero Section */}
      <section className="px-6 py-20 sm:py-28 lg:py-36 text-center max-w-4xl mx-auto">
        <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-[#d9e2dc] bg-white px-3 py-1 text-[11px] font-medium text-[#486355]">
          <span>🌿</span>
          <span>We are getting married</span>
        </div>

        <h1 className="mt-6 font-serif text-5xl sm:text-7xl lg:text-8xl font-normal text-[#283830] tracking-tight leading-[1.08]">
          {coupleNames}
        </h1>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm text-[#587366]">
          {formattedDate && <span>{formattedDate}</span>}
          {formattedDate && venueDisplay && <span>•</span>}
          {venueDisplay && <span>{venueDisplay}</span>}
        </div>

        {welcomeMessage && (
          <p className="mt-10 text-base sm:text-lg leading-relaxed text-[#516b5e] max-w-2xl mx-auto font-light">
            {welcomeMessage}
          </p>
        )}
      </section>

      {/* Story Section */}
      {story && (
        <section className="border-t border-[#e1e9e3] px-6 py-20 bg-white">
          <div className="max-w-2xl mx-auto text-center">
            <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#587366]">
              Our Story
            </span>
            <h2 className="mt-3 font-serif text-3xl sm:text-4xl font-normal text-[#283830]">
              Written in the Leaves
            </h2>
            <div className="mt-6 text-sm sm:text-base leading-relaxed text-[#516b5e] whitespace-pre-line text-left">
              {story}
            </div>
          </div>
        </section>
      )}

      {/* Itinerary / Events Section */}
      {events.length > 0 && (
        <section className="border-t border-[#e1e9e3] px-6 py-20 bg-[#f7f9f7]">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-14">
              <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#587366]">
                Itinerary
              </span>
              <h2 className="mt-3 font-serif text-3xl sm:text-4xl font-normal text-[#283830]">
                Schedule of the Day
              </h2>
            </div>

            <div className="space-y-4">
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
                    className="rounded-2xl border border-[#d9e2dc] bg-white p-6 shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 border-b border-[#eef3f0] pb-3">
                        <span className="text-[11px] font-mono text-[#587366] uppercase tracking-wider">
                          {eventFormattedDate || "Celebration"}
                        </span>
                        {(startTime || endTime) && (
                          <span className="rounded-full bg-[#f2f6f4] px-2.5 py-0.5 text-[10px] font-mono text-[#283830]">
                            {startTime}
                            {endTime ? ` – ${endTime}` : ""}
                          </span>
                        )}
                      </div>

                      <h3 className="mt-3 font-serif text-2xl font-normal text-[#283830]">
                        {event.title}
                      </h3>

                      {event.location && (
                        <p className="mt-1 text-xs text-[#587366] flex items-center gap-1.5">
                          <span>📍</span> {event.location}
                        </p>
                      )}

                      {event.description && (
                        <p className="mt-3 text-xs leading-relaxed text-[#516b5e]">
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

      {/* RSVP Section */}
      <PublicRsvpSection
        slug={slug || ""}
        initialToken={rsvpToken}
        template="botanical_romance"
        coupleNames={coupleNames}
      />

      {/* Botanical Footer */}
      <footer className="border-t border-[#e1e9e3] py-12 text-center text-xs text-[#587366]">
        <p className="font-serif text-base text-[#283830]">{title}</p>
        <p className="mt-2 text-[11px]">
          Created with Wedora • 100% Free Wedding Invitations
        </p>
      </footer>
    </div>
  );
}
