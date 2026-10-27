"use client";

import { useState, useTransition } from "react";
import { WeddingEvent } from "@/types";
import { createClient } from "@/lib/supabase/client";

interface EventManagerProps {
  weddingId: string;
  initialEvents: WeddingEvent[];
  userCanEdit: boolean;
}

export function EventManager({
  weddingId,
  initialEvents,
  userCanEdit,
}: EventManagerProps) {
  const [events, setEvents] = useState<WeddingEvent[]>(initialEvents);

  // Dialog states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<WeddingEvent | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<WeddingEvent | null>(null);

  // Form field states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");

  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const openAddDialog = () => {
    setEditingEvent(null);
    setTitle("");
    setDescription("");
    setEventDate("");
    setStartTime("");
    setEndTime("");
    setLocation("");
    setFormError(null);
    setIsFormOpen(true);
  };

  const openEditDialog = (item: WeddingEvent) => {
    setEditingEvent(item);
    setTitle(item.title);
    setDescription(item.description || "");
    setEventDate(item.event_date || "");
    setStartTime(item.start_time ? item.start_time.slice(0, 5) : "");
    setEndTime(item.end_time ? item.end_time.slice(0, 5) : "");
    setLocation(item.location || "");
    setFormError(null);
    setIsFormOpen(true);
  };

  const closeFormDialog = () => {
    setIsFormOpen(false);
    setEditingEvent(null);
    setFormError(null);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setFormError("Event title is required.");
      return;
    }

    const payload = {
      wedding_id: weddingId,
      title: trimmedTitle,
      description: description.trim() || null,
      event_date: eventDate || null,
      start_time: startTime || null,
      end_time: endTime || null,
      location: location.trim() || null,
    };

    startTransition(async () => {
      try {
        const supabase = createClient();

        if (editingEvent) {
          const { data, error } = await supabase
            .from("wedding_events")
            .update(payload)
            .eq("id", editingEvent.id)
            .eq("wedding_id", weddingId)
            .select()
            .single();

          if (error) {
            setFormError(error.message || "Failed to update celebration event.");
            return;
          }

          if (data) {
            setEvents((prev) =>
              prev.map((ev) => (ev.id === editingEvent.id ? (data as WeddingEvent) : ev))
            );
          }
        } else {
          const { data, error } = await supabase
            .from("wedding_events")
            .insert(payload)
            .select()
            .single();

          if (error) {
            setFormError(error.message || "Failed to create celebration event.");
            return;
          }

          if (data) {
            setEvents((prev) => [...prev, data as WeddingEvent]);
          }
        }

        closeFormDialog();
      } catch {
        setFormError("An unexpected error occurred while saving the event.");
      }
    });
  };

  const handleDeleteEvent = async () => {
    if (!deletingEvent) return;

    startTransition(async () => {
      try {
        const supabase = createClient();
        const { error } = await supabase
          .from("wedding_events")
          .delete()
          .eq("id", deletingEvent.id)
          .eq("wedding_id", weddingId);

        if (error) {
          setFormError(error.message || "Failed to delete event.");
          return;
        }

        setEvents((prev) => prev.filter((ev) => ev.id !== deletingEvent.id));
        setDeletingEvent(null);
      } catch {
        setFormError("An unexpected error occurred while deleting the event.");
      }
    });
  };

  // Chronological sorting: dated events first (ascending), then undated events
  const datedEvents = events
    .filter((e) => !!e.event_date)
    .sort((a, b) => {
      const dateA = new Date(`${a.event_date}T${a.start_time || "00:00:00"}`).getTime();
      const dateB = new Date(`${b.event_date}T${b.start_time || "00:00:00"}`).getTime();
      return dateA - dateB;
    });

  const undatedEvents = events.filter((e) => !e.event_date);

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return null;
    const [hours, minutes] = timeStr.split(":");
    const h = parseInt(hours, 10);
    const m = minutes || "00";
    const ampm = h >= 12 ? "PM" : "AM";
    const formattedH = h % 12 === 0 ? 12 : h % 12;
    return `${formattedH}:${m} ${ampm}`;
  };

  return (
    <div className="space-y-8">
      {/* Header and Add Action */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-[var(--color-border-subtle)] pb-6">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-taupe)]">
            Phase 5 • Event Scheduling
          </span>
          <h2 className="mt-1 font-serif text-3xl font-normal tracking-tight text-[var(--color-foreground)]">
            Celebration Events & Itinerary
          </h2>
          <p className="mt-1.5 text-xs text-[var(--color-muted)] max-w-xl leading-relaxed">
            Organize multi-day wedding festivities—rehearsals, ceremonies, cocktail hours, and receptions—in chronological sequence.
          </p>
        </div>

        {userCanEdit && (
          <button
            type="button"
            onClick={openAddDialog}
            className="inline-flex items-center justify-center rounded-full bg-[var(--color-foreground)] px-5 py-2.5 text-xs font-medium text-[var(--color-background)] hover:opacity-90 transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-foreground)] shadow-xs shrink-0"
          >
            + Create Event
          </button>
        )}
      </div>

      {/* Events List or Empty State */}
      {events.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)]/60 p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-ivory)] text-2xl">
            🗓️
          </div>
          <h3 className="mt-4 font-serif text-2xl font-normal text-[var(--color-foreground)]">
            No celebration events scheduled yet
          </h3>
          <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-[var(--color-muted)]">
            Add milestones to build your wedding itinerary. Include times, locations, and descriptions so everyone knows where to be.
          </p>
          {userCanEdit && (
            <div className="mt-6">
              <button
                type="button"
                onClick={openAddDialog}
                className="rounded-full bg-[var(--color-foreground)] px-6 py-2.5 text-xs font-medium text-[var(--color-background)] hover:opacity-90 transition-opacity"
              >
                + Schedule Your First Event
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {/* Scheduled Dated Events */}
          {datedEvents.length > 0 && (
            <div className="space-y-4">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-taupe)]">
                Chronological Schedule ({datedEvents.length})
              </span>

              <div className="grid gap-4 sm:grid-cols-2">
                {datedEvents.map((event) => {
                  const formattedDate = new Date(`${event.event_date}T00:00:00`).toLocaleDateString(
                    "en-US",
                    {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    }
                  );

                  const startTimeFormatted = formatTime(event.start_time);
                  const endTimeFormatted = formatTime(event.end_time);

                  return (
                    <article
                      key={event.id}
                      className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-xs flex flex-col justify-between hover:border-[var(--color-foreground)]/30 transition-all"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-mono font-medium text-[var(--color-taupe)]">
                            {formattedDate}
                          </span>
                          {(startTimeFormatted || endTimeFormatted) && (
                            <span className="rounded-full bg-[var(--color-ivory)] px-2.5 py-0.5 text-[10px] font-mono text-[var(--color-foreground)]">
                              {startTimeFormatted}
                              {endTimeFormatted ? ` – ${endTimeFormatted}` : ""}
                            </span>
                          )}
                        </div>

                        <h3 className="mt-3 font-serif text-2xl font-normal text-[var(--color-foreground)]">
                          {event.title}
                        </h3>

                        {event.location && (
                          <p className="mt-2 text-xs text-[var(--color-muted)] flex items-center gap-1.5">
                            <svg className="h-3.5 w-3.5 text-[var(--color-taupe)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                            </svg>
                            {event.location}
                          </p>
                        )}

                        {event.description && (
                          <p className="mt-3 text-xs leading-relaxed text-[var(--color-muted)] border-t border-[var(--color-border-subtle)] pt-3">
                            {event.description}
                          </p>
                        )}
                      </div>

                      {userCanEdit && (
                        <div className="mt-5 pt-3 border-t border-[var(--color-border-subtle)] flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditDialog(event)}
                            className="rounded-md border border-[var(--color-border)] px-3 py-1 text-xs font-medium text-[var(--color-foreground)] hover:bg-[var(--color-ivory)] transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingEvent(event)}
                            className="rounded-md border border-red-200 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-900/40 dark:text-red-400 dark:hover:bg-red-950/30 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </div>
          )}

          {/* Unscheduled / Date TBD Events */}
          {undatedEvents.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-[var(--color-border-subtle)]">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-taupe)]">
                Unscheduled Events / Date TBD ({undatedEvents.length})
              </span>

              <div className="grid gap-4 sm:grid-cols-2">
                {undatedEvents.map((event) => (
                  <article
                    key={event.id}
                    className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)]/80 p-6 shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="rounded-full bg-[var(--color-ivory)] px-2.5 py-0.5 text-[10px] font-mono text-[var(--color-taupe)] uppercase tracking-wider">
                          Date to be announced
                        </span>
                      </div>

                      <h3 className="mt-3 font-serif text-2xl font-normal text-[var(--color-foreground)]">
                        {event.title}
                      </h3>

                      {event.location && (
                        <p className="mt-2 text-xs text-[var(--color-muted)] flex items-center gap-1.5">
                          <svg className="h-3.5 w-3.5 text-[var(--color-taupe)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                          </svg>
                          {event.location}
                        </p>
                      )}

                      {event.description && (
                        <p className="mt-3 text-xs leading-relaxed text-[var(--color-muted)] border-t border-[var(--color-border-subtle)] pt-3">
                          {event.description}
                        </p>
                      )}
                    </div>

                    {userCanEdit && (
                      <div className="mt-5 pt-3 border-t border-[var(--color-border-subtle)] flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditDialog(event)}
                          className="rounded-md border border-[var(--color-border)] px-3 py-1 text-xs font-medium text-[var(--color-foreground)] hover:bg-[var(--color-ivory)] transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingEvent(event)}
                          className="rounded-md border border-red-200 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-900/40 dark:text-red-400 dark:hover:bg-red-950/30 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Event Dialog */}
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
                  {editingEvent ? "Update Schedule" : "New Celebration Event"}
                </span>
                <h3 className="mt-1 font-serif text-2xl font-normal text-[var(--color-foreground)]">
                  {editingEvent ? `Edit ${editingEvent.title}` : "Schedule Wedding Event"}
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

            <form onSubmit={handleSaveEvent} className="mt-5 space-y-4">
              {/* Title */}
              <div>
                <label
                  htmlFor="eventTitle"
                  className="block text-xs font-medium uppercase tracking-wider text-[var(--color-foreground)]"
                >
                  Event Title <span className="text-red-500">*</span>
                </label>
                <input
                  id="eventTitle"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Wedding Ceremony, Welcome Dinner, Cocktail Hour"
                  className="mt-1.5 block w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3.5 py-2 text-xs text-[var(--color-foreground)] placeholder:text-[var(--color-taupe-muted)] focus:border-[var(--color-foreground)] focus:outline-hidden"
                />
              </div>

              {/* Event Date */}
              <div>
                <label
                  htmlFor="eventDate"
                  className="block text-xs font-medium uppercase tracking-wider text-[var(--color-foreground)]"
                >
                  Date (Optional)
                </label>
                <input
                  id="eventDate"
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="mt-1.5 block w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3.5 py-2 text-xs text-[var(--color-foreground)] focus:border-[var(--color-foreground)] focus:outline-hidden"
                />
              </div>

              {/* Start & End Times */}
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label
                    htmlFor="eventStartTime"
                    className="block text-xs font-medium uppercase tracking-wider text-[var(--color-foreground)]"
                  >
                    Start Time (Optional)
                  </label>
                  <input
                    id="eventStartTime"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="mt-1.5 block w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3.5 py-2 text-xs text-[var(--color-foreground)] focus:border-[var(--color-foreground)] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label
                    htmlFor="eventEndTime"
                    className="block text-xs font-medium uppercase tracking-wider text-[var(--color-foreground)]"
                  >
                    End Time (Optional)
                  </label>
                  <input
                    id="eventEndTime"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="mt-1.5 block w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3.5 py-2 text-xs text-[var(--color-foreground)] focus:border-[var(--color-foreground)] focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Location */}
              <div>
                <label
                  htmlFor="eventLocation"
                  className="block text-xs font-medium uppercase tracking-wider text-[var(--color-foreground)]"
                >
                  Location / Venue (Optional)
                </label>
                <input
                  id="eventLocation"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. St. George Chapel, Villa Bellini Terrace"
                  className="mt-1.5 block w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3.5 py-2 text-xs text-[var(--color-foreground)] placeholder:text-[var(--color-taupe-muted)] focus:border-[var(--color-foreground)] focus:outline-hidden"
                />
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="eventDescription"
                  className="block text-xs font-medium uppercase tracking-wider text-[var(--color-foreground)]"
                >
                  Description / Itinerary Details (Optional)
                </label>
                <textarea
                  id="eventDescription"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Guests arrive by 3:45 PM; cocktail attire; shuttles depart from central plaza."
                  className="mt-1.5 block w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3.5 py-2 text-xs text-[var(--color-foreground)] placeholder:text-[var(--color-taupe-muted)] focus:border-[var(--color-foreground)] focus:outline-hidden"
                />
              </div>

              {/* Buttons */}
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
                  {isPending ? "Saving..." : editingEvent ? "Save Changes" : "Create Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingEvent && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4"
        >
          <div className="w-full max-w-sm rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-xl">
            <h3 className="font-serif text-xl font-normal text-[var(--color-foreground)]">
              Remove Event?
            </h3>
            <p className="mt-2 text-xs text-[var(--color-muted)] leading-relaxed">
              Are you sure you want to remove <strong className="text-[var(--color-foreground)]">{deletingEvent.title}</strong>? This action cannot be undone.
            </p>
            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingEvent(null)}
                disabled={isPending}
                className="rounded-full border border-[var(--color-border)] px-4 py-1.5 text-xs font-medium text-[var(--color-foreground)] hover:bg-[var(--color-ivory)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteEvent}
                disabled={isPending}
                className="rounded-full bg-red-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isPending ? "Removing..." : "Delete Event"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
