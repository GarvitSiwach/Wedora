"use client";

import { useState, useTransition } from "react";
import { WeddingGuest, InvitationStatus } from "@/types";
import { createClient } from "@/lib/supabase/client";

interface GuestManagerProps {
  weddingId: string;
  initialGuests: WeddingGuest[];
  userCanEdit: boolean;
  weddingSlug?: string;
}

export function GuestManager({
  weddingId,
  initialGuests,
  userCanEdit,
  weddingSlug,
}: GuestManagerProps) {
  const [guests, setGuests] = useState<WeddingGuest[]>(initialGuests);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | InvitationStatus>("all");
  const [copiedTokenId, setCopiedTokenId] = useState<string | null>(null);

  // Dialog states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<WeddingGuest | null>(null);
  const [deletingGuest, setDeletingGuest] = useState<WeddingGuest | null>(null);

  // Form field states
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [householdName, setHouseholdName] = useState("");
  const [invitationStatus, setInvitationStatus] = useState<InvitationStatus>("pending");
  const [maxAttendees, setMaxAttendees] = useState(1);
  const [dietaryNotes, setDietaryNotes] = useState("");
  const [notes, setNotes] = useState("");

  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Metrics
  const totalCount = guests.length;
  const confirmedCount = guests.filter((g) => g.invitation_status === "confirmed").length;
  const invitedCount = guests.filter((g) => g.invitation_status === "invited").length;
  const pendingCount = guests.filter((g) => g.invitation_status === "pending").length;
  const declinedCount = guests.filter((g) => g.invitation_status === "declined").length;

  const handleCopyRsvpLink = (guest: WeddingGuest) => {
    if (typeof window === "undefined") return;
    const origin = window.location.origin;
    const token = guest.invitation_token || guest.id;
    const slug = weddingSlug || "celebration";
    const url = `${origin}/w/${slug}?rsvp=${token}`;

    navigator.clipboard.writeText(url);
    setCopiedTokenId(guest.id);
    setTimeout(() => setCopiedTokenId(null), 2500);
  };

  const openAddDialog = () => {
    setEditingGuest(null);
    setFullName("");
    setEmail("");
    setPhone("");
    setHouseholdName("");
    setInvitationStatus("pending");
    setMaxAttendees(1);
    setDietaryNotes("");
    setNotes("");
    setFormError(null);
    setIsFormOpen(true);
  };

  const openEditDialog = (guest: WeddingGuest) => {
    setEditingGuest(guest);
    setFullName(guest.full_name);
    setEmail(guest.email || "");
    setPhone(guest.phone || "");
    setHouseholdName(guest.household_name || "");
    setInvitationStatus(guest.invitation_status);
    setMaxAttendees(guest.max_attendees || 1);
    setDietaryNotes(guest.dietary_notes || "");
    setNotes(guest.notes || "");
    setFormError(null);
    setIsFormOpen(true);
  };

  const closeFormDialog = () => {
    setIsFormOpen(false);
    setEditingGuest(null);
    setFormError(null);
  };

  const handleSaveGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedName = fullName.trim();
    if (!trimmedName) {
      setFormError("Guest full name is required.");
      return;
    }

    const payload = {
      wedding_id: weddingId,
      full_name: trimmedName,
      email: email.trim() || null,
      phone: phone.trim() || null,
      household_name: householdName.trim() || null,
      invitation_status: invitationStatus,
      max_attendees: Math.max(1, maxAttendees || 1),
      dietary_notes: dietaryNotes.trim() || null,
      notes: notes.trim() || null,
    };

    startTransition(async () => {
      try {
        const supabase = createClient();

        if (editingGuest) {
          // Update existing guest
          const { data, error } = await supabase
            .from("wedding_guests")
            .update(payload)
            .eq("id", editingGuest.id)
            .eq("wedding_id", weddingId)
            .select()
            .single();

          if (error) {
            setFormError(error.message || "Could not update guest.");
            return;
          }

          if (data) {
            setGuests((prev) =>
              prev.map((g) => (g.id === editingGuest.id ? (data as WeddingGuest) : g))
            );
          }
        } else {
          // Insert new guest
          const { data, error } = await supabase
            .from("wedding_guests")
            .insert(payload)
            .select()
            .single();

          if (error) {
            setFormError(error.message || "Could not create guest.");
            return;
          }

          if (data) {
            setGuests((prev) => [data as WeddingGuest, ...prev]);
          }
        }

        closeFormDialog();
      } catch {
        setFormError("An unexpected error occurred while saving the guest.");
      }
    });
  };

  const handleDeleteGuest = async () => {
    if (!deletingGuest) return;

    startTransition(async () => {
      try {
        const supabase = createClient();
        const { error } = await supabase
          .from("wedding_guests")
          .delete()
          .eq("id", deletingGuest.id)
          .eq("wedding_id", weddingId);

        if (error) {
          setFormError(error.message || "Failed to delete guest.");
          return;
        }

        setGuests((prev) => prev.filter((g) => g.id !== deletingGuest.id));
        setDeletingGuest(null);
      } catch {
        setFormError("An unexpected error occurred while deleting the guest.");
      }
    });
  };

  // Filter & search
  const filteredGuests = guests.filter((guest) => {
    const matchesSearch =
      guest.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (guest.household_name &&
        guest.household_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (guest.email && guest.email.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === "all" ? true : guest.invitation_status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8">
      {/* Header and Add Action */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-[var(--color-border-subtle)] pb-6">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-taupe)]">
            Phase 5 • Guest Management
          </span>
          <h2 className="mt-1 font-serif text-3xl font-normal tracking-tight text-[var(--color-foreground)]">
            Guest List & RSVPs
          </h2>
          <p className="mt-1.5 text-xs text-[var(--color-muted)] max-w-xl leading-relaxed">
            Organize households, track invitation responses, and manage dietary requirements with zero ads or subscription fees.
          </p>
        </div>

        {userCanEdit && (
          <button
            type="button"
            onClick={openAddDialog}
            className="inline-flex items-center justify-center rounded-full bg-[var(--color-foreground)] px-5 py-2.5 text-xs font-medium text-[var(--color-background)] hover:opacity-90 transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-foreground)] shadow-xs shrink-0"
          >
            + Add Guest
          </button>
        )}
      </div>

      {/* Metric Cards Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-center">
          <div className="text-2xl font-serif font-normal text-[var(--color-foreground)]">
            {totalCount}
          </div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-taupe)] mt-1">
            Total Guests
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-center">
          <div className="text-2xl font-serif font-normal text-emerald-700 dark:text-emerald-400">
            {confirmedCount}
          </div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-taupe)] mt-1">
            Confirmed
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-center">
          <div className="text-2xl font-serif font-normal text-blue-700 dark:text-blue-400">
            {invitedCount}
          </div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-taupe)] mt-1">
            Invited
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-center">
          <div className="text-2xl font-serif font-normal text-amber-700 dark:text-amber-400">
            {pendingCount}
          </div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-taupe)] mt-1">
            Pending
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-center col-span-2 sm:col-span-1">
          <div className="text-2xl font-serif font-normal text-[var(--color-taupe)]">
            {declinedCount}
          </div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-taupe)] mt-1">
            Declined
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-taupe)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, household, or email..."
            className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] pl-10 pr-4 py-2 text-xs text-[var(--color-foreground)] placeholder:text-[var(--color-taupe-muted)] focus:border-[var(--color-foreground)] focus:outline-hidden"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1">
          {(
            [
              { key: "all", label: "All", count: totalCount },
              { key: "confirmed", label: "Confirmed", count: confirmedCount },
              { key: "invited", label: "Invited", count: invitedCount },
              { key: "pending", label: "Pending", count: pendingCount },
              { key: "declined", label: "Declined", count: declinedCount },
            ] as const
          ).map((filter) => {
            const isActive = statusFilter === filter.key;
            return (
              <button
                key={filter.key}
                type="button"
                onClick={() => setStatusFilter(filter.key)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                  isActive
                    ? "bg-[var(--color-foreground)] text-[var(--color-background)] shadow-xs"
                    : "border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)] hover:bg-[var(--color-ivory)]"
                }`}
              >
                {filter.label} <span className="opacity-70 text-[10px]">({filter.count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Guest Table or Empty State */}
      {guests.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)]/60 p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-ivory)] text-2xl">
            👥
          </div>
          <h3 className="mt-4 font-serif text-2xl font-normal text-[var(--color-foreground)]">
            No guests added yet
          </h3>
          <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-[var(--color-muted)]">
            Begin by adding your first guest or household circle. Wedora lets you track RSVPs, dietary notes, and contact details in one calm space.
          </p>
          {userCanEdit && (
            <div className="mt-6">
              <button
                type="button"
                onClick={openAddDialog}
                className="rounded-full bg-[var(--color-foreground)] px-6 py-2.5 text-xs font-medium text-[var(--color-background)] hover:opacity-90 transition-opacity"
              >
                + Add Your First Guest
              </button>
            </div>
          )}
        </div>
      ) : filteredGuests.length === 0 ? (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center text-xs text-[var(--color-muted)]">
          No guests match &ldquo;{searchQuery}&rdquo; with the selected filter.
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setStatusFilter("all");
            }}
            className="block mx-auto mt-2 font-medium text-[var(--color-foreground)] underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-ivory)]/40 text-[10px] font-mono uppercase tracking-wider text-[var(--color-taupe)]">
                  <th scope="col" className="px-5 py-3.5 font-medium">Guest Name</th>
                  <th scope="col" className="px-4 py-3.5 font-medium">Household / Circle</th>
                  <th scope="col" className="px-4 py-3.5 font-medium">Contact</th>
                  <th scope="col" className="px-4 py-3.5 font-medium">Status</th>
                  <th scope="col" className="px-4 py-3.5 font-medium">Dietary & Notes</th>
                  {userCanEdit && <th scope="col" className="px-4 py-3.5 font-medium text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-subtle)]">
                {filteredGuests.map((guest) => (
                  <tr
                    key={guest.id}
                    className="hover:bg-[var(--color-ivory)]/30 transition-colors"
                  >
                    {/* Full Name */}
                    <td className="px-5 py-4 font-medium text-[var(--color-foreground)]">
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-full bg-[var(--color-ivory)] border border-[var(--color-border)] flex items-center justify-center font-serif text-xs text-[var(--color-foreground)] shrink-0">
                          {guest.full_name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-sm font-serif">{guest.full_name}</span>
                      </div>
                    </td>

                    {/* Household */}
                    <td className="px-4 py-4 text-[var(--color-muted)]">
                      {guest.household_name ? (
                        <span className="inline-flex items-center gap-1 text-xs">
                          {guest.household_name}
                        </span>
                      ) : (
                        <span className="text-[var(--color-taupe-muted)] italic text-[11px]">—</span>
                      )}
                    </td>

                    {/* Contact (Email / Phone) */}
                    <td className="px-4 py-4 text-[var(--color-muted)]">
                      <div className="space-y-0.5">
                        {guest.email && <div className="text-[11px]">{guest.email}</div>}
                        {guest.phone && <div className="text-[11px] font-mono text-[var(--color-taupe)]">{guest.phone}</div>}
                        {!guest.email && !guest.phone && (
                          <span className="text-[var(--color-taupe-muted)] italic text-[11px]">—</span>
                        )}
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="px-4 py-4">
                      {guest.invitation_status === "confirmed" && (
                        <div>
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-300">
                            Confirmed
                          </span>
                          <span className="block text-[11px] font-mono text-emerald-800 dark:text-emerald-300 mt-1">
                            {guest.attendee_count || 1} / {guest.max_attendees} attending
                          </span>
                        </div>
                      )}
                      {guest.invitation_status === "invited" && (
                        <div>
                          <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-blue-800 dark:border-blue-900/40 dark:bg-blue-950/40 dark:text-blue-300">
                            Invited
                          </span>
                          <span className="block text-[11px] font-mono text-[var(--color-taupe)] mt-1">
                            Party of up to {guest.max_attendees}
                          </span>
                        </div>
                      )}
                      {guest.invitation_status === "pending" && (
                        <div>
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-300">
                            Pending
                          </span>
                          <span className="block text-[11px] font-mono text-[var(--color-taupe)] mt-1">
                            Party of up to {guest.max_attendees}
                          </span>
                        </div>
                      )}
                      {guest.invitation_status === "declined" && (
                        <div>
                          <span className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-ivory)] px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-[var(--color-taupe)]">
                            Declined
                          </span>
                          <span className="block text-[11px] font-mono text-[var(--color-taupe-muted)] mt-1">
                            0 attending
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Dietary / Notes */}
                    <td className="px-4 py-4 text-[var(--color-muted)] max-w-xs">
                      {guest.meal_preference && (
                        <span className="inline-block rounded-md bg-[var(--color-surface)] border border-[var(--color-border-subtle)] px-2 py-0.5 text-[10px] font-medium text-[var(--color-foreground)] mr-1 mb-1">
                          🍽️ {guest.meal_preference}
                        </span>
                      )}
                      {guest.dietary_notes && (
                        <span className="inline-block rounded-md bg-[var(--color-ivory)] px-2 py-0.5 text-[10px] font-medium text-[var(--color-foreground)] mr-1 mb-1">
                          🥗 {guest.dietary_notes}
                        </span>
                      )}
                      {guest.notes && (
                        <p className="text-[11px] text-[var(--color-taupe)] truncate">{guest.notes}</p>
                      )}
                      {!guest.meal_preference && !guest.dietary_notes && !guest.notes && (
                        <span className="text-[var(--color-taupe-muted)] italic text-[11px]">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    {userCanEdit && (
                      <td className="px-4 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleCopyRsvpLink(guest)}
                            className="rounded-md border border-[var(--color-border)] px-2.5 py-1 text-[11px] font-medium text-[var(--color-foreground)] hover:bg-[var(--color-ivory)] transition-colors inline-flex items-center gap-1"
                            title="Copy personalized RSVP link"
                          >
                            <span>{copiedTokenId === guest.id ? "✓ Copied" : "🔗 RSVP Link"}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditDialog(guest)}
                            className="rounded-md border border-[var(--color-border)] px-2.5 py-1 text-[11px] font-medium text-[var(--color-foreground)] hover:bg-[var(--color-ivory)] transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingGuest(guest)}
                            className="rounded-md border border-red-200 px-2 py-1 text-[11px] font-medium text-red-600 hover:bg-red-50 dark:border-red-900/40 dark:text-red-400 dark:hover:bg-red-950/30 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Guest Modal */}
      {isFormOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto"
        >
          <div className="w-full max-w-lg rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 sm:p-8 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-taupe)]">
                  {editingGuest ? "Edit Details" : "New Invitation"}
                </span>
                <h3 className="mt-1 font-serif text-2xl font-normal text-[var(--color-foreground)]">
                  {editingGuest ? `Edit ${editingGuest.full_name}` : "Add Wedding Guest"}
                </h3>
              </div>
              <button
                type="button"
                onClick={closeFormDialog}
                className="text-[var(--color-taupe)] hover:text-[var(--color-foreground)] p-1.5"
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div
                role="alert"
                className="mt-4 rounded-lg border border-red-200 bg-red-50/70 p-3 text-xs text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
              >
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveGuest} className="mt-5 space-y-4">
              {/* Full Name */}
              <div>
                <label
                  htmlFor="guestFullName"
                  className="block text-xs font-medium uppercase tracking-wider text-[var(--color-foreground)]"
                >
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="guestFullName"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Eleanor Vance"
                  className="mt-1.5 block w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3.5 py-2 text-xs text-[var(--color-foreground)] placeholder:text-[var(--color-taupe-muted)] focus:border-[var(--color-foreground)] focus:outline-hidden"
                />
              </div>

              {/* Household Circle */}
              <div>
                <label
                  htmlFor="guestHousehold"
                  className="block text-xs font-medium uppercase tracking-wider text-[var(--color-foreground)]"
                >
                  Household / Circle (Optional)
                </label>
                <input
                  id="guestHousehold"
                  type="text"
                  value={householdName}
                  onChange={(e) => setHouseholdName(e.target.value)}
                  placeholder="e.g. Vance Family, University Friends"
                  className="mt-1.5 block w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3.5 py-2 text-xs text-[var(--color-foreground)] placeholder:text-[var(--color-taupe-muted)] focus:border-[var(--color-foreground)] focus:outline-hidden"
                />
              </div>

              {/* Email and Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label
                    htmlFor="guestEmail"
                    className="block text-xs font-medium uppercase tracking-wider text-[var(--color-foreground)]"
                  >
                    Email (Optional)
                  </label>
                  <input
                    id="guestEmail"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="eleanor@example.com"
                    className="mt-1.5 block w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3.5 py-2 text-xs text-[var(--color-foreground)] placeholder:text-[var(--color-taupe-muted)] focus:border-[var(--color-foreground)] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label
                    htmlFor="guestPhone"
                    className="block text-xs font-medium uppercase tracking-wider text-[var(--color-foreground)]"
                  >
                    Phone (Optional)
                  </label>
                  <input
                    id="guestPhone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="mt-1.5 block w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3.5 py-2 text-xs text-[var(--color-foreground)] placeholder:text-[var(--color-taupe-muted)] focus:border-[var(--color-foreground)] focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Status & Max Attendees */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label
                    htmlFor="guestStatus"
                    className="block text-xs font-medium uppercase tracking-wider text-[var(--color-foreground)]"
                  >
                    Invitation Status
                  </label>
                  <select
                    id="guestStatus"
                    value={invitationStatus}
                    onChange={(e) => setInvitationStatus(e.target.value as InvitationStatus)}
                    className="mt-1.5 block w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3.5 py-2 text-xs text-[var(--color-foreground)] focus:border-[var(--color-foreground)] focus:outline-hidden"
                  >
                    <option value="pending">Pending</option>
                    <option value="invited">Invited</option>
                    <option value="confirmed">Confirmed (Attending)</option>
                    <option value="declined">Declined</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="guestMaxAttendees"
                    className="block text-xs font-medium uppercase tracking-wider text-[var(--color-foreground)]"
                  >
                    Permitted Party Size
                  </label>
                  <input
                    id="guestMaxAttendees"
                    type="number"
                    min={1}
                    max={20}
                    value={maxAttendees}
                    onChange={(e) => setMaxAttendees(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="mt-1.5 block w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3.5 py-2 text-xs text-[var(--color-foreground)] focus:border-[var(--color-foreground)] focus:outline-hidden"
                  />
                </div>
              </div>

              {/* RSVP Response Summary Box for Editing Guests */}
              {editingGuest && (editingGuest.responded_at || editingGuest.invitation_status === "confirmed" || editingGuest.invitation_status === "declined") && (
                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-ivory)]/40 p-3.5 space-y-1 text-xs">
                  <span className="block font-mono text-[10px] uppercase tracking-wider text-[var(--color-taupe)]">
                    Digital RSVP Details
                  </span>
                  <p className="text-[var(--color-foreground)]">
                    <strong>Status:</strong>{" "}
                    {editingGuest.invitation_status === "confirmed"
                      ? `Confirmed (${editingGuest.attendee_count || 1} attending)`
                      : editingGuest.invitation_status === "declined"
                      ? "Declined"
                      : "Awaiting Reply"}
                  </p>
                  {editingGuest.meal_preference && (
                    <p className="text-[var(--color-muted)]">
                      <strong>Meal Choice:</strong> {editingGuest.meal_preference}
                    </p>
                  )}
                  {editingGuest.guest_message && (
                    <p className="text-[var(--color-muted)] italic">
                      &ldquo;{editingGuest.guest_message}&rdquo;
                    </p>
                  )}
                  {editingGuest.responded_at && (
                    <p className="text-[11px] font-mono text-[var(--color-taupe-muted)]">
                      Responded: {new Date(editingGuest.responded_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}

              {/* Dietary Notes */}
              <div>
                <label
                  htmlFor="guestDietary"
                  className="block text-xs font-medium uppercase tracking-wider text-[var(--color-foreground)]"
                >
                  Dietary Restrictions / Allergies (Optional)
                </label>
                <input
                  id="guestDietary"
                  type="text"
                  value={dietaryNotes}
                  onChange={(e) => setDietaryNotes(e.target.value)}
                  placeholder="e.g. Vegetarian, Gluten-free, Nut allergy"
                  className="mt-1.5 block w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3.5 py-2 text-xs text-[var(--color-foreground)] placeholder:text-[var(--color-taupe-muted)] focus:border-[var(--color-foreground)] focus:outline-hidden"
                />
              </div>

              {/* General Notes */}
              <div>
                <label
                  htmlFor="guestNotes"
                  className="block text-xs font-medium uppercase tracking-wider text-[var(--color-foreground)]"
                >
                  Notes / Seating Preferences (Optional)
                </label>
                <textarea
                  id="guestNotes"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Traveling from abroad; seated at table 4"
                  className="mt-1.5 block w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3.5 py-2 text-xs text-[var(--color-foreground)] placeholder:text-[var(--color-taupe-muted)] focus:border-[var(--color-foreground)] focus:outline-hidden"
                />
              </div>

              {/* Form Buttons */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-[var(--color-border-subtle)]">
                <button
                  type="button"
                  onClick={closeFormDialog}
                  disabled={isPending}
                  className="rounded-full border border-[var(--color-border)] px-4 py-2 text-xs font-medium text-[var(--color-foreground)] hover:bg-[var(--color-ivory)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-full bg-[var(--color-foreground)] px-6 py-2 text-xs font-medium text-[var(--color-background)] hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isPending ? "Saving..." : editingGuest ? "Save Changes" : "Add Guest"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingGuest && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4"
        >
          <div className="w-full max-w-sm rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-xl">
            <h3 className="font-serif text-xl font-normal text-[var(--color-foreground)]">
              Remove Guest?
            </h3>
            <p className="mt-2 text-xs text-[var(--color-muted)] leading-relaxed">
              Are you sure you want to remove <strong className="text-[var(--color-foreground)]">{deletingGuest.full_name}</strong> from this wedding? This action cannot be undone.
            </p>
            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingGuest(null)}
                disabled={isPending}
                className="rounded-full border border-[var(--color-border)] px-4 py-1.5 text-xs font-medium text-[var(--color-foreground)] hover:bg-[var(--color-ivory)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteGuest}
                disabled={isPending}
                className="rounded-full bg-red-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isPending ? "Removing..." : "Delete Guest"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
