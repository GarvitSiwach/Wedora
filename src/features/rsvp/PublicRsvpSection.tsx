"use client";

import { useState, useEffect, useTransition } from "react";
import { WebsiteTemplate, PublicRsvpPayload, InvitationStatus } from "@/types";
import { createClient } from "@/lib/supabase/client";

interface PublicRsvpSectionProps {
  slug: string;
  initialToken?: string | null;
  template: WebsiteTemplate;
  coupleNames: string;
}

export function PublicRsvpSection({
  slug,
  initialToken,
  template,
  coupleNames,
}: PublicRsvpSectionProps) {
  const [token, setToken] = useState<string | null>(initialToken || null);
  const [manualTokenInput, setManualTokenInput] = useState("");
  const [loading, setLoading] = useState(!!initialToken);
  const [rsvpData, setRsvpData] = useState<PublicRsvpPayload | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Form states
  const [status, setStatus] = useState<"confirmed" | "declined">("confirmed");
  const [attendeeCount, setAttendeeCount] = useState<number>(1);
  const [mealPreference, setMealPreference] = useState<string>("");
  const [guestMessage, setGuestMessage] = useState<string>("");
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Template-specific style classes
  const styles = {
    minimal_editorial: {
      bg: "bg-[#faf9f5]",
      cardBg: "bg-white",
      border: "border-[#e8e5de]",
      heading: "font-serif text-[#1a1918]",
      text: "text-[#1a1918]",
      muted: "text-[#8c827a]",
      accentBg: "bg-[#1a1918] text-[#faf9f5]",
      subtleBg: "bg-[#f5f2eb]",
      highlight: "ring-[#1a1918]",
    },
    royal_indian: {
      bg: "bg-[#fcfaf6]",
      cardBg: "bg-white",
      border: "border-[#e8dfcf]",
      heading: "font-serif text-[#4a0e17]",
      text: "text-[#331116]",
      muted: "text-[#8a7664]",
      accentBg: "bg-[#4a0e17] text-[#fbf8f3] hover:bg-[#5a1420]",
      subtleBg: "bg-[#f9f4ea]",
      highlight: "ring-[#b89736]",
    },
    botanical_romance: {
      bg: "bg-[#f7f9f7]",
      cardBg: "bg-white",
      border: "border-[#d9e2dc]",
      heading: "font-serif text-[#283830]",
      text: "text-[#1f2b24]",
      muted: "text-[#697d71]",
      accentBg: "bg-[#3e5345] text-[#f7f9f7] hover:bg-[#2d3d33]",
      subtleBg: "bg-[#edf3ee]",
      highlight: "ring-[#5f6f52]",
    },
  }[template] || {
    bg: "bg-[#faf9f5]",
    cardBg: "bg-white",
    border: "border-[#e8e5de]",
    heading: "font-serif text-[#1a1918]",
    text: "text-[#1a1918]",
    muted: "text-[#8c827a]",
    accentBg: "bg-[#1a1918] text-[#faf9f5]",
    subtleBg: "bg-[#f5f2eb]",
    highlight: "ring-[#1a1918]",
  };

  // Fetch RSVP data when token is provided
  useEffect(() => {
    if (!token) return;

    let isMounted = true;

    async function loadGuestRsvp() {
      try {
        setFetchError(null);
        const supabase = createClient();
        const { data, error } = await supabase.rpc("get_public_rsvp_by_token", {
          p_slug: slug.toLowerCase().trim(),
          p_token: token?.trim() || "",
        });

        if (!isMounted) return;

        if (error) {
          setFetchError("Unable to retrieve invitation details. Please try again.");
          setRsvpData(null);
        } else if (!data || typeof data !== "object" || !("guest" in data)) {
          setFetchError("We could not find an invitation matching this link.");
          setRsvpData(null);
        } else {
          const payload = data as PublicRsvpPayload;
          setRsvpData(payload);

          // Seed form with existing responses
          if (payload.guest.invitation_status === "declined") {
            setStatus("declined");
            setAttendeeCount(0);
          } else {
            setStatus("confirmed");
            setAttendeeCount(
              payload.guest.attendee_count > 0
                ? payload.guest.attendee_count
                : Math.min(1, payload.guest.max_attendees)
            );
          }
          if (payload.guest.meal_preference) {
            setMealPreference(payload.guest.meal_preference);
          }
          if (payload.guest.guest_message) {
            setGuestMessage(payload.guest.guest_message);
          }
        }
      } catch {
        if (isMounted) {
          setFetchError("Failed to communicate with the celebration server.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadGuestRsvp();

    return () => {
      isMounted = false;
    };
  }, [slug, token]);

  const handleManualTokenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = manualTokenInput.trim();
    if (!clean) return;
    setLoading(true);
    setToken(clean);
  };

  const handleRsvpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !rsvpData) return;

    setSubmitSuccess(null);
    setSubmitError(null);

    const countToSubmit = status === "declined" ? 0 : attendeeCount;

    startTransition(async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase.rpc("submit_public_rsvp", {
          p_slug: slug.toLowerCase().trim(),
          p_token: token.trim(),
          p_status: status,
          p_attendee_count: countToSubmit,
          p_meal_preference: status === "confirmed" ? mealPreference : null,
          p_guest_message: guestMessage.trim() || null,
        });

        if (error) {
          setSubmitError(error.message || "Failed to submit response. Please try again.");
          return;
        }

        if (data && typeof data === "object") {
          // Update local state
          setRsvpData((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              guest: {
                ...prev.guest,
                invitation_status: status as InvitationStatus,
                attendee_count: countToSubmit,
                meal_preference: status === "confirmed" ? mealPreference : null,
                guest_message: guestMessage.trim() || null,
                responded_at: new Date().toISOString(),
              },
            };
          });

          setSubmitSuccess(
            status === "confirmed"
              ? `Thank you! Your attendance has been confirmed for ${countToSubmit} guest(s).`
              : "Thank you for letting us know. We will miss you on our special day."
          );
        }
      } catch {
        setSubmitError("An unexpected error occurred while saving your response.");
      }
    });
  };

  return (
    <section
      id="rsvp"
      style={{ colorScheme: "light" }}
      className={`border-t ${styles.border} ${styles.bg} px-6 py-20 sm:py-28`}
    >
      <div className="max-w-2xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-10">
          <span className={`text-[10px] font-mono uppercase tracking-[0.25em] ${styles.muted}`}>
            Celebration Response
          </span>
          <h2 className={`mt-3 font-serif text-3xl sm:text-4xl lg:text-5xl font-normal ${styles.heading}`}>
            RSVP & Attendance
          </h2>
          <p className={`mt-3 text-sm leading-relaxed ${styles.muted} max-w-lg mx-auto`}>
            Please let us know if you will be celebrating with {coupleNames}.
          </p>
        </div>

        {/* 1. Loading State */}
        {loading && (
          <div className={`rounded-2xl border ${styles.border} ${styles.cardBg} p-8 sm:p-12 text-center shadow-xs animate-pulse`}>
            <div className="h-4 bg-black/5 rounded w-1/3 mx-auto mb-4" />
            <div className="h-6 bg-black/5 rounded w-1/2 mx-auto mb-3" />
            <div className="h-3 bg-black/5 rounded w-2/3 mx-auto" />
            <p className={`mt-6 text-xs font-mono ${styles.muted}`}>
              Loading your private invitation...
            </p>
          </div>
        )}

        {/* 2. Error Fetching Token */}
        {!loading && fetchError && (
          <div className="rounded-2xl border border-red-200 bg-red-50/90 p-8 text-center text-red-900 shadow-xs">
            <span className="text-2xl" aria-hidden="true">
              ✉️
            </span>
            <h3 className="mt-2 font-serif text-xl font-normal text-red-950">
              Invitation Link Unrecognized
            </h3>
            <p className="mt-2 text-xs text-red-800 leading-relaxed max-w-md mx-auto">
              {fetchError} Please confirm you opened the complete URL provided by the couple, or enter your token below.
            </p>

            <form onSubmit={handleManualTokenSubmit} className="mt-6 flex flex-col sm:flex-row gap-2 max-w-sm mx-auto">
              <input
                type="text"
                placeholder="Enter invitation code"
                value={manualTokenInput}
                onChange={(e) => setManualTokenInput(e.target.value)}
                style={{ colorScheme: "light" }}
                className="rounded-full border border-red-300 bg-[#FFFCF8] px-4 py-2 text-xs font-mono text-[#2C2624] placeholder:text-[#8C827A] focus:outline-none focus:ring-2 focus:ring-red-400 grow"
              />
              <button
                type="submit"
                className="rounded-full bg-red-900 px-5 py-2 text-xs font-medium text-white hover:bg-red-800 transition-colors shrink-0"
              >
                Verify Code
              </button>
            </form>
          </div>
        )}

        {/* 3. No Token Provided (Public Informational Entry Point) */}
        {!loading && !token && (
          <div className={`rounded-2xl border ${styles.border} ${styles.cardBg} p-8 sm:p-12 text-center shadow-xs`}>
            <div className="w-12 h-12 rounded-full border border-[#E6DFD5] flex items-center justify-center mx-auto mb-4 text-xl">
              💌
            </div>
            <h3 className={`font-serif text-2xl font-normal ${styles.heading}`}>
              Personalized Invitations
            </h3>
            <p className={`mt-3 text-xs sm:text-sm leading-relaxed ${styles.muted} max-w-md mx-auto`}>
              Every guest receives a secure, personalized invitation link to confirm attendance, party size, and meal preferences.
            </p>
            <p className={`mt-2 text-xs leading-relaxed ${styles.muted} max-w-md mx-auto`}>
              Please use the private link sent directly by {coupleNames} to access your RSVP form.
            </p>

            {/* Optional helper code entry */}
            <div className={`mt-8 pt-6 border-t ${styles.border} max-w-sm mx-auto`}>
              <span className={`block text-[10px] font-mono uppercase tracking-wider ${styles.muted} mb-2`}>
                Already have an invitation token?
              </span>
              <form onSubmit={handleManualTokenSubmit} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Paste token or code"
                  value={manualTokenInput}
                  onChange={(e) => setManualTokenInput(e.target.value)}
                  style={{ colorScheme: "light" }}
                  className="rounded-full border border-[#E6DFD5] bg-[#FFFCF8] px-4 py-2.5 text-xs font-mono text-[#2C2624] placeholder:text-[#8C827A] focus:outline-none focus:border-[#4A0E17] focus:ring-2 focus:ring-[#4A0E17]/15 grow"
                />
                <button
                  type="submit"
                  className={`rounded-full ${styles.accentBg} px-5 py-2 text-xs font-medium transition-opacity shrink-0`}
                >
                  Open RSVP
                </button>
              </form>
            </div>
          </div>
        )}

        {/* 4. Valid Token & RSVP Form */}
        {!loading && rsvpData && (
          <div className={`rounded-2xl border ${styles.border} ${styles.cardBg} p-6 sm:p-10 shadow-xs`}>
            {/* Guest Welcome Banner */}
            <div className={`border-b ${styles.border} pb-6 text-center sm:text-left flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4`}>
              <div>
                <span className={`text-[10px] font-mono uppercase tracking-widest ${styles.muted}`}>
                  Invitation For
                </span>
                <h3 className={`mt-1 font-serif text-2xl sm:text-3xl font-normal ${styles.heading}`}>
                  {rsvpData.guest.full_name}
                </h3>
                <p className={`mt-1 text-xs ${styles.muted}`}>
                  Party size: Up to <strong className="font-semibold text-[#1a1918]">{rsvpData.guest.max_attendees}</strong> {rsvpData.guest.max_attendees === 1 ? "guest" : "guests"}
                </p>
              </div>

              {rsvpData.guest.responded_at && (
                <div className={`text-center sm:text-right rounded-xl ${styles.subtleBg} p-3 border ${styles.border}`}>
                  <span className={`block text-[9px] font-mono uppercase tracking-wider ${styles.muted}`}>
                    Current Status
                  </span>
                  <span
                    className={`inline-block mt-0.5 text-xs font-medium uppercase tracking-wider ${
                      rsvpData.guest.invitation_status === "confirmed"
                        ? "text-emerald-700 font-semibold"
                        : "text-amber-700"
                    }`}
                  >
                    {rsvpData.guest.invitation_status === "confirmed"
                      ? `✓ Confirmed (${rsvpData.guest.attendee_count} attending)`
                      : "Regretfully Declined"}
                  </span>
                </div>
              )}
            </div>

            {/* Closed Notice */}
            {rsvpData.settings.is_closed ? (
              <div className="py-8 text-center">
                <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto mb-3">
                  ⏳
                </div>
                <h4 className={`font-serif text-xl font-normal ${styles.heading}`}>
                  RSVP Submissions Are Closed
                </h4>
                <p className={`mt-2 text-xs ${styles.muted} max-w-md mx-auto`}>
                  {rsvpData.settings.rsvp_deadline
                    ? `The response deadline was ${rsvpData.settings.rsvp_deadline}.`
                    : "The couple is no longer accepting digital RSVP modifications."}{" "}
                  If you need to make changes, please contact {coupleNames} directly.
                </p>
              </div>
            ) : (
              /* Active RSVP Form */
              <form onSubmit={handleRsvpSubmit} className="pt-6 space-y-6">
                {submitSuccess && (
                  <div
                    role="status"
                    className="rounded-xl border border-emerald-200 bg-emerald-50/90 p-4 text-xs text-emerald-900 flex items-center gap-2"
                  >
                    <span>✓</span>
                    <span>{submitSuccess}</span>
                  </div>
                )}

                {submitError && (
                  <div
                    role="alert"
                    className="rounded-xl border border-red-200 bg-red-50/90 p-4 text-xs text-red-900"
                  >
                    {submitError}
                  </div>
                )}

                {/* Attendance Options */}
                <div>
                  <label className={`block text-xs font-mono uppercase tracking-wider ${styles.muted} mb-3`}>
                    Will you be attending?
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setStatus("confirmed");
                        if (attendeeCount === 0) setAttendeeCount(1);
                      }}
                      className={`rounded-xl border p-4 text-left transition-all flex items-start gap-3 ${
                        status === "confirmed"
                          ? `border-emerald-600 bg-emerald-50/40 ring-2 ring-emerald-600/20`
                          : `${styles.border} ${styles.subtleBg} hover:opacity-80`
                      }`}
                    >
                      <span className="text-xl" aria-hidden="true">
                        ✨
                      </span>
                      <div>
                        <span className={`block font-serif text-base font-normal ${styles.heading}`}>
                          Joyfully Accepts
                        </span>
                        <span className={`block text-[11px] ${styles.muted} mt-0.5`}>
                          I/we will celebrate in person
                        </span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setStatus("declined")}
                      className={`rounded-xl border p-4 text-left transition-all flex items-start gap-3 ${
                        status === "declined"
                          ? `border-amber-600 bg-amber-50/40 ring-2 ring-amber-600/20`
                          : `${styles.border} ${styles.subtleBg} hover:opacity-80`
                      }`}
                    >
                      <span className="text-xl" aria-hidden="true">
                        🕊️
                      </span>
                      <div>
                        <span className={`block font-serif text-base font-normal ${styles.heading}`}>
                          Regretfully Declines
                        </span>
                        <span className={`block text-[11px] ${styles.muted} mt-0.5`}>
                          Celebrating in spirit from afar
                        </span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* If Confirmed: Attendee Count & Meal Preference */}
                {status === "confirmed" && (
                  <div className="space-y-6 pt-2">
                    {/* Attendee Count Picker */}
                    <div>
                      <label className={`block text-xs font-mono uppercase tracking-wider ${styles.muted} mb-1.5`}>
                        Number of Attendees
                      </label>
                      <p className={`text-[11px] ${styles.muted} mb-2.5`}>
                        Your invitation permits up to {rsvpData.guest.max_attendees}{" "}
                        {rsvpData.guest.max_attendees === 1 ? "guest" : "guests"}.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {Array.from({ length: rsvpData.guest.max_attendees }, (_, i) => i + 1).map(
                          (num) => (
                            <button
                              key={num}
                              type="button"
                              onClick={() => setAttendeeCount(num)}
                              className={`h-10 w-12 rounded-xl text-xs font-medium font-mono border transition-all ${
                                attendeeCount === num
                                    ? `${styles.accentBg} shadow-xs font-semibold`
                                    : `${styles.border} ${styles.subtleBg} ${styles.text} hover:opacity-80`
                              }`}
                            >
                              {num}
                            </button>
                          )
                        )}
                      </div>
                    </div>

                    {/* Meal Preferences */}
                    {rsvpData.settings.ask_meal_preference && (
                      <div>
                        <label
                          htmlFor="meal-preference"
                          className={`block text-xs font-mono uppercase tracking-wider ${styles.muted} mb-1.5`}
                        >
                          Meal Preference
                        </label>
                        <div className="relative">
                          <select
                            id="meal-preference"
                            name="meal_preference"
                            value={mealPreference}
                            onChange={(e) => setMealPreference(e.target.value)}
                            style={{ colorScheme: "light" }}
                            className="w-full appearance-none rounded-xl border border-[#E6DFD5] bg-[#FFFCF8] px-4 py-3 pr-10 text-xs sm:text-sm text-[#2C2624] transition-all duration-150 ease-in-out hover:border-[#D4C8B8] hover:bg-[#FFFDF9] focus:border-[#4A0E17] focus:bg-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#4A0E17]/15 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <option value="" className="bg-[#FFFCF8] text-[#8C827A] py-1.5">
                              Select a dining preference (optional)
                            </option>
                            {rsvpData.settings.meal_options?.map((option) => (
                              <option
                                key={option}
                                value={option}
                                className="bg-[#FFFCF8] text-[#2C2624] py-1.5"
                              >
                                {option}
                              </option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-[#8C827A]">
                            <svg
                              className="h-4 w-4"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={1.75}
                              aria-hidden="true"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Guest Message */}
                {rsvpData.settings.allow_guest_message && (
                  <div>
                    <label
                      htmlFor="guest-wishes"
                      className={`block text-xs font-mono uppercase tracking-wider ${styles.muted} mb-1.5`}
                    >
                      Wishes for the Couple (Optional)
                    </label>
                    <textarea
                      id="guest-wishes"
                      name="guest_message"
                      rows={4}
                      value={guestMessage}
                      onChange={(e) => setGuestMessage(e.target.value)}
                      placeholder="Share a celebratory thought, dietary clarification, or warm wishes..."
                      style={{ colorScheme: "light" }}
                      className="w-full min-h-[120px] resize-y rounded-xl border border-[#E6DFD5] bg-[#FFFCF8] p-4 text-xs sm:text-sm leading-relaxed text-[#2C2624] placeholder:text-[#8C827A] transition-all duration-150 ease-in-out hover:border-[#D4C8B8] hover:bg-[#FFFDF9] focus:border-[#4A0E17] focus:bg-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#4A0E17]/15 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>
                )}

                {/* Submit Action */}
                <div className={`pt-4 border-t ${styles.border} flex flex-col sm:flex-row items-center justify-between gap-4`}>
                  {rsvpData.settings.rsvp_deadline && (
                    <span className={`text-[11px] font-mono ${styles.muted}`}>
                      Deadline: {rsvpData.settings.rsvp_deadline}
                    </span>
                  )}
                  <button
                    type="submit"
                    disabled={isPending}
                    className={`w-full sm:w-auto rounded-full ${styles.accentBg} px-8 py-3 text-xs font-medium uppercase tracking-wider transition-opacity disabled:opacity-50`}
                  >
                    {isPending
                      ? "Submitting Response..."
                      : rsvpData.guest.responded_at
                      ? "Update RSVP"
                      : "Submit RSVP"}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
