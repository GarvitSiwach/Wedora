"use client";

import { useState, useTransition, useMemo } from "react";
import {
  WeddingGuest,
  WeddingEvent,
  WeddingWebsite,
  WeddingCateringPlan,
  CateringStatus,
  MealCategoryPlan,
} from "@/types";
import { createClient } from "@/lib/supabase/client";

interface CateringManagerProps {
  weddingId: string;
  weddingTitle: string;
  events: WeddingEvent[];
  guests: WeddingGuest[];
  website: WeddingWebsite | null;
  initialCateringPlans?: WeddingCateringPlan[];
  userCanEdit: boolean;
}

const DEFAULT_MEAL_CATEGORIES = [
  "Standard",
  "Vegetarian",
  "Vegan",
  "Halal",
  "Kosher",
  "Child",
];

const SERVICE_STYLES = [
  "Plated Dinner (Multi-Course)",
  "Buffet Style",
  "Family-Style Sharing",
  "Cocktail & Canapés",
  "Live Food Stations",
  "Dessert & Cake Reception",
  "Bar & Beverage Service",
  "Brunch & Refreshments",
];

export function CateringManager({
  weddingId,
  weddingTitle,
  events,
  guests,
  website,
  initialCateringPlans = [],
  userCanEdit,
}: CateringManagerProps) {
  const [cateringPlans, setCateringPlans] = useState<WeddingCateringPlan[]>(
    initialCateringPlans
  );
  const [selectedEventId, setSelectedEventId] = useState<string>("all");
  const [activeSubTab, setActiveSubTab] = useState<"plans" | "summary" | "dietary">(
    "plans"
  );
  const [searchDietary, setSearchDietary] = useState("");

  // Modal / Plan Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<WeddingCateringPlan | null>(null);
  const [formEventId, setFormEventId] = useState<string>("");
  const [formStatus, setFormStatus] = useState<CateringStatus>("not_started");
  const [formCatererName, setFormCatererName] = useState("");
  const [formContactName, setFormContactName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formServiceStyle, setFormServiceStyle] = useState("");
  const [formMenuNotes, setFormMenuNotes] = useState("");
  const [formCategories, setFormCategories] = useState<MealCategoryPlan[]>([]);
  const [formDeadline, setFormDeadline] = useState("");
  const [formDietaryNotes, setFormDietaryNotes] = useState("");
  const [formSpecialInstructions, setFormSpecialInstructions] = useState("");
  const [formBudget, setFormBudget] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  // Deletion Confirmation State
  const [planToDelete, setPlanToDelete] = useState<WeddingCateringPlan | null>(null);

  const [isPending, startTransition] = useTransition();

  // ============================================================================
  // ATTENDANCE & HEADCOUNT CALCULATIONS
  // ============================================================================

  const confirmedGuests = useMemo(
    () => guests.filter((g) => g.invitation_status === "confirmed"),
    [guests]
  );

  const pendingGuests = useMemo(
    () =>
      guests.filter(
        (g) =>
          g.invitation_status === "pending" || g.invitation_status === "invited"
      ),
    [guests]
  );

  const declinedGuests = useMemo(
    () => guests.filter((g) => g.invitation_status === "declined"),
    [guests]
  );

  // Total confirmed headcount factoring party size (attendee_count >= 1)
  const totalConfirmedHeadcount = useMemo(
    () =>
      confirmedGuests.reduce(
        (sum, g) => sum + (g.attendee_count && g.attendee_count > 0 ? g.attendee_count : 1),
        0
      ),
    [confirmedGuests]
  );

  // Confirmed attendees with dietary requirements or notes
  const confirmedWithDietaryNotes = useMemo(
    () =>
      confirmedGuests.filter(
        (g) =>
          (g.dietary_notes && g.dietary_notes.trim().length > 0) ||
          (g.meal_preference &&
            !["standard", "none", ""].includes(
              g.meal_preference.trim().toLowerCase()
            ))
      ),
    [confirmedGuests]
  );

  const mealOptions = website?.meal_options;

  // Meal Preference Breakdown from RSVP schema
  const mealSummaryBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    let notSpecifiedCount = 0;

    // Seed configured options from website settings or standard defaults
    const knownOptions =
      mealOptions && mealOptions.length > 0
        ? mealOptions
        : DEFAULT_MEAL_CATEGORIES;

    knownOptions.forEach((opt) => {
      counts[opt] = 0;
    });

    confirmedGuests.forEach((g) => {
      const partyCount = g.attendee_count && g.attendee_count > 0 ? g.attendee_count : 1;
      const pref = g.meal_preference ? g.meal_preference.trim() : null;

      if (!pref) {
        notSpecifiedCount += partyCount;
      } else {
        // Match case-insensitively with known options or store custom
        const match = knownOptions.find(
          (o) => o.toLowerCase() === pref.toLowerCase()
        );
        const key = match || pref;
        counts[key] = (counts[key] || 0) + partyCount;
      }
    });

    return {
      categoryCounts: Object.entries(counts).map(([name, count]) => ({
        name,
        count,
        percentage:
          totalConfirmedHeadcount > 0
            ? Math.round((count / totalConfirmedHeadcount) * 100)
            : 0,
      })),
      notSpecifiedCount,
      notSpecifiedPercentage:
        totalConfirmedHeadcount > 0
          ? Math.round((notSpecifiedCount / totalConfirmedHeadcount) * 100)
          : 0,
    };
  }, [confirmedGuests, totalConfirmedHeadcount, mealOptions]);

  // Events with catering plans
  const eventsWithCatering = useMemo(() => {
    const plannedEventIds = new Set(
      cateringPlans.map((p) => p.event_id).filter(Boolean)
    );
    return events.filter((e) => plannedEventIds.has(e.id));
  }, [events, cateringPlans]);

  // Outstanding catering plans
  const outstandingCount = useMemo(() => {
    // Events without a plan
    const unplannedEventsCount = events.filter(
      (e) => !cateringPlans.some((p) => p.event_id === e.id)
    ).length;

    // Plus existing plans that are still in "not_started" or "planning"
    const inProgressPlansCount = cateringPlans.filter(
      (p) => p.status === "not_started" || p.status === "planning"
    ).length;

    return unplannedEventsCount + inProgressPlansCount;
  }, [events, cateringPlans]);

  // Filtered catering plans by selected event
  const visiblePlans = useMemo(() => {
    if (selectedEventId === "all") return cateringPlans;
    if (selectedEventId === "general") {
      return cateringPlans.filter((p) => !p.event_id);
    }
    return cateringPlans.filter((p) => p.event_id === selectedEventId);
  }, [cateringPlans, selectedEventId]);

  // Filtered dietary guests for the dietary tab
  const filteredDietaryGuests = useMemo(() => {
    const q = searchDietary.toLowerCase().trim();
    if (!q) return confirmedWithDietaryNotes;
    return confirmedWithDietaryNotes.filter(
      (g) =>
        g.full_name.toLowerCase().includes(q) ||
        (g.dietary_notes && g.dietary_notes.toLowerCase().includes(q)) ||
        (g.meal_preference && g.meal_preference.toLowerCase().includes(q)) ||
        (g.household_name && g.household_name.toLowerCase().includes(q))
    );
  }, [confirmedWithDietaryNotes, searchDietary]);

  // ============================================================================
  // FORM / MODAL HANDLERS
  // ============================================================================

  const openCreateModal = (targetEventId?: string) => {
    setEditingPlan(null);
    setFormEventId(targetEventId || (events.length > 0 ? events[0].id : ""));
    setFormStatus("planning");
    setFormCatererName("");
    setFormContactName("");
    setFormEmail("");
    setFormPhone("");
    setFormServiceStyle("Plated Dinner (Multi-Course)");
    setFormMenuNotes("");
    setFormDeadline("");
    setFormDietaryNotes("");
    setFormSpecialInstructions("");
    setFormBudget("");
    setFormError(null);

    // Initial default meal categories
    const initialCategories: MealCategoryPlan[] = (
      website?.meal_options || DEFAULT_MEAL_CATEGORIES
    ).map((cat) => {
      const rsvpCount =
        mealSummaryBreakdown.categoryCounts.find(
          (c) => c.name.toLowerCase() === cat.toLowerCase()
        )?.count || 0;
      return {
        category: cat,
        planned_count: rsvpCount,
        notes: "",
      };
    });

    setFormCategories(initialCategories);
    setIsFormOpen(true);
  };

  const openEditModal = (plan: WeddingCateringPlan) => {
    setEditingPlan(plan);
    setFormEventId(plan.event_id || "");
    setFormStatus(plan.status || "not_started");
    setFormCatererName(plan.caterer_name || "");
    setFormContactName(plan.caterer_contact_name || "");
    setFormEmail(plan.caterer_email || "");
    setFormPhone(plan.caterer_phone || "");
    setFormServiceStyle(plan.service_style || "");
    setFormMenuNotes(plan.menu_notes || "");
    setFormDeadline(plan.catering_deadline || "");
    setFormDietaryNotes(plan.dietary_notes || "");
    setFormSpecialInstructions(plan.special_instructions || "");
    setFormBudget(
      plan.budget_estimate !== null && plan.budget_estimate !== undefined
        ? String(plan.budget_estimate)
        : ""
    );
    setFormCategories(
      Array.isArray(plan.meal_categories) && plan.meal_categories.length > 0
        ? plan.meal_categories
        : DEFAULT_MEAL_CATEGORIES.map((c) => ({
            category: c,
            planned_count: 0,
            notes: "",
          }))
    );
    setFormError(null);
    setIsFormOpen(true);
  };

  const closeFormModal = () => {
    setIsFormOpen(false);
    setEditingPlan(null);
    setFormError(null);
  };

  const handleAddCategoryRow = () => {
    setFormCategories((prev) => [
      ...prev,
      { category: "", planned_count: 0, notes: "" },
    ]);
  };

  const handleRemoveCategoryRow = (index: number) => {
    setFormCategories((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCategoryChange = (
    index: number,
    field: keyof MealCategoryPlan,
    value: string | number
  ) => {
    setFormCategories((prev) =>
      prev.map((cat, i) => (i === index ? { ...cat, [field]: value } : cat))
    );
  };

  const handlePreFillRsvpCounts = () => {
    setFormCategories((prev) =>
      prev.map((item) => {
        const found = mealSummaryBreakdown.categoryCounts.find(
          (c) => c.name.toLowerCase() === item.category.trim().toLowerCase()
        );
        return {
          ...item,
          planned_count: found ? found.count : item.planned_count,
        };
      })
    );
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userCanEdit) return;
    setFormError(null);

    // Validate if event has duplicate plan
    const targetEventId = formEventId.trim() || null;
    const isDuplicate = cateringPlans.some(
      (p) =>
        p.id !== editingPlan?.id &&
        targetEventId !== null &&
        p.event_id === targetEventId
    );

    if (isDuplicate) {
      setFormError(
        "A catering plan already exists for this wedding event. Please edit the existing plan or choose a different event."
      );
      return;
    }

    // Filter valid categories
    const cleanedCategories = formCategories
      .map((c) => ({
        category: c.category.trim(),
        planned_count: Number(c.planned_count) || 0,
        notes: c.notes ? c.notes.trim() : "",
      }))
      .filter((c) => c.category.length > 0);

    const parsedBudget = formBudget.trim() ? parseFloat(formBudget) : null;

    const payload = {
      wedding_id: weddingId,
      event_id: targetEventId,
      caterer_name: formCatererName.trim() || null,
      caterer_contact_name: formContactName.trim() || null,
      caterer_email: formEmail.trim() || null,
      caterer_phone: formPhone.trim() || null,
      status: formStatus,
      service_style: formServiceStyle.trim() || null,
      menu_notes: formMenuNotes.trim() || null,
      meal_categories: cleanedCategories,
      catering_deadline: formDeadline.trim() || null,
      dietary_notes: formDietaryNotes.trim() || null,
      special_instructions: formSpecialInstructions.trim() || null,
      budget_estimate: parsedBudget && !isNaN(parsedBudget) ? parsedBudget : null,
    };

    startTransition(async () => {
      try {
        const supabase = createClient();

        if (editingPlan) {
          const { data, error } = await supabase
            .from("wedding_catering_plans")
            .update(payload)
            .eq("id", editingPlan.id)
            .eq("wedding_id", weddingId)
            .select(`
              *,
              event:wedding_events (
                id,
                title,
                event_date,
                start_time,
                location
              )
            `)
            .single();

          if (error) {
            setFormError(error.message || "Failed to update catering plan.");
            return;
          }

          if (data) {
            setCateringPlans((prev) =>
              prev.map((p) =>
                p.id === editingPlan.id ? (data as unknown as WeddingCateringPlan) : p
              )
            );
            setFeedbackNotice("Catering plan updated successfully.");
            setTimeout(() => setFeedbackNotice(null), 3000);
          }
        } else {
          const { data, error } = await supabase
            .from("wedding_catering_plans")
            .insert(payload)
            .select(`
              *,
              event:wedding_events (
                id,
                title,
                event_date,
                start_time,
                location
              )
            `)
            .single();

          if (error) {
            setFormError(error.message || "Failed to create catering plan.");
            return;
          }

          if (data) {
            setCateringPlans((prev) => [...prev, data as unknown as WeddingCateringPlan]);
            setFeedbackNotice("New catering plan created successfully.");
            setTimeout(() => setFeedbackNotice(null), 3000);
          }
        }

        closeFormModal();
      } catch {
        setFormError("An unexpected error occurred while saving the catering plan.");
      }
    });
  };

  const handleDeletePlan = async () => {
    if (!planToDelete || !userCanEdit) return;

    startTransition(async () => {
      try {
        const supabase = createClient();
        const { error } = await supabase
          .from("wedding_catering_plans")
          .delete()
          .eq("id", planToDelete.id)
          .eq("wedding_id", weddingId);

        if (error) {
          alert(`Failed to delete catering plan: ${error.message}`);
          return;
        }

        setCateringPlans((prev) => prev.filter((p) => p.id !== planToDelete.id));
        setPlanToDelete(null);
        setFeedbackNotice("Catering plan removed.");
        setTimeout(() => setFeedbackNotice(null), 3000);
      } catch {
        alert("An error occurred while deleting the plan.");
      }
    });
  };

  const getStatusBadge = (status: CateringStatus) => {
    switch (status) {
      case "completed":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-800 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
            Completed
          </span>
        );
      case "confirmed":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-medium text-blue-800 border border-blue-200/60 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/40">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
            Confirmed
          </span>
        );
      case "planning":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-medium text-amber-800 border border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-600 dark:bg-amber-400" />
            Planning
          </span>
        );
      case "not_started":
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-0.5 text-[11px] font-medium text-neutral-600 border border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700">
            <span className="h-1.5 w-1.5 rounded-full bg-neutral-400" />
            Not Started
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Toast Feedback */}
      {feedbackNotice && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 shadow-lg dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-100 animate-in fade-in slide-in-from-bottom-2">
          {feedbackNotice}
        </div>
      )}

      {/* Top Banner / Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--color-border-subtle)] pb-6">
        <div>
          <span className="block text-[10px] font-mono uppercase tracking-widest text-[var(--color-taupe)]">
            {weddingTitle ? `${weddingTitle} • ` : ""}Culinary & Catering
          </span>
          <h1 className="mt-1 font-serif text-3xl sm:text-4xl font-normal text-[var(--color-foreground)] tracking-tight">
            Food Preferences & Catering
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted)] max-w-2xl leading-relaxed">
            Coordinate menus, dietary flags, and planned meal headcounts for your wedding events. Connects live with RSVP responses.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {userCanEdit && (
            <button
              type="button"
              onClick={() => openCreateModal()}
              className="rounded-full bg-[var(--color-foreground)] px-4 py-2 text-xs font-medium text-[var(--color-background)] hover:opacity-90 transition-opacity inline-flex items-center gap-1.5 shadow-xs"
            >
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span>Add Catering Plan</span>
            </button>
          )}
        </div>
      </div>

      {/* 5 Core Dashboard Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* 1. Total Confirmed Attendees */}
        <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/40 dark:border-emerald-900/40 dark:bg-emerald-950/20 p-5 shadow-xs">
          <span className="block text-[10px] font-mono uppercase tracking-widest text-emerald-800 dark:text-emerald-300">
            Confirmed Attendees
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-serif text-3xl sm:text-4xl font-normal text-emerald-900 dark:text-emerald-100">
              {totalConfirmedHeadcount}
            </span>
            <span className="text-xs text-emerald-700 dark:text-emerald-400">headcount</span>
          </div>
          <span className="mt-1.5 block text-[11px] text-emerald-800/80 dark:text-emerald-300/80 truncate">
            {confirmedGuests.length} parties ({pendingGuests.length} pending, {declinedGuests.length} declined)
          </span>
        </div>

        {/* 2. Expected Meal Count */}
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-xs">
          <span className="block text-[10px] font-mono uppercase tracking-widest text-[var(--color-taupe)]">
            Expected Meal Count
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-serif text-3xl sm:text-4xl font-normal text-[var(--color-foreground)]">
              {totalConfirmedHeadcount}
            </span>
            <span className="text-xs text-[var(--color-muted)]">meals</span>
          </div>
          <span className="mt-1.5 block text-[11px] text-[var(--color-taupe-muted)]">
            Based on confirmed RSVPs
          </span>
        </div>

        {/* 3. Confirmed Attendees with Dietary Requirements */}
        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/40 dark:border-amber-900/40 dark:bg-amber-950/20 p-5 shadow-xs">
          <span className="block text-[10px] font-mono uppercase tracking-widest text-amber-800 dark:text-amber-300">
            Dietary Requirements
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-serif text-3xl sm:text-4xl font-normal text-amber-900 dark:text-amber-100">
              {confirmedWithDietaryNotes.length}
            </span>
            <span className="text-xs text-amber-700 dark:text-amber-400">guests</span>
          </div>
          <span className="mt-1.5 block text-[11px] text-amber-800/80 dark:text-amber-300/80">
            Special notes & allergies
          </span>
        </div>

        {/* 4. Wedding Events with Catering Plans */}
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-xs">
          <span className="block text-[10px] font-mono uppercase tracking-widest text-[var(--color-taupe)]">
            Events Planned
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-serif text-3xl sm:text-4xl font-normal text-[var(--color-foreground)]">
              {eventsWithCatering.length}
            </span>
            <span className="text-xs text-[var(--color-muted)]">of {events.length} events</span>
          </div>
          <span className="mt-1.5 block text-[11px] text-[var(--color-taupe-muted)]">
            {events.length > 0
              ? `${Math.round((eventsWithCatering.length / events.length) * 100)}% scheduled`
              : "No events created"}
          </span>
        </div>

        {/* 5. Outstanding Catering Plans */}
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-xs">
          <span className="block text-[10px] font-mono uppercase tracking-widest text-[var(--color-taupe)]">
            Outstanding Plans
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-serif text-3xl sm:text-4xl font-normal text-[var(--color-foreground)]">
              {outstandingCount}
            </span>
            <span className="text-xs text-[var(--color-muted)]">action items</span>
          </div>
          <span className="mt-1.5 block text-[11px] text-[var(--color-taupe-muted)]">
            Unplanned or in progress
          </span>
        </div>
      </div>

      {/* Sub-navigation tabs: Event Plans | Meal Summary | Dietary Notes */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[var(--color-border)] pb-2">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveSubTab("plans")}
            className={`px-4 py-2 text-xs font-medium rounded-full transition-colors whitespace-nowrap ${
              activeSubTab === "plans"
                ? "bg-[var(--color-foreground)] text-[var(--color-background)]"
                : "text-[var(--color-muted)] hover:bg-[var(--color-ivory)] hover:text-[var(--color-foreground)]"
            }`}
          >
            Event Catering Plans ({cateringPlans.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab("summary")}
            className={`px-4 py-2 text-xs font-medium rounded-full transition-colors whitespace-nowrap ${
              activeSubTab === "summary"
                ? "bg-[var(--color-foreground)] text-[var(--color-background)]"
                : "text-[var(--color-muted)] hover:bg-[var(--color-ivory)] hover:text-[var(--color-foreground)]"
            }`}
          >
            Live RSVP Meal Summary
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab("dietary")}
            className={`px-4 py-2 text-xs font-medium rounded-full transition-colors whitespace-nowrap ${
              activeSubTab === "dietary"
                ? "bg-[var(--color-foreground)] text-[var(--color-background)]"
                : "text-[var(--color-muted)] hover:bg-[var(--color-ivory)] hover:text-[var(--color-foreground)]"
            }`}
          >
            Dietary Requirements & Notes ({confirmedWithDietaryNotes.length})
          </button>
        </div>

        {activeSubTab === "plans" && events.length > 0 && (
          <div className="flex items-center gap-2">
            <label htmlFor="filter-event-select" className="text-xs text-[var(--color-muted)] shrink-0">
              Filter by Event:
            </label>
            <select
              id="filter-event-select"
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="text-xs rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-[var(--color-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--color-foreground)]"
            >
              <option value="all">All Events & Plans ({cateringPlans.length})</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title} {ev.event_date ? `(${ev.event_date})` : ""}
                </option>
              ))}
              <option value="general">General / Unassigned</option>
            </select>
          </div>
        )}
      </div>

      {/* ============================================================================ */}
      {/* SUB-TAB 1: EVENT-SPECIFIC CATERING PLANS */}
      {/* ============================================================================ */}
      {activeSubTab === "plans" && (
        <div className="space-y-6">
          {/* Quick Notice about event-aware planning */}
          <div className="rounded-2xl border border-[var(--color-champagne-border)] bg-[var(--color-ivory)] p-4 text-xs text-[var(--color-muted)] flex items-start gap-3">
            <span className="text-base shrink-0" aria-hidden="true">
              💡
            </span>
            <div className="leading-relaxed">
              <span className="font-semibold text-[var(--color-foreground)]">
                Event-Aware Catering Coordination:
              </span>{" "}
              Each celebration event (rehearsal dinner, ceremony cocktail, plated reception) can have its own vendor, service format, and confirmed contracted numbers. Live RSVP numbers provide a baseline to inform your contract quantities.
            </div>
          </div>

          {/* List of plans */}
          {visiblePlans.length === 0 ? (
            <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center max-w-xl mx-auto space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-ivory)] text-2xl">
                🍽️
              </div>
              <h3 className="font-serif text-2xl text-[var(--color-foreground)]">
                No Catering Plans Yet
              </h3>
              <p className="text-xs text-[var(--color-muted)] leading-relaxed">
                {events.length > 0
                  ? "Select one of your celebration events below to create a catering coordination plan with menu notes, vendor contacts, and meal allocations."
                  : "Start by creating wedding events in your Events tab, then attach catering plans and menus to each event."}
              </p>
              {userCanEdit && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => openCreateModal()}
                    className="rounded-full bg-[var(--color-foreground)] px-5 py-2.5 text-xs font-medium text-[var(--color-background)] hover:opacity-90 transition-opacity inline-flex items-center gap-2"
                  >
                    <span>Create First Catering Plan</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {visiblePlans.map((plan) => {
                const associatedEvent = events.find((e) => e.id === plan.event_id);
                const plannedTotalMeals = (plan.meal_categories || []).reduce(
                  (sum, c) => sum + (Number(c.planned_count) || 0),
                  0
                );

                return (
                  <div
                    key={plan.id}
                    className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 sm:p-7 shadow-xs flex flex-col justify-between space-y-6 hover:border-[var(--color-border-strong)] transition-colors"
                  >
                    <div className="space-y-4">
                      {/* Card Header: Event title & status badge */}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="block text-[10px] font-mono uppercase tracking-widest text-[var(--color-taupe)]">
                            {associatedEvent
                              ? `Event: ${associatedEvent.title}`
                              : "General Celebration Catering"}
                          </span>
                          <h3 className="mt-1 font-serif text-2xl font-normal text-[var(--color-foreground)]">
                            {plan.caterer_name || "Unassigned Caterer"}
                          </h3>
                          {associatedEvent?.event_date && (
                            <span className="mt-0.5 inline-block text-xs text-[var(--color-muted)]">
                              📅 {associatedEvent.event_date}
                              {associatedEvent.start_time ? ` at ${associatedEvent.start_time}` : ""}
                              {associatedEvent.location ? ` • 📍 ${associatedEvent.location}` : ""}
                            </span>
                          )}
                        </div>
                        <div>{getStatusBadge(plan.status)}</div>
                      </div>

                      {/* Service Style & Deadlines */}
                      <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                        <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-ivory)] p-3">
                          <span className="block text-[10px] uppercase font-mono text-[var(--color-taupe)]">
                            Service Format
                          </span>
                          <span className="mt-0.5 block font-medium text-[var(--color-foreground)]">
                            {plan.service_style || "To be confirmed"}
                          </span>
                        </div>

                        <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-ivory)] p-3">
                          <span className="block text-[10px] uppercase font-mono text-[var(--color-taupe)]">
                            Final Count Deadline
                          </span>
                          <span className="mt-0.5 block font-medium text-[var(--color-foreground)]">
                            {plan.catering_deadline || "Not specified"}
                          </span>
                        </div>
                      </div>

                      {/* Menu descriptions */}
                      {plan.menu_notes && (
                        <div className="space-y-1">
                          <span className="block text-[10px] font-mono uppercase tracking-widest text-[var(--color-taupe)]">
                            Menu & Course Notes
                          </span>
                          <p className="text-xs text-[var(--color-foreground)] leading-relaxed whitespace-pre-line bg-[var(--color-surface-muted)]/60 rounded-xl p-3 border border-[var(--color-border-subtle)]">
                            {plan.menu_notes}
                          </p>
                        </div>
                      )}

                      {/* Planned Meal Categories breakdown */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-taupe)]">
                            Planned Meal Allocations
                          </span>
                          <span className="font-medium text-[var(--color-foreground)] text-xs">
                            Total Planned:{" "}
                            <span className="font-serif text-sm font-semibold">
                              {plannedTotalMeals}
                            </span>{" "}
                            meals
                          </span>
                        </div>

                        {plan.meal_categories && plan.meal_categories.length > 0 ? (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {plan.meal_categories.map((cat, idx) => (
                              <div
                                key={idx}
                                className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-muted)] px-3 py-2 text-xs"
                              >
                                <span className="block text-[11px] text-[var(--color-muted)] truncate">
                                  {cat.category}
                                </span>
                                <span className="block font-serif text-lg font-normal text-[var(--color-foreground)]">
                                  {cat.planned_count}{" "}
                                  <span className="text-[10px] font-sans text-[var(--color-taupe)]">
                                    qty
                                  </span>
                                </span>
                                {cat.notes && (
                                  <span className="block text-[10px] text-[var(--color-taupe)] truncate">
                                    {cat.notes}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-[var(--color-taupe)] italic">
                            No meal category allocations set yet.
                          </p>
                        )}
                      </div>

                      {/* Private vendor contact information (member-only) */}
                      {(plan.caterer_contact_name || plan.caterer_email || plan.caterer_phone) && (
                        <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-3 text-xs space-y-1">
                          <span className="block text-[10px] font-mono uppercase tracking-widest text-[var(--color-taupe)]">
                            Private Vendor Contact (Collaborators Only)
                          </span>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--color-muted)]">
                            {plan.caterer_contact_name && (
                              <span className="font-medium text-[var(--color-foreground)]">
                                👤 {plan.caterer_contact_name}
                              </span>
                            )}
                            {plan.caterer_email && (
                              <a
                                href={`mailto:${plan.caterer_email}`}
                                className="text-blue-600 hover:underline dark:text-blue-400"
                              >
                                ✉️ {plan.caterer_email}
                              </a>
                            )}
                            {plan.caterer_phone && (
                              <a
                                href={`tel:${plan.caterer_phone}`}
                                className="text-blue-600 hover:underline dark:text-blue-400"
                              >
                                📞 {plan.caterer_phone}
                              </a>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Special instructions */}
                      {plan.special_instructions && (
                        <div className="text-xs text-[var(--color-muted)] bg-[var(--color-ivory)] rounded-xl p-3 border border-[var(--color-champagne-border)]">
                          <span className="block font-semibold text-[var(--color-foreground)] text-[11px] mb-0.5">
                            Kitchen & Setup Instructions:
                          </span>
                          <p className="leading-relaxed whitespace-pre-line">
                            {plan.special_instructions}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Card Actions */}
                    {userCanEdit && (
                      <div className="flex items-center justify-end gap-2 border-t border-[var(--color-border-subtle)] pt-4">
                        <button
                          type="button"
                          onClick={() => setPlanToDelete(plan)}
                          className="rounded-full border border-red-200 px-3.5 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/30 transition-colors"
                        >
                          Delete
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(plan)}
                          className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-1.5 text-xs font-medium text-[var(--color-foreground)] hover:bg-[var(--color-ivory)] transition-colors"
                        >
                          Edit Plan & Quantities
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Unplanned Events Suggestions */}
          {events.length > visiblePlans.length && (
            <div className="rounded-3xl border border-dashed border-[var(--color-border)] p-6 bg-[var(--color-ivory)]/50 space-y-3">
              <span className="block text-[10px] font-mono uppercase tracking-widest text-[var(--color-taupe)]">
                Celebration Events Awaiting Catering Plans
              </span>
              <div className="flex flex-wrap gap-2">
                {events
                  .filter((e) => !cateringPlans.some((p) => p.event_id === e.id))
                  .map((ev) => (
                    <div
                      key={ev.id}
                      className="inline-flex items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-xs"
                    >
                      <span className="font-medium text-[var(--color-foreground)]">
                        {ev.title}
                      </span>
                      {ev.event_date && (
                        <span className="text-[11px] text-[var(--color-taupe)]">
                          ({ev.event_date})
                        </span>
                      )}
                      {userCanEdit && (
                        <button
                          type="button"
                          onClick={() => openCreateModal(ev.id)}
                          className="ml-2 text-xs text-blue-600 hover:underline dark:text-blue-400 font-medium"
                        >
                          + Create Plan
                        </button>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================================ */}
      {/* SUB-TAB 2: LIVE RSVP MEAL SUMMARY */}
      {/* ============================================================================ */}
      {activeSubTab === "summary" && (
        <div className="space-y-6">
          {/* Rule 7 Notice: Wedding-wide baseline explanation */}
          <div className="rounded-2xl border border-amber-300/70 bg-amber-50/60 dark:border-amber-900/50 dark:bg-amber-950/20 p-4 text-xs text-amber-950 dark:text-amber-200 flex items-start gap-3">
            <span className="text-base shrink-0" aria-hidden="true">
              ℹ️
            </span>
            <div className="leading-relaxed">
              <span className="font-semibold">Calculated Wedding-Wide Estimates:</span>{" "}
              In Wedora, guest RSVP responses and meal choices are submitted at the general celebration level. These figures represent live, wedding-wide confirmed attendees and should serve as baseline estimates. For specific events with distinct guest lists or timing, confirm contracted meal counts in your individual Event Catering Plans.
            </div>
          </div>

          {/* Breakdown Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mealSummaryBreakdown.categoryCounts.map((category) => (
              <div
                key={category.name}
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[var(--color-foreground)]">
                    {category.name} Meals
                  </span>
                  <span className="rounded-full bg-[var(--color-ivory)] border border-[var(--color-border-subtle)] px-2 py-0.5 text-[10px] font-mono text-[var(--color-taupe)]">
                    {category.percentage}%
                  </span>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="font-serif text-3xl font-normal text-[var(--color-foreground)]">
                    {category.count}
                  </span>
                  <span className="text-xs text-[var(--color-muted)]">meals required</span>
                </div>

                {/* Progress Visual Bar */}
                <div className="h-1.5 w-full bg-[var(--color-ivory)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--color-foreground)] rounded-full transition-all duration-500"
                    style={{ width: `${category.percentage}%` }}
                  />
                </div>
              </div>
            ))}

            {/* Missing / Not Specified Category */}
            <div className="rounded-2xl border border-dashed border-[var(--color-border-strong)] bg-[var(--color-ivory)]/60 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[var(--color-taupe)]">
                  Not Specified / Missing
                </span>
                <span className="rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] px-2 py-0.5 text-[10px] font-mono text-[var(--color-taupe)]">
                  {mealSummaryBreakdown.notSpecifiedPercentage}%
                </span>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="font-serif text-3xl font-normal text-[var(--color-foreground)]">
                  {mealSummaryBreakdown.notSpecifiedCount}
                </span>
                <span className="text-xs text-[var(--color-muted)]">attendees</span>
              </div>

              <p className="text-[11px] text-[var(--color-taupe-muted)] leading-relaxed">
                Confirmed guests who have not chosen a meal preference. Standard meals are typically planned as defaults.
              </p>
            </div>
          </div>

          {/* Quick comparison with confirmed event catering quantities */}
          <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 space-y-4">
            <h3 className="font-serif text-xl font-normal text-[var(--color-foreground)]">
              Caterer Contracted vs. Live RSVP Comparison
            </h3>
            <p className="text-xs text-[var(--color-muted)] leading-relaxed">
              Compare your live RSVP totals with the planned quantities recorded in your catering contracts across all events.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[var(--color-border)] text-[10px] font-mono uppercase tracking-wider text-[var(--color-taupe)]">
                    <th className="py-2.5 px-3">Meal Category</th>
                    <th className="py-2.5 px-3">Live Confirmed RSVPs</th>
                    {cateringPlans.map((p) => {
                      const ev = events.find((e) => e.id === planEventId(p));
                      return (
                        <th key={p.id} className="py-2.5 px-3">
                          {ev?.title || p.caterer_name || "Plan"} (Contracted)
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border-subtle)] text-[var(--color-foreground)]">
                  {mealSummaryBreakdown.categoryCounts.map((cat) => (
                    <tr key={cat.name} className="hover:bg-[var(--color-ivory)]/50">
                      <td className="py-2.5 px-3 font-medium">{cat.name}</td>
                      <td className="py-2.5 px-3 font-mono font-medium">
                        {cat.count} meals
                      </td>
                      {cateringPlans.map((p) => {
                        const planned =
                          (p.meal_categories || []).find(
                            (c) =>
                              c.category.toLowerCase() === cat.name.toLowerCase()
                          )?.planned_count || 0;
                        return (
                          <td key={p.id} className="py-2.5 px-3 font-mono">
                            {planned} meals
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  <tr className="bg-[var(--color-ivory)] font-medium">
                    <td className="py-2.5 px-3 font-semibold">Total Headcount / Meals</td>
                    <td className="py-2.5 px-3 font-mono font-bold">
                      {totalConfirmedHeadcount}
                    </td>
                    {cateringPlans.map((p) => {
                      const sum = (p.meal_categories || []).reduce(
                        (acc, c) => acc + (Number(c.planned_count) || 0),
                        0
                      );
                      return (
                        <td key={p.id} className="py-2.5 px-3 font-mono font-bold">
                          {sum}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================================ */}
      {/* SUB-TAB 3: DIETARY RESTRICTIONS & GUEST NOTES */}
      {/* ============================================================================ */}
      {activeSubTab === "dietary" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="font-serif text-2xl font-normal text-[var(--color-foreground)]">
                Confirmed Guest Dietary Accommodations
              </h3>
              <p className="text-xs text-[var(--color-muted)] mt-0.5">
                Allergies, religious restrictions, and special preparation requests for confirmed attendees.
              </p>
            </div>

            <div className="w-full sm:w-72">
              <input
                type="text"
                placeholder="Search attendee or dietary note..."
                value={searchDietary}
                onChange={(e) => setSearchDietary(e.target.value)}
                className="w-full rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-xs text-[var(--color-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--color-foreground)] placeholder:text-[var(--color-taupe)]"
              />
            </div>
          </div>

          {filteredDietaryGuests.length === 0 ? (
            <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center max-w-lg mx-auto space-y-2">
              <span className="text-3xl" aria-hidden="true">
                🥗
              </span>
              <h4 className="font-serif text-xl text-[var(--color-foreground)]">
                No Special Dietary Notes Found
              </h4>
              <p className="text-xs text-[var(--color-muted)]">
                {confirmedWithDietaryNotes.length === 0
                  ? "None of your confirmed guests have recorded dietary restrictions or allergies."
                  : "No guests match your search filter."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[var(--color-border)] bg-[var(--color-ivory)] text-[10px] font-mono uppercase tracking-wider text-[var(--color-taupe)]">
                    <th className="py-3 px-4">Guest / Household</th>
                    <th className="py-3 px-4">Party Size</th>
                    <th className="py-3 px-4">Meal Selection</th>
                    <th className="py-3 px-4">Specific Dietary Restrictions & Notes</th>
                    <th className="py-3 px-4">Contact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border-subtle)] text-[var(--color-foreground)]">
                  {filteredDietaryGuests.map((guest) => (
                    <tr key={guest.id} className="hover:bg-[var(--color-ivory)]/40 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-medium block text-sm">
                          {guest.full_name}
                        </span>
                        {guest.household_name && (
                          <span className="text-[11px] text-[var(--color-taupe)]">
                            {guest.household_name}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono">
                        {guest.attendee_count && guest.attendee_count > 0
                          ? guest.attendee_count
                          : 1}{" "}
                        attendee
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center rounded-full bg-[var(--color-ivory)] border border-[var(--color-champagne-border)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--color-foreground)]">
                          {guest.meal_preference || "Not specified"}
                        </span>
                      </td>
                      <td className="py-3 px-4 max-w-md">
                        {guest.dietary_notes ? (
                          <span className="inline-block bg-amber-50 text-amber-900 border border-amber-200/80 rounded-lg px-2.5 py-1 text-xs dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-800/40">
                            ⚠️ {guest.dietary_notes}
                          </span>
                        ) : (
                          <span className="text-[var(--color-taupe)] italic">
                            No additional allergy notes provided
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs text-[var(--color-muted)]">
                        {guest.email || guest.phone || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ============================================================================ */}
      {/* MODAL: CREATE / EDIT CATERING PLAN */}
      {/* ============================================================================ */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 sm:p-6 overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 sm:p-8 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-4">
              <div>
                <span className="block text-[10px] font-mono uppercase tracking-widest text-[var(--color-taupe)]">
                  {editingPlan ? "Edit Plan" : "New Plan"}
                </span>
                <h2 className="font-serif text-2xl font-normal text-[var(--color-foreground)]">
                  {editingPlan ? "Update Catering Plan" : "Create Event Catering Plan"}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeFormModal}
                className="rounded-full p-1.5 text-[var(--color-muted)] hover:bg-[var(--color-ivory)] hover:text-[var(--color-foreground)]"
                aria-label="Close dialog"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {formError && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300">
                {formError}
              </div>
            )}

            <form onSubmit={handleSavePlan} className="mt-6 space-y-5 text-xs">
              {/* Event Selector & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="form-event-id"
                    className="block text-[11px] font-medium text-[var(--color-foreground)] mb-1"
                  >
                    Associated Celebration Event
                  </label>
                  <select
                    id="form-event-id"
                    value={formEventId}
                    onChange={(e) => setFormEventId(e.target.value)}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs text-[var(--color-foreground)] focus:ring-1 focus:ring-[var(--color-foreground)]"
                  >
                    <option value="">General Celebration Catering</option>
                    {events.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        {ev.title} {ev.event_date ? `(${ev.event_date})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="form-status"
                    className="block text-[11px] font-medium text-[var(--color-foreground)] mb-1"
                  >
                    Catering Status
                  </label>
                  <select
                    id="form-status"
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as CateringStatus)}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs text-[var(--color-foreground)] focus:ring-1 focus:ring-[var(--color-foreground)]"
                  >
                    <option value="not_started">Not Started</option>
                    <option value="planning">Planning & Tasting</option>
                    <option value="confirmed">Confirmed & Contract Signed</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              {/* Caterer Name & Service Format */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="form-caterer-name"
                    className="block text-[11px] font-medium text-[var(--color-foreground)] mb-1"
                  >
                    Caterer / Vendor Name
                  </label>
                  <input
                    id="form-caterer-name"
                    type="text"
                    required
                    placeholder="e.g. Royal Palate Catering Co."
                    value={formCatererName}
                    onChange={(e) => setFormCatererName(e.target.value)}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs text-[var(--color-foreground)] focus:ring-1 focus:ring-[var(--color-foreground)]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="form-service-style"
                    className="block text-[11px] font-medium text-[var(--color-foreground)] mb-1"
                  >
                    Service Style / Format
                  </label>
                  <select
                    id="form-service-style"
                    value={formServiceStyle}
                    onChange={(e) => setFormServiceStyle(e.target.value)}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs text-[var(--color-foreground)] focus:ring-1 focus:ring-[var(--color-foreground)]"
                  >
                    <option value="">Select service format...</option>
                    {SERVICE_STYLES.map((style) => (
                      <option key={style} value={style}>
                        {style}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Vendor Contact details (Private) */}
              <div className="p-3 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-ivory)] space-y-3">
                <span className="block text-[10px] font-mono uppercase tracking-widest text-[var(--color-taupe)]">
                  Vendor Contact Information (Private to Collaborators)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label
                      htmlFor="form-contact-name"
                      className="block text-[10px] text-[var(--color-muted)] mb-0.5"
                    >
                      Contact Name
                    </label>
                    <input
                      id="form-contact-name"
                      type="text"
                      placeholder="Chef or Manager"
                      value={formContactName}
                      onChange={(e) => setFormContactName(e.target.value)}
                      className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1.5 text-xs text-[var(--color-foreground)]"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="form-email"
                      className="block text-[10px] text-[var(--color-muted)] mb-0.5"
                    >
                      Email Address
                    </label>
                    <input
                      id="form-email"
                      type="email"
                      placeholder="chef@caterer.com"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1.5 text-xs text-[var(--color-foreground)]"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="form-phone"
                      className="block text-[10px] text-[var(--color-muted)] mb-0.5"
                    >
                      Phone Number
                    </label>
                    <input
                      id="form-phone"
                      type="tel"
                      placeholder="+1 (555) 234-5678"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1.5 text-xs text-[var(--color-foreground)]"
                    />
                  </div>
                </div>
              </div>

              {/* Deadline & Budget */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="form-deadline"
                    className="block text-[11px] font-medium text-[var(--color-foreground)] mb-1"
                  >
                    Final Headcount Guarantee Deadline
                  </label>
                  <input
                    id="form-deadline"
                    type="date"
                    value={formDeadline}
                    onChange={(e) => setFormDeadline(e.target.value)}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs text-[var(--color-foreground)]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="form-budget"
                    className="block text-[11px] font-medium text-[var(--color-foreground)] mb-1"
                  >
                    Estimated Cost / Quote ($)
                  </label>
                  <input
                    id="form-budget"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="e.g. 4500.00"
                    value={formBudget}
                    onChange={(e) => setFormBudget(e.target.value)}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs text-[var(--color-foreground)]"
                  />
                </div>
              </div>

              {/* Menu Descriptions */}
              <div>
                <label
                  htmlFor="form-menu-notes"
                  className="block text-[11px] font-medium text-[var(--color-foreground)] mb-1"
                >
                  Menu Descriptions, Courses & Tasting Notes
                </label>
                <textarea
                  id="form-menu-notes"
                  rows={3}
                  placeholder="Appetizers: Truffle arancini, smoked salmon blinis&#10;Entrée: Prime ribeye or roasted sea bass&#10;Dessert: Vanilla bean panna cotta..."
                  value={formMenuNotes}
                  onChange={(e) => setFormMenuNotes(e.target.value)}
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-xs text-[var(--color-foreground)]"
                />
              </div>

              {/* Configurable Meal Categories & Planned Quantities */}
              <div className="space-y-3 border-t border-[var(--color-border-subtle)] pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="block text-[11px] font-medium text-[var(--color-foreground)]">
                      Configured Meal Categories & Planned Quantities
                    </span>
                    <span className="text-[10px] text-[var(--color-muted)]">
                      Set contracted meal allocations with caterer.
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handlePreFillRsvpCounts}
                      className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 text-[10px] font-medium text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
                    >
                      ⚡ Sync Live RSVPs
                    </button>
                    <button
                      type="button"
                      onClick={handleAddCategoryRow}
                      className="rounded-full bg-[var(--color-ivory)] border border-[var(--color-border)] px-2.5 py-1 text-[10px] font-medium text-[var(--color-foreground)] hover:bg-[var(--color-border-subtle)]"
                    >
                      + Add Category
                    </button>
                  </div>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {formCategories.map((row, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Category (e.g. Halal)"
                        value={row.category}
                        onChange={(e) =>
                          handleCategoryChange(idx, "category", e.target.value)
                        }
                        className="flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1.5 text-xs text-[var(--color-foreground)]"
                      />
                      <input
                        type="number"
                        min="0"
                        placeholder="Count"
                        value={row.planned_count}
                        onChange={(e) =>
                          handleCategoryChange(
                            idx,
                            "planned_count",
                            parseInt(e.target.value, 10) || 0
                          )
                        }
                        className="w-20 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1.5 text-xs text-[var(--color-foreground)] font-mono"
                      />
                      <input
                        type="text"
                        placeholder="Kitchen note"
                        value={row.notes || ""}
                        onChange={(e) =>
                          handleCategoryChange(idx, "notes", e.target.value)
                        }
                        className="flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1.5 text-xs text-[var(--color-foreground)]"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveCategoryRow(idx)}
                        className="text-red-500 hover:text-red-700 p-1 text-sm"
                        aria-label="Remove category"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Special instructions */}
              <div className="border-t border-[var(--color-border-subtle)] pt-4">
                <label
                  htmlFor="form-special-instructions"
                  className="block text-[11px] font-medium text-[var(--color-foreground)] mb-1"
                >
                  Special Instructions, Plating Timeline & Allergies Notice
                </label>
                <textarea
                  id="form-special-instructions"
                  rows={2}
                  placeholder="Kitchen equipment requirements, vendor meal timings, table service order, high chair meals..."
                  value={formSpecialInstructions}
                  onChange={(e) => setFormSpecialInstructions(e.target.value)}
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-xs text-[var(--color-foreground)]"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--color-border-subtle)]">
                <button
                  type="button"
                  onClick={closeFormModal}
                  disabled={isPending}
                  className="rounded-full border border-[var(--color-border)] px-4 py-2 text-xs text-[var(--color-muted)] hover:bg-[var(--color-ivory)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-full bg-[var(--color-foreground)] px-5 py-2 text-xs font-medium text-[var(--color-background)] hover:opacity-90 disabled:opacity-50"
                >
                  {isPending ? "Saving..." : editingPlan ? "Update Plan" : "Create Plan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================================ */}
      {/* MODAL: DELETE CONFIRMATION */}
      {/* ============================================================================ */}
      {planToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-2xl space-y-4">
            <h3 className="font-serif text-xl font-normal text-[var(--color-foreground)]">
              Remove Catering Plan?
            </h3>
            <p className="text-xs text-[var(--color-muted)] leading-relaxed">
              Are you sure you want to remove the catering plan for{" "}
              <span className="font-semibold text-[var(--color-foreground)]">
                {planToDelete.caterer_name || "this event"}
              </span>
              ? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPlanToDelete(null)}
                className="rounded-full border border-[var(--color-border)] px-4 py-1.5 text-xs text-[var(--color-muted)] hover:bg-[var(--color-ivory)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeletePlan}
                disabled={isPending}
                className="rounded-full bg-red-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isPending ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function planEventId(plan: WeddingCateringPlan): string {
  return plan.event_id || "";
}
