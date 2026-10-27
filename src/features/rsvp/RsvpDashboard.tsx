"use client";

import { useState, useTransition } from "react";
import { WeddingGuest, WeddingWebsite, InvitationStatus } from "@/types";
import { createClient } from "@/lib/supabase/client";

interface RsvpDashboardProps {
  weddingId: string;
  website: WeddingWebsite | null;
  initialGuests: WeddingGuest[];
  userCanEdit: boolean;
}

export function RsvpDashboard({
  weddingId,
  website,
  initialGuests,
  userCanEdit,
}: RsvpDashboardProps) {
  const [guests, setGuests] = useState<WeddingGuest[]>(initialGuests);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | InvitationStatus>("all");
  const [mealFilter, setMealFilter] = useState<string>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // RSVP settings modal / drawer state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [rsvpEnabled, setRsvpEnabled] = useState(website?.rsvp_enabled ?? true);
  const [rsvpDeadline, setRsvpDeadline] = useState(website?.rsvp_deadline || "");
  const [askMealPreference, setAskMealPreference] = useState(website?.ask_meal_preference ?? true);
  const [mealOptionsStr, setMealOptionsStr] = useState(
    (website?.meal_options || ["Standard", "Vegetarian", "Vegan", "Halal", "Kosher", "Child"]).join(", ")
  );
  const [allowGuestMessage, setAllowGuestMessage] = useState(website?.allow_guest_message ?? true);
  const [settingsNotice, setSettingsNotice] = useState<string | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();

  // Metrics
  const totalInvited = guests.length;
  const confirmedGuests = guests.filter((g) => g.invitation_status === "confirmed");
  const declinedGuests = guests.filter((g) => g.invitation_status === "declined");
  const pendingGuests = guests.filter(
    (g) => g.invitation_status === "pending" || g.invitation_status === "invited"
  );

  // Total expected headcount = sum of attendee_count for confirmed guests
  const totalExpectedHeadcount = confirmedGuests.reduce(
    (acc, g) => acc + (g.attendee_count > 0 ? g.attendee_count : 1),
    0
  );

  // Unique meal options used by guests
  const uniqueMeals = Array.from(
    new Set(
      guests
        .map((g) => g.meal_preference)
        .filter((m): m is string => typeof m === "string" && m.trim().length > 0)
    )
  );

  // Filtered guest list
  const filteredGuests = guests.filter((guest) => {
    const matchesSearch =
      guest.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (guest.household_name &&
        guest.household_name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === "all" ? true : guest.invitation_status === statusFilter;

    const matchesMeal =
      mealFilter === "all" ? true : guest.meal_preference === mealFilter;

    return matchesSearch && matchesStatus && matchesMeal;
  });

  const handleCopyLink = (guest: WeddingGuest) => {
    if (typeof window === "undefined") return;
    const origin = window.location.origin;
    const token = guest.invitation_token || guest.id;
    const slug = website?.slug || "celebration";
    const url = `${origin}/w/${slug}?rsvp=${token}`;

    navigator.clipboard.writeText(url);
    setCopiedId(guest.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleRegenerateToken = async (guestId: string) => {
    if (!userCanEdit) return;
    startTransition(async () => {
      try {
        const supabase = createClient();
        const { data: newToken, error } = await supabase.rpc("regenerate_guest_invitation_token", {
          p_guest_id: guestId,
        });

        if (error) {
          alert(`Failed to regenerate token: ${error.message}`);
          return;
        }

        if (newToken) {
          setGuests((prev) =>
            prev.map((g) => (g.id === guestId ? { ...g, invitation_token: newToken as string } : g))
          );
        }
      } catch {
        alert("An error occurred while regenerating invitation token.");
      }
    });
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userCanEdit) return;
    setSettingsNotice(null);
    setSettingsError(null);

    const mealArray = mealOptionsStr
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const payload = {
      rsvp_enabled: rsvpEnabled,
      rsvp_deadline: rsvpDeadline.trim() || null,
      ask_meal_preference: askMealPreference,
      meal_options: mealArray.length > 0 ? mealArray : ["Standard", "Vegetarian", "Vegan"],
      allow_guest_message: allowGuestMessage,
    };

    startTransition(async () => {
      try {
        const supabase = createClient();
        const { error } = await supabase
          .from("wedding_websites")
          .update(payload)
          .eq("wedding_id", weddingId);

        if (error) {
          setSettingsError(error.message || "Failed to save RSVP settings.");
          return;
        }

        setSettingsNotice("RSVP settings saved successfully.");
        setTimeout(() => setIsSettingsOpen(false), 1200);
      } catch {
        setSettingsError("An unexpected error occurred while saving settings.");
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-[var(--color-border-subtle)] pb-6">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-taupe)]">
            Phase 7 • RSVP Tracking & Guest Responses
          </span>
          <h2 className="mt-1 font-serif text-3xl font-normal tracking-tight text-[var(--color-foreground)]">
            RSVP Dashboard
          </h2>
          <p className="mt-1.5 text-xs text-[var(--color-muted)] max-w-xl leading-relaxed">
            Track confirmed attendance, expected headcount, meal requirements, and guest messages in real time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {userCanEdit && (
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-xs font-medium text-[var(--color-foreground)] hover:bg-[var(--color-ivory)] transition-colors inline-flex items-center gap-1.5"
            >
              <span>⚙️</span>
              <span>RSVP Settings</span>
            </button>
          )}
        </div>
      </div>

      {/* Metric Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Invited */}
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-xs">
          <span className="block text-[10px] font-mono uppercase tracking-widest text-[var(--color-taupe)]">
            Total Invited
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-serif text-3xl sm:text-4xl font-normal text-[var(--color-foreground)]">
              {totalInvited}
            </span>
            <span className="text-xs text-[var(--color-muted)]">guests</span>
          </div>
          <span className="mt-1.5 block text-[11px] text-[var(--color-taupe-muted)]">
            Across all invitations
          </span>
        </div>

        {/* Confirmed Parties */}
        <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/50 dark:border-emerald-900/40 dark:bg-emerald-950/20 p-5 shadow-xs">
          <span className="block text-[10px] font-mono uppercase tracking-widest text-emerald-800 dark:text-emerald-300">
            Confirmed RSVPs
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-serif text-3xl sm:text-4xl font-normal text-emerald-900 dark:text-emerald-100">
              {confirmedGuests.length}
            </span>
            <span className="text-xs text-emerald-700 dark:text-emerald-400">parties</span>
          </div>
          <span className="mt-1.5 block text-[11px] text-emerald-800/80 dark:text-emerald-300/80">
            {totalInvited > 0 ? Math.round((confirmedGuests.length / totalInvited) * 100) : 0}% acceptance rate
          </span>
        </div>

        {/* Total Expected Attendees */}
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-xs">
          <span className="block text-[10px] font-mono uppercase tracking-widest text-[var(--color-taupe)]">
            Expected Attendees
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-serif text-3xl sm:text-4xl font-normal text-[var(--color-foreground)]">
              {totalExpectedHeadcount}
            </span>
            <span className="text-xs text-[var(--color-muted)]">headcount</span>
          </div>
          <span className="mt-1.5 block text-[11px] text-[var(--color-taupe-muted)]">
            Including plus-ones
          </span>
        </div>

        {/* Declined */}
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-xs">
          <span className="block text-[10px] font-mono uppercase tracking-widest text-[var(--color-taupe)]">
            Declined
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-serif text-3xl sm:text-4xl font-normal text-[var(--color-foreground)]">
              {declinedGuests.length}
            </span>
            <span className="text-xs text-[var(--color-muted)]">parties</span>
          </div>
          <span className="mt-1.5 block text-[11px] text-[var(--color-taupe-muted)]">
            Regretfully absent
          </span>
        </div>

        {/* Pending */}
        <div className="col-span-2 lg:col-span-1 rounded-2xl border border-amber-200/80 bg-amber-50/50 dark:border-amber-900/40 dark:bg-amber-950/20 p-5 shadow-xs">
          <span className="block text-[10px] font-mono uppercase tracking-widest text-amber-800 dark:text-amber-300">
            Awaiting Response
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-serif text-3xl sm:text-4xl font-normal text-amber-900 dark:text-amber-100">
              {pendingGuests.length}
            </span>
            <span className="text-xs text-amber-700 dark:text-amber-400">pending</span>
          </div>
          <span className="mt-1.5 block text-[11px] text-amber-800/80 dark:text-amber-300/80">
            Invitations pending reply
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pt-2">
        <div className="relative max-w-sm w-full">
          <span className="absolute inset-y-0 left-3 flex items-center text-[var(--color-taupe-muted)] text-xs">
            🔍
          </span>
          <input
            type="text"
            placeholder="Search guests or household..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] pl-8 pr-4 py-2 text-xs text-[var(--color-foreground)] placeholder:text-[var(--color-taupe-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-foreground)]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Status filter tabs */}
          <div className="inline-flex rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] p-1">
            {(["all", "confirmed", "declined", "pending"] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`rounded-full px-3 py-1 text-xs capitalize transition-all ${
                  statusFilter === st
                    ? "bg-[var(--color-foreground)] text-[var(--color-background)] font-medium"
                    : "text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
                }`}
              >
                {st === "all" ? "All Responses" : st}
              </button>
            ))}
          </div>

          {/* Meal filter dropdown */}
          {uniqueMeals.length > 0 && (
            <select
              value={mealFilter}
              onChange={(e) => setMealFilter(e.target.value)}
              className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs text-[var(--color-foreground)] focus:outline-none"
            >
              <option value="all">All Meals</option>
              {uniqueMeals.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Guest Response Table */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--color-ivory)] border-b border-[var(--color-border)] font-mono text-[10px] uppercase tracking-wider text-[var(--color-taupe)]">
              <tr>
                <th className="py-3 px-4 font-normal">Guest & Household</th>
                <th className="py-3 px-4 font-normal">RSVP Status</th>
                <th className="py-3 px-4 font-normal">Party / Count</th>
                <th className="py-3 px-4 font-normal">Dining Preference</th>
                <th className="py-3 px-4 font-normal">Responded</th>
                <th className="py-3 px-4 font-normal text-right">Invitation Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-subtle)] text-[var(--color-foreground)]">
              {filteredGuests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[var(--color-muted)]">
                    No guests match your selected filters.
                  </td>
                </tr>
              ) : (
                filteredGuests.map((guest) => {
                  const isConfirmed = guest.invitation_status === "confirmed";
                  const isDeclined = guest.invitation_status === "declined";
                  const isPendingStatus =
                    guest.invitation_status === "pending" ||
                    guest.invitation_status === "invited";

                  return (
                    <tr
                      key={guest.id}
                      className="hover:bg-[var(--color-ivory)]/40 transition-colors"
                    >
                      {/* Name & Household */}
                      <td className="py-3.5 px-4">
                        <div className="font-serif text-sm font-normal text-[var(--color-foreground)]">
                          {guest.full_name}
                        </div>
                        {guest.household_name && (
                          <div className="text-[11px] text-[var(--color-taupe)]">
                            {guest.household_name}
                          </div>
                        )}
                        {guest.guest_message && (
                          <div className="mt-1 text-[11px] text-[var(--color-muted)] italic max-w-xs truncate">
                            &ldquo;{guest.guest_message}&rdquo;
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider ${
                            isConfirmed
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900"
                              : isDeclined
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-900"
                              : "bg-[var(--color-ivory)] text-[var(--color-taupe)] border border-[var(--color-border)]"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isConfirmed
                                ? "bg-emerald-600"
                                : isDeclined
                                ? "bg-amber-600"
                                : "bg-[var(--color-taupe-muted)]"
                            }`}
                          />
                          {isConfirmed
                            ? "Confirmed"
                            : isDeclined
                            ? "Declined"
                            : "Awaiting Reply"}
                        </span>
                      </td>

                      {/* Attendees */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono text-xs">
                        {isConfirmed ? (
                          <span>
                            <strong className="font-semibold text-emerald-700 dark:text-emerald-400">
                              {guest.attendee_count}
                            </strong>{" "}
                            / {guest.max_attendees} attending
                          </span>
                        ) : isDeclined ? (
                          <span className="text-[var(--color-taupe-muted)]">0 attending</span>
                        ) : (
                          <span className="text-[var(--color-muted)]">
                            Up to {guest.max_attendees}
                          </span>
                        )}
                      </td>

                      {/* Meal */}
                      <td className="py-3.5 px-4">
                        {guest.meal_preference ? (
                          <span className="rounded-md bg-[var(--color-ivory)] px-2 py-0.5 text-xs text-[var(--color-foreground)] border border-[var(--color-border-subtle)]">
                            {guest.meal_preference}
                          </span>
                        ) : (
                          <span className="text-[var(--color-taupe-muted)]">—</span>
                        )}
                      </td>

                      {/* Responded Time */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-xs text-[var(--color-muted)] font-mono">
                        {guest.responded_at
                          ? new Date(guest.responded_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : isPendingStatus
                          ? "Pending"
                          : "—"}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleCopyLink(guest)}
                            className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1 text-[11px] font-medium text-[var(--color-foreground)] hover:bg-[var(--color-ivory)] transition-colors inline-flex items-center gap-1"
                            title="Copy personalized RSVP link"
                          >
                            <span>{copiedId === guest.id ? "✓ Copied" : "🔗 Copy Link"}</span>
                          </button>

                          {userCanEdit && (
                            <button
                              type="button"
                              onClick={() => handleRegenerateToken(guest.id)}
                              disabled={isPending}
                              className="text-[var(--color-taupe-muted)] hover:text-[var(--color-foreground)] p-1 text-xs"
                              title="Regenerate invitation token"
                            >
                              🔄
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RSVP Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] max-w-lg w-full p-6 sm:p-8 shadow-xl">
            <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-taupe)]">
                  Celebration Configuration
                </span>
                <h3 className="font-serif text-2xl font-normal text-[var(--color-foreground)]">
                  RSVP Settings
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="text-[var(--color-taupe-muted)] hover:text-[var(--color-foreground)] text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="mt-6 space-y-5">
              {settingsNotice && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
                  ✓ {settingsNotice}
                </div>
              )}

              {settingsError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">
                  {settingsError}
                </div>
              )}

              {/* RSVP Open/Close */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-ivory)]/40">
                <div>
                  <span className="block text-xs font-medium text-[var(--color-foreground)]">
                    Accepting RSVPs
                  </span>
                  <span className="block text-[11px] text-[var(--color-muted)]">
                    Turn off to close public RSVP submissions
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setRsvpEnabled(!rsvpEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    rsvpEnabled ? "bg-emerald-600" : "bg-[var(--color-taupe)]"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      rsvpEnabled ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* RSVP Deadline */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[var(--color-taupe)] mb-1.5">
                  RSVP Deadline (Optional)
                </label>
                <input
                  type="date"
                  value={rsvpDeadline}
                  onChange={(e) => setRsvpDeadline(e.target.value)}
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-xs text-[var(--color-foreground)] focus:outline-none"
                />
                <span className="mt-1 block text-[11px] text-[var(--color-taupe-muted)]">
                  Submissions will automatically lock after this date.
                </span>
              </div>

              {/* Ask Meal Preference */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-ivory)]/40">
                <div>
                  <span className="block text-xs font-medium text-[var(--color-foreground)]">
                    Request Dining Preferences
                  </span>
                  <span className="block text-[11px] text-[var(--color-muted)]">
                    Ask attending guests to select a meal option
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setAskMealPreference(!askMealPreference)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    askMealPreference ? "bg-emerald-600" : "bg-[var(--color-taupe)]"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      askMealPreference ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Meal Options */}
              {askMealPreference && (
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[var(--color-taupe)] mb-1.5">
                    Dining Choices (Comma separated)
                  </label>
                  <input
                    type="text"
                    value={mealOptionsStr}
                    onChange={(e) => setMealOptionsStr(e.target.value)}
                    placeholder="Standard, Vegetarian, Vegan, Halal, Kosher, Child"
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-xs text-[var(--color-foreground)] focus:outline-none"
                  />
                </div>
              )}

              {/* Allow Guest Message */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-ivory)]/40">
                <div>
                  <span className="block text-xs font-medium text-[var(--color-foreground)]">
                    Guest Notes & Wishes
                  </span>
                  <span className="block text-[11px] text-[var(--color-muted)]">
                    Provide an optional text field for well-wishes
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setAllowGuestMessage(!allowGuestMessage)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    allowGuestMessage ? "bg-emerald-600" : "bg-[var(--color-taupe)]"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      allowGuestMessage ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              <div className="pt-4 border-t border-[var(--color-border-subtle)] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="rounded-full px-5 py-2 text-xs text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-full bg-[var(--color-foreground)] px-6 py-2 text-xs font-medium text-[var(--color-background)] hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isPending ? "Saving..." : "Save Settings"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
