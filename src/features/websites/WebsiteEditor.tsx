"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { WeddingWebsite, WebsiteTemplate, PublicEventItem } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { WebsiteTemplateRenderer } from "./templates/WebsiteTemplateRenderer";

interface WebsiteEditorProps {
  weddingId: string;
  weddingTitle: string;
  weddingDate: string | null;
  weddingLocation: string | null;
  defaultSlug: string;
  initialWebsite: WeddingWebsite | null;
  events: PublicEventItem[];
  userCanEdit: boolean;
}

export function WebsiteEditor({
  weddingId,
  weddingTitle,
  weddingDate,
  weddingLocation,
  defaultSlug,
  initialWebsite,
  events,
  userCanEdit,
}: WebsiteEditorProps) {
  const router = useRouter();

  // Smart fallback slug based on title
  const fallbackSlug = weddingTitle
    ? weddingTitle
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 32)
    : "celebration";
  const initialSlug = initialWebsite?.slug || (defaultSlug && defaultSlug !== "celebration" ? defaultSlug : fallbackSlug);

  // Form fields
  const [title, setTitle] = useState(initialWebsite?.title || weddingTitle);
  const [coupleNames, setCoupleNames] = useState(
    initialWebsite?.couple_names || weddingTitle.replace(/'s Celebration/i, "").replace(/Wedding/i, "").trim()
  );
  const [welcomeMessage, setWelcomeMessage] = useState(
    initialWebsite?.welcome_message ||
      "We cannot wait to celebrate this special day surrounded by the family and friends we cherish most."
  );
  const [story, setStory] = useState(initialWebsite?.story || "");
  const [venueDisplay, setVenueDisplay] = useState(initialWebsite?.venue_display || weddingLocation || "");
  const [dateDisplay, setDateDisplay] = useState(initialWebsite?.date_display || weddingDate || "");
  const [template, setTemplate] = useState<WebsiteTemplate>(
    initialWebsite?.template || "minimal_editorial"
  );
  const [slug, setSlug] = useState(initialSlug);
  const [isPublished, setIsPublished] = useState(initialWebsite?.is_published || false);
  const [rsvpEnabled, setRsvpEnabled] = useState(initialWebsite?.rsvp_enabled ?? true);
  const [rsvpDeadline, setRsvpDeadline] = useState(initialWebsite?.rsvp_deadline || "");
  const [askMealPreference, setAskMealPreference] = useState(initialWebsite?.ask_meal_preference ?? true);
  const [mealOptionsStr, setMealOptionsStr] = useState(
    (initialWebsite?.meal_options || ["Standard", "Vegetarian", "Vegan", "Halal", "Kosher", "Child"]).join(", ")
  );
  const [allowGuestMessage, setAllowGuestMessage] = useState(initialWebsite?.allow_guest_message ?? true);

  // UI modes & status
  const [activeView, setActiveView] = useState<"edit" | "preview">("edit");
  const [isPending, startTransition] = useTransition();
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Unsaved changes tracker
  const isDirty =
    (initialWebsite?.title || weddingTitle) !== title ||
    (initialWebsite?.couple_names || "") !== coupleNames ||
    (initialWebsite?.welcome_message || "") !== welcomeMessage ||
    (initialWebsite?.story || "") !== story ||
    (initialWebsite?.venue_display || weddingLocation || "") !== venueDisplay ||
    (initialWebsite?.date_display || weddingDate || "") !== dateDisplay ||
    (initialWebsite?.template || "minimal_editorial") !== template ||
    (initialWebsite?.slug || defaultSlug) !== slug ||
    (initialWebsite?.is_published || false) !== isPublished;

  const handleSlugChange = (raw: string) => {
    const cleaned = raw
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]/g, "")
      .replace(/--+/g, "-");
    setSlug(cleaned);
  };

  const handleCopyLink = () => {
    if (typeof window === "undefined") return;
    const origin = window.location.origin;
    const url = `${origin}/w/${slug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSave = async (forcePublishedState?: boolean, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaveSuccess(null);
    setSaveError(null);

    const cleanTitle = title.trim();
    const cleanNames = coupleNames.trim();
    const cleanSlug = slug.trim().toLowerCase();

    if (!cleanNames) {
      setSaveError("Couple names are required for the website header.");
      return;
    }
    if (!cleanSlug) {
      setSaveError("A unique URL slug is required for publication.");
      return;
    }

    const publishTarget = typeof forcePublishedState === "boolean" ? forcePublishedState : isPublished;

    const payload = {
      wedding_id: weddingId,
      title: cleanTitle || weddingTitle,
      couple_names: cleanNames,
      welcome_message: welcomeMessage.trim() || null,
      story: story.trim() || null,
      venue_display: venueDisplay.trim() || null,
      date_display: dateDisplay.trim() || null,
      template,
      slug: cleanSlug,
      is_published: publishTarget,
      rsvp_enabled: rsvpEnabled,
      rsvp_deadline: rsvpDeadline.trim() || null,
      ask_meal_preference: askMealPreference,
      meal_options: mealOptionsStr.split(",").map((s) => s.trim()).filter(Boolean),
      allow_guest_message: allowGuestMessage,
    };

    startTransition(async () => {
      try {
        const supabase = createClient();

        // Check if website record already exists
        const { data: existing, error: checkError } = await supabase
          .from("wedding_websites")
          .select("id")
          .eq("wedding_id", weddingId)
          .maybeSingle();

        if (checkError) {
          if (
            checkError.code === "42P01" ||
            checkError.message?.includes("relation") ||
            checkError.message?.includes("does not exist") ||
            checkError.message?.includes("schema cache")
          ) {
            setSaveError(
              "Database setup required: Table 'wedding_websites' does not exist in Supabase yet. Please apply migration supabase/migrations/20261029000000_wedora_phase6_websites.sql in your Supabase SQL Editor."
            );
            return;
          }
        }

        if (existing) {
          const { error } = await supabase
            .from("wedding_websites")
            .update(payload)
            .eq("wedding_id", weddingId);

          if (error) {
            if (error.code === "23505") {
              setSaveError(`The URL slug "/w/${cleanSlug}" is already taken by another wedding. Please choose a different slug.`);
            } else if (error.code === "42P01" || error.message?.includes("wedding_websites")) {
              setSaveError("Database setup required: Table 'wedding_websites' does not exist in Supabase. Please apply migration supabase/migrations/20261029000000_wedora_phase6_websites.sql.");
            } else {
              setSaveError(error.message || "Failed to update wedding website.");
            }
            return;
          }
        } else {
          const { error } = await supabase
            .from("wedding_websites")
            .insert(payload);

          if (error) {
            if (error.code === "23505") {
              setSaveError(`The URL slug "/w/${cleanSlug}" is already taken by another wedding. Please choose a different slug.`);
            } else if (error.code === "42P01" || error.message?.includes("wedding_websites")) {
              setSaveError("Database setup required: Table 'wedding_websites' does not exist in Supabase. Please apply migration supabase/migrations/20261029000000_wedora_phase6_websites.sql.");
            } else {
              setSaveError(error.message || "Failed to create wedding website.");
            }
            return;
          }
        }

        setIsPublished(publishTarget);
        router.refresh();

        setSaveSuccess(
          publishTarget
            ? `Website saved and published live at /w/${cleanSlug}`
            : "Website configuration saved (currently unpublished draft)."
        );
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
        setSaveError(`Save failed: ${msg}`);
      }
    });
  };

  const handlePublishToggle = async () => {
    const nextState = !isPublished;
    await handleSave(nextState);
  };

  const templatesList: { key: WebsiteTemplate; name: string; description: string; colors: string }[] = [
    {
      key: "minimal_editorial",
      name: "Minimal Editorial",
      description: "Charcoal typography, cream backgrounds, and refined minimal borders.",
      colors: "bg-[#faf9f5] border-[#e8e5de] text-[#1a1918]",
    },
    {
      key: "royal_indian",
      name: "Royal Indian",
      description: "Regal burgundy, warm gold ornaments, and rich celebratory borders.",
      colors: "bg-[#fcfaf6] border-[#e8dfcf] text-[#4a0e17]",
    },
    {
      key: "botanical_romance",
      name: "Botanical Romance",
      description: "Muted sage greens, eucalyptus tones, and soft organic styling.",
      colors: "bg-[#f7f9f7] border-[#d9e2dc] text-[#283830]",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-[var(--color-border-subtle)] pb-6">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-taupe)]">
            Phase 6 • Wedding Website & Digital Invitations
          </span>
          <h2 className="mt-1 font-serif text-3xl font-normal tracking-tight text-[var(--color-foreground)]">
            Wedding Website Editor
          </h2>
          <p className="mt-1.5 text-xs text-[var(--color-muted)] max-w-xl leading-relaxed">
            Customize your couple story, choose a visual palette, and publish an ad-free digital website for your guests.
          </p>
        </div>

        {/* View Switcher and Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] p-1">
            <button
              type="button"
              onClick={() => setActiveView("edit")}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
                activeView === "edit"
                  ? "bg-[var(--color-foreground)] text-[var(--color-background)] shadow-xs"
                  : "text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
              }`}
            >
              Editor
            </button>
            <button
              type="button"
              onClick={() => setActiveView("preview")}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
                activeView === "preview"
                  ? "bg-[var(--color-foreground)] text-[var(--color-background)] shadow-xs"
                  : "text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
              }`}
            >
              Live Preview
            </button>
          </div>

          {userCanEdit && (
            <button
              type="button"
              onClick={() => handleSave()}
              disabled={isPending}
              className="rounded-full bg-[var(--color-foreground)] px-5 py-2.5 text-xs font-medium text-[var(--color-background)] hover:opacity-90 transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-foreground)] disabled:opacity-50 shrink-0"
            >
              {isPending ? "Saving..." : "Save Changes"}
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {saveSuccess && (
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 text-xs text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300 flex items-center justify-between"
        >
          <span>✓ {saveSuccess}</span>
          {isPublished && (
            <Link
              href={`/w/${slug}`}
              target="_blank"
              className="font-medium underline hover:opacity-80 ml-2"
            >
              Open public website &rarr;
            </Link>
          )}
        </div>
      )}

      {saveError && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50/80 p-4 text-xs text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
        >
          {saveError}
        </div>
      )}

      {isDirty && !saveSuccess && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300 flex items-center justify-between">
          <span>You have unsaved changes in your website configuration.</span>
          <span className="font-mono text-[10px] uppercase">Unsaved Draft</span>
        </div>
      )}

      {/* Publication Banner Card */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 sm:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                isPublished ? "bg-emerald-500 animate-pulse" : "bg-[var(--color-taupe)]"
              }`}
            />
            <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-taupe)]">
              Publication Status
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                isPublished
                  ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border border-[var(--color-border)] bg-[var(--color-ivory)] text-[var(--color-taupe)]"
              }`}
            >
              {isPublished ? "Published & Live" : "Unpublished (Draft)"}
            </span>
          </div>

          <h3 className="mt-2 font-serif text-2xl font-normal text-[var(--color-foreground)]">
            Public Website URL
          </h3>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <span className="font-mono text-[var(--color-taupe-muted)]">
              {typeof window !== "undefined" ? window.location.origin : "https://wedora.com"}/w/
            </span>
            <span className="font-mono font-medium text-[var(--color-foreground)] bg-[var(--color-ivory)] px-2 py-0.5 rounded-md border border-[var(--color-border-subtle)]">
              {slug || "your-slug"}
            </span>
          </div>
        </div>

        {/* Publication Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {userCanEdit && (
            <button
              type="button"
              onClick={handlePublishToggle}
              disabled={isPending}
              className={`rounded-full px-5 py-2 text-xs font-medium transition-all disabled:opacity-50 ${
                isPublished
                  ? "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                  : "bg-emerald-700 text-white hover:bg-emerald-800"
              }`}
            >
              {isPending
                ? "Saving..."
                : isPublished
                ? "Unpublish Website"
                : "Publish to the Web"}
            </button>
          )}

          {isPublished && (
            <button
              type="button"
              onClick={handleCopyLink}
              className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-xs font-medium text-[var(--color-foreground)] hover:bg-[var(--color-ivory)] transition-colors inline-flex items-center gap-1.5"
            >
              <span>{copied ? "✓ Copied" : "📋 Copy Link"}</span>
            </button>
          )}

          {isPublished && (
            <Link
              href={`/w/${slug}`}
              target="_blank"
              className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-xs font-medium text-[var(--color-foreground)] hover:bg-[var(--color-ivory)] transition-colors inline-flex items-center gap-1"
            >
              <span>Visit Page ↗</span>
            </Link>
          )}
        </div>
      </div>

      {/* VIEW 1: EDITOR FORM */}
      {activeView === "edit" ? (
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Details Column (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Template Selection */}
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 sm:p-8">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-taupe)]">
                Step 1 • Visual Style
              </span>
              <h3 className="mt-1 font-serif text-2xl font-normal text-[var(--color-foreground)]">
                Choose Website Template
              </h3>
              <p className="mt-1 text-xs text-[var(--color-muted)]">
                Select one of three curated editorial wedding templates.
              </p>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                {templatesList.map((tmpl) => {
                  const isSelected = template === tmpl.key;
                  return (
                    <button
                      key={tmpl.key}
                      type="button"
                      onClick={() => setTemplate(tmpl.key)}
                      className={`rounded-xl border p-4 text-left transition-all relative flex flex-col justify-between ${
                        isSelected
                          ? "border-[var(--color-foreground)] ring-1 ring-[var(--color-foreground)] bg-[var(--color-ivory)]/40"
                          : "border-[var(--color-border)] hover:border-[var(--color-foreground)]/30 bg-[var(--color-background)]"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-serif text-base font-normal text-[var(--color-foreground)]">
                            {tmpl.name}
                          </span>
                          {isSelected && (
                            <span className="text-xs font-bold text-[var(--color-foreground)]">✓</span>
                          )}
                        </div>
                        <p className="mt-2 text-[11px] leading-relaxed text-[var(--color-muted)]">
                          {tmpl.description}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-[var(--color-border-subtle)]">
                        <span className="text-[9px] font-mono uppercase tracking-wider text-[var(--color-taupe)]">
                          {tmpl.key.replace("_", " ")}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content Details Form */}
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 sm:p-8 space-y-5">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-taupe)]">
                Step 2 • Invitation Details
              </span>
              <h3 className="mt-1 font-serif text-2xl font-normal text-[var(--color-foreground)]">
                Couple & Celebration Content
              </h3>

              <div>
                <label
                  htmlFor="coupleNamesInput"
                  className="block text-xs font-medium uppercase tracking-wider text-[var(--color-foreground)]"
                >
                  Couple Names <span className="text-red-500">*</span>
                </label>
                <input
                  id="coupleNamesInput"
                  type="text"
                  required
                  value={coupleNames}
                  onChange={(e) => setCoupleNames(e.target.value)}
                  placeholder="e.g. Clara Dupont & Arjun Patel"
                  className="mt-1.5 block w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3.5 py-2.5 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-taupe-muted)] focus:border-[var(--color-foreground)] focus:outline-hidden"
                />
              </div>

              <div>
                <label
                  htmlFor="websiteTitleInput"
                  className="block text-xs font-medium uppercase tracking-wider text-[var(--color-foreground)]"
                >
                  Website Header Title
                </label>
                <input
                  id="websiteTitleInput"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Clara & Arjun's Wedding"
                  className="mt-1.5 block w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3.5 py-2.5 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-taupe-muted)] focus:border-[var(--color-foreground)] focus:outline-hidden"
                />
              </div>

              <div>
                <label
                  htmlFor="welcomeMessageInput"
                  className="block text-xs font-medium uppercase tracking-wider text-[var(--color-foreground)]"
                >
                  Welcome Message for Guests
                </label>
                <textarea
                  id="welcomeMessageInput"
                  rows={3}
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                  placeholder="Write a warm note welcoming guests to your wedding website..."
                  className="mt-1.5 block w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3.5 py-2.5 text-xs text-[var(--color-foreground)] placeholder:text-[var(--color-taupe-muted)] focus:border-[var(--color-foreground)] focus:outline-hidden"
                />
              </div>

              <div>
                <label
                  htmlFor="storyInput"
                  className="block text-xs font-medium uppercase tracking-wider text-[var(--color-foreground)]"
                >
                  Our Story / How We Met (Optional)
                </label>
                <textarea
                  id="storyInput"
                  rows={4}
                  value={story}
                  onChange={(e) => setStory(e.target.value)}
                  placeholder="Share a short anecdote of how you met, your engagement story, or what this celebration means to you..."
                  className="mt-1.5 block w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3.5 py-2.5 text-xs text-[var(--color-foreground)] placeholder:text-[var(--color-taupe-muted)] focus:border-[var(--color-foreground)] focus:outline-hidden"
                />
              </div>
            </div>

            {/* RSVP Settings Card */}
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 sm:p-8 space-y-6">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-taupe)]">
                Step 3 • Guest Responses
              </span>
              <h3 className="mt-1 font-serif text-2xl font-normal text-[var(--color-foreground)]">
                Digital RSVP Preferences
              </h3>
              <p className="mt-1 text-xs text-[var(--color-muted)]">
                Configure attendance deadlines, dining options, and guest message settings.
              </p>

              <div className="space-y-4 pt-2">
                {/* Accept RSVPs Toggle */}
                <div className="flex items-center justify-between p-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-ivory)]/40">
                  <div>
                    <span className="block text-xs font-medium text-[var(--color-foreground)]">
                      Accept Online RSVPs
                    </span>
                    <span className="block text-[11px] text-[var(--color-muted)]">
                      Allow guests with invitation tokens to submit their attendance
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
                  <label
                    htmlFor="rsvpDeadlineInput"
                    className="block text-xs font-medium uppercase tracking-wider text-[var(--color-foreground)]"
                  >
                    RSVP Response Deadline
                  </label>
                  <input
                    id="rsvpDeadlineInput"
                    type="date"
                    value={rsvpDeadline}
                    onChange={(e) => setRsvpDeadline(e.target.value)}
                    className="mt-1.5 block w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3.5 py-2 text-xs text-[var(--color-foreground)] focus:border-[var(--color-foreground)] focus:outline-hidden"
                  />
                  <span className="mt-1 block text-[11px] text-[var(--color-taupe-muted)]">
                    Responses will automatically close after this date.
                  </span>
                </div>

                {/* Request Dining Preferences */}
                <div className="flex items-center justify-between p-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-ivory)]/40">
                  <div>
                    <span className="block text-xs font-medium text-[var(--color-foreground)]">
                      Request Dining Choices
                    </span>
                    <span className="block text-[11px] text-[var(--color-muted)]">
                      Provide a selection of meal choices for attending guests
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

                {askMealPreference && (
                  <div>
                    <label
                      htmlFor="mealOptionsInput"
                      className="block text-xs font-medium uppercase tracking-wider text-[var(--color-foreground)]"
                    >
                      Dining Choices (Comma separated)
                    </label>
                    <input
                      id="mealOptionsInput"
                      type="text"
                      value={mealOptionsStr}
                      onChange={(e) => setMealOptionsStr(e.target.value)}
                      placeholder="Standard, Vegetarian, Vegan, Halal, Kosher, Child"
                      className="mt-1.5 block w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3.5 py-2 text-xs text-[var(--color-foreground)] focus:border-[var(--color-foreground)] focus:outline-hidden"
                    />
                  </div>
                )}

                {/* Allow Guest Messages */}
                <div className="flex items-center justify-between p-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-ivory)]/40">
                  <div>
                    <span className="block text-xs font-medium text-[var(--color-foreground)]">
                      Guest Notes & Wishes
                    </span>
                    <span className="block text-[11px] text-[var(--color-muted)]">
                      Allow attending guests to submit a personal note
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
              </div>
            </div>
          </div>

          {/* Right Sidebar: URL Slug & Overrides (1 Col) */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 sm:p-8 space-y-5">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-taupe)]">
                Public URL Slug
              </span>
              <h3 className="mt-1 font-serif text-xl font-normal text-[var(--color-foreground)]">
                Custom Web Address
              </h3>

              <div>
                <label
                  htmlFor="slugInput"
                  className="block text-xs font-medium uppercase tracking-wider text-[var(--color-foreground)]"
                >
                  Slug (letters, numbers, hyphens)
                </label>
                <div className="mt-1.5 flex rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] overflow-hidden focus-within:border-[var(--color-foreground)]">
                  <span className="px-3 py-2 text-xs font-mono text-[var(--color-taupe)] bg-[var(--color-ivory)] border-r border-[var(--color-border)] select-none">
                    /w/
                  </span>
                  <input
                    id="slugInput"
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    placeholder="clara-and-arjun"
                    className="w-full px-3 py-2 text-xs font-mono text-[var(--color-foreground)] bg-transparent focus:outline-hidden"
                  />
                </div>
                <p className="mt-1.5 text-[10px] text-[var(--color-taupe)]">
                  Lowercase only. Hyphens replace spaces. Must be unique across Wedora.
                </p>
              </div>

              <div className="pt-4 border-t border-[var(--color-border-subtle)] space-y-4">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-taupe)]">
                  Display Overrides (Optional)
                </span>

                <div>
                  <label
                    htmlFor="venueDisplayInput"
                    className="block text-xs font-medium uppercase tracking-wider text-[var(--color-foreground)]"
                  >
                    Display Venue
                  </label>
                  <input
                    id="venueDisplayInput"
                    type="text"
                    value={venueDisplay}
                    onChange={(e) => setVenueDisplay(e.target.value)}
                    placeholder={weddingLocation || "e.g. Tuscany, Italy"}
                    className="mt-1.5 block w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-xs text-[var(--color-foreground)] placeholder:text-[var(--color-taupe-muted)] focus:border-[var(--color-foreground)] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label
                    htmlFor="dateDisplayInput"
                    className="block text-xs font-medium uppercase tracking-wider text-[var(--color-foreground)]"
                  >
                    Display Date
                  </label>
                  <input
                    id="dateDisplayInput"
                    type="text"
                    value={dateDisplay}
                    onChange={(e) => setDateDisplay(e.target.value)}
                    placeholder={weddingDate || "e.g. 2027-06-18"}
                    className="mt-1.5 block w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-xs text-[var(--color-foreground)] placeholder:text-[var(--color-taupe-muted)] focus:border-[var(--color-foreground)] focus:outline-hidden"
                  />
                </div>
              </div>

              {userCanEdit && (
                <div className="pt-4 border-t border-[var(--color-border-subtle)]">
                  <button
                    type="button"
                    onClick={() => handleSave()}
                    disabled={isPending}
                    className="w-full rounded-full bg-[var(--color-foreground)] py-2.5 text-xs font-medium text-[var(--color-background)] hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {isPending ? "Saving configuration..." : "Save Configuration"}
                  </button>
                </div>
              )}
            </div>

            {/* Events Preview Badge */}
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[var(--color-foreground)]">
                  Included Events ({events.length})
                </span>
                <span className="text-[10px] font-mono text-[var(--color-taupe)]">
                  Auto-synced
                </span>
              </div>
              <p className="mt-1 text-[11px] text-[var(--color-muted)] leading-relaxed">
                All events created in your Events itinerary are rendered chronologically on your public website.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* VIEW 2: LIVE PREVIEW CONTAINER */
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-[var(--color-surface)] p-3 rounded-xl border border-[var(--color-border)]">
            <span className="text-xs text-[var(--color-muted)]">
              Interactive Previewing: <strong className="text-[var(--color-foreground)] font-serif capitalize">{template.replace("_", " ")}</strong> template
            </span>
            <button
              type="button"
              onClick={() => setActiveView("edit")}
              className="text-xs font-medium text-[var(--color-foreground)] underline hover:opacity-80"
            >
              Return to Editor
            </button>
          </div>

          <div className="shadow-2xl rounded-2xl overflow-hidden border border-[var(--color-border)]">
            <WebsiteTemplateRenderer
              template={template}
              title={title}
              coupleNames={coupleNames}
              welcomeMessage={welcomeMessage}
              story={story}
              venueDisplay={venueDisplay}
              dateDisplay={dateDisplay}
              events={events}
              isPreview={true}
            />
          </div>
        </div>
      )}
    </div>
  );
}
