"use client";

import { useState } from "react";
import Link from "next/link";
import { WeddingGuest, WeddingEvent, WeddingWebsite } from "@/types";
import { GuestManager } from "@/features/guests/GuestManager";
import { EventManager } from "@/features/events/EventManager";
import { WebsiteEditor } from "@/features/websites/WebsiteEditor";
import { RsvpDashboard } from "@/features/rsvp/RsvpDashboard";
import { SignOutButton } from "../SignOutButton";

export interface WeddingData {
  id: string;
  title: string;
  slug: string | null;
  wedding_date: string | null;
  location: string | null;
  creator_id: string;
  created_at: string;
  updated_at: string;
}

export interface MemberData {
  id: string;
  role: string;
  created_at: string;
  profile: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

export type TabKey = "overview" | "guests" | "events" | "invitations" | "rsvp" | "tasks" | "settings";

interface WorkspaceViewProps {
  wedding: WeddingData;
  currentUserRole: string;
  userEmail: string;
  userDisplayName: string;
  members: MemberData[];
  initialGuests: WeddingGuest[];
  initialEvents: WeddingEvent[];
  initialWebsite: WeddingWebsite | null;
  userCanEdit: boolean;
  defaultTab?: TabKey;
}

export function WorkspaceView({
  wedding,
  currentUserRole,
  userEmail,
  userDisplayName,
  members,
  initialGuests,
  initialEvents,
  initialWebsite,
  userCanEdit,
  defaultTab = "overview",
}: WorkspaceViewProps) {
  const [activeTab, setActiveTab] = useState<TabKey>(defaultTab);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeNoticeModal, setActiveNoticeModal] = useState<{
    title: string;
    category: string;
    description: string;
  } | null>(null);

  // Initial checklist state for getting started
  const [checklist, setChecklist] = useState([
    { id: "date", label: "Set your celebration date and season", completed: !!wedding.wedding_date },
    { id: "location", label: "Select and confirm your celebration venue", completed: !!wedding.location },
    { id: "guests", label: "Draft initial guest count & family circles", completed: initialGuests.length > 0 },
    { id: "events", label: "Schedule ceremony and reception timeline", completed: initialEvents.length > 0 },
    { id: "team", label: "Invite partner or close family to collaborate", completed: members.length > 1 },
  ]);

  const toggleChecklistItem = (id: string) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item))
    );
  };

  const completedCount = checklist.filter((item) => item.completed).length;

  // Real guest counts for overview
  const guestTotal = initialGuests.length;
  const guestConfirmed = initialGuests.filter((g) => g.invitation_status === "confirmed").length;
  const guestInvited = initialGuests.filter((g) => g.invitation_status === "invited").length;
  const guestPending = initialGuests.filter((g) => g.invitation_status === "pending").length;
  const guestDeclined = initialGuests.filter((g) => g.invitation_status === "declined").length;

  // Real upcoming events for overview
  const upcomingDatedEvents = initialEvents
    .filter((e) => !!e.event_date)
    .sort((a, b) => {
      const dateA = new Date(`${a.event_date}T${a.start_time || "00:00:00"}`).getTime();
      const dateB = new Date(`${b.event_date}T${b.start_time || "00:00:00"}`).getTime();
      return dateA - dateB;
    })
    .slice(0, 3);

  // Countdown calculations
  const calculateCountdown = () => {
    if (!wedding.wedding_date) return null;

    const [year, month, day] = wedding.wedding_date.split("-").map(Number);
    const target = new Date(year, month - 1, day);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const diffMs = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return { status: "today", text: "Today is your wedding day!", days: 0 };
    }
    if (diffDays < 0) {
      return {
        status: "past",
        text: `Celebrated on ${target.toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })}`,
        days: Math.abs(diffDays),
      };
    }
    return {
      status: "future",
      days: diffDays,
      text: `${diffDays} ${diffDays === 1 ? "day" : "days"} to celebration`,
    };
  };

  const countdown = calculateCountdown();

  const formattedWeddingDate = wedding.wedding_date
    ? new Date(wedding.wedding_date + "T00:00:00").toLocaleDateString("en-US", {
        weekday: "short",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  const navTabs: { key: TabKey; label: string; icon: string; count?: number }[] = [
    { key: "overview", label: "Overview", icon: "M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" },
    { key: "guests", label: "Guests", icon: "M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z", count: guestTotal },
    { key: "events", label: "Events", icon: "M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5", count: initialEvents.length },
    { key: "invitations", label: "Invitations", icon: "M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" },
    { key: "rsvp", label: "RSVP", icon: "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z", count: guestConfirmed },
    { key: "tasks", label: "Tasks", icon: "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
    { key: "settings", label: "Settings", icon: "M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" },
  ];

  const quickActions = [
    {
      title: "Manage guests",
      description: "Guest lists, plus-ones, meal preferences, and RSVP tracking.",
      icon: "👥",
      badge: "Active",
      action: () => setActiveTab("guests"),
    },
    {
      title: "Plan events",
      description: "Schedule rehearsal, ceremony, reception, and brunch timelines.",
      icon: "🗓️",
      badge: "Active",
      action: () => setActiveTab("events"),
    },
    {
      title: "Invitations & Website",
      description: "Customize your wedding website, choose a visual template, and publish your URL.",
      icon: "💌",
      badge: "Active",
      action: () => setActiveTab("invitations"),
    },
    {
      title: "RSVP Dashboard",
      description: "Live headcount, confirmed attendance, meal choices, and responses.",
      icon: "✉️",
      badge: "Active",
      action: () => setActiveTab("rsvp"),
    },
    {
      title: "Wedding tasks",
      description: "Comprehensive milestone checklist organized by timeline.",
      icon: "📋",
      badge: "Phase 6",
      action: () =>
        setActiveNoticeModal({
          title: "Timeline Tasks & Milestones",
          category: "Phase 6 Feature",
          description:
            "Full milestone task management and custom wedding checklists are scheduled for Phase 6. Use the Getting Started guide on the Overview in the meantime.",
        }),
    },
    {
      title: "Food and catering",
      description: "Catering choices, bar packages, dietary flags, and tastings.",
      icon: "🍽️",
      badge: "Phase 6",
      action: () =>
        setActiveNoticeModal({
          title: "Food and Catering Module",
          category: "Phase 6 Feature",
          description:
            "The food and catering suite is scheduled for Phase 6. Dietary restrictions recorded in your Guest List will connect seamlessly here.",
        }),
    },
    {
      title: "Family collaboration",
      description: "Invite partner, parents, and wedding planners with custom roles.",
      icon: "🤝",
      badge: "Phase 6",
      action: () =>
        setActiveNoticeModal({
          title: "Multi-User Family Collaboration",
          category: "Phase 6 Feature",
          description:
            "Member invitation links and role delegation will be unlocked in Phase 6. Your workspace already supports multi-tenant membership in the database.",
        }),
    },
  ];

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
    <div className="min-h-screen flex flex-col bg-[var(--color-background)]">
      {/* Top Workspace Header */}
      <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[var(--color-surface)]/95 px-6 py-3.5 backdrop-blur-md sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          {/* Left: Branding & Breadcrumbs */}
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <Link
              href="/weddings"
              className="font-serif text-xl sm:text-2xl font-normal tracking-tight text-[var(--color-foreground)] hover:opacity-80 transition-opacity shrink-0"
            >
              Wedora
            </Link>

            <span className="text-[var(--color-taupe)] shrink-0" aria-hidden="true">
              /
            </span>

            <Link
              href="/weddings"
              className="text-xs font-medium text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors truncate hidden md:inline"
            >
              Your Weddings
            </Link>

            <span className="text-[var(--color-taupe)] hidden md:inline" aria-hidden="true">
              /
            </span>

            <span className="text-xs font-medium text-[var(--color-foreground)] truncate max-w-[140px] sm:max-w-[240px]">
              {wedding.title}
            </span>

            <span className="hidden sm:inline-flex items-center rounded-full border border-[var(--color-border)] bg-[var(--color-ivory)] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-[var(--color-taupe)]">
              {currentUserRole}
            </span>
          </div>

          {/* Right: User & Actions */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab("settings")}
              className="hidden sm:inline-flex items-center gap-1.5 text-xs text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors px-2 py-1.5 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-foreground)]"
              aria-label="Workspace settings"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.894.149c-.424.07-.764.383-.929.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </button>

            <div className="h-4 w-px bg-[var(--color-border)] hidden sm:block" />

            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs font-medium text-[var(--color-foreground)]">
                {userDisplayName}
              </span>
              <span className="text-[11px] text-[var(--color-taupe-muted)]">
                {userEmail}
              </span>
            </div>

            <SignOutButton />

            {/* Mobile menu toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex md:hidden items-center justify-center p-1.5 rounded-md text-[var(--color-foreground)] hover:bg-[var(--color-ivory)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-foreground)]"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"} />
              </svg>
            </button>
          </div>
        </div>

        {/* Workspace Navigation Bar (Desktop Tabs) */}
        <div className="mx-auto mt-3 hidden max-w-7xl md:flex items-center gap-1 border-t border-[var(--color-border-subtle)] pt-2">
          {navTabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-full transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-foreground)] ${
                  isActive
                    ? "bg-[var(--color-foreground)] text-[var(--color-background)] shadow-xs"
                    : "text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-ivory)]"
                }`}
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
                </svg>
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span
                    className={`ml-0.5 rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                      isActive ? "bg-white/20 text-white" : "bg-[var(--color-ivory)] text-[var(--color-taupe)]"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="border-t border-[var(--color-border)] mt-3 pt-3 pb-2 md:hidden">
            <div className="grid grid-cols-2 gap-1.5">
              {navTabs.map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => {
                      setActiveTab(tab.key);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg text-left transition-colors ${
                      isActive
                        ? "bg-[var(--color-foreground)] text-[var(--color-background)]"
                        : "text-[var(--color-muted)] hover:bg-[var(--color-ivory)]"
                    }`}
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
                    </svg>
                    <span>{tab.label}</span>
                    {tab.count !== undefined && tab.count > 0 && (
                      <span className="ml-auto text-[10px] opacity-70">({tab.count})</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* Main Workspace Body */}
      <main className="flex-1 px-6 py-8 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl">
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-10">
              {/* Header Hero Banner */}
              <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 sm:p-10 shadow-xs relative overflow-hidden">
                <div
                  className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[radial-gradient(circle,var(--color-champagne),transparent_70%)] opacity-40"
                  aria-hidden="true"
                />

                <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-taupe)]">
                        Workspace • {currentUserRole}
                      </span>
                      {wedding.slug && (
                        <span className="text-[10px] font-mono text-[var(--color-taupe-muted)]">
                          #{wedding.slug}
                        </span>
                      )}
                    </div>

                    <h1 className="mt-3 font-serif text-3xl sm:text-5xl font-normal tracking-tight text-[var(--color-foreground)]">
                      {wedding.title}
                    </h1>

                    <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-[var(--color-muted)]">
                      {formattedWeddingDate && (
                        <span className="flex items-center gap-1.5">
                          <svg className="h-4 w-4 text-[var(--color-taupe)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                          </svg>
                          {formattedWeddingDate}
                        </span>
                      )}

                      {wedding.location && (
                        <span className="flex items-center gap-1.5">
                          <svg className="h-4 w-4 text-[var(--color-taupe)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                          </svg>
                          {wedding.location}
                        </span>
                      )}

                      <span className="text-[var(--color-taupe-muted)]">
                        {members.length} {members.length === 1 ? "collaborator" : "collaborators"}
                      </span>
                    </div>
                  </div>

                  {/* Countdown Card */}
                  <div className="shrink-0 rounded-2xl border border-[var(--color-border)] bg-[var(--color-ivory)]/70 p-5 sm:p-6 text-center min-w-[200px]">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-taupe)]">
                      Celebration Countdown
                    </span>

                    {countdown ? (
                      countdown.status === "future" ? (
                        <div className="mt-2">
                          <div className="font-serif text-4xl sm:text-5xl font-normal text-[var(--color-foreground)]">
                            {countdown.days}
                          </div>
                          <div className="text-xs font-medium text-[var(--color-muted)] mt-1">
                            Days remaining
                          </div>
                        </div>
                      ) : countdown.status === "today" ? (
                        <div className="mt-2 text-base font-serif text-[var(--color-foreground)]">
                          Today is your celebration! 🎉
                        </div>
                      ) : (
                        <div className="mt-2 text-xs text-[var(--color-muted)] leading-relaxed">
                          {countdown.text}
                        </div>
                      )
                    ) : (
                      <div className="mt-2">
                        <p className="text-xs text-[var(--color-muted)] leading-relaxed">
                          Date to be determined
                        </p>
                        <button
                          type="button"
                          onClick={() => setActiveTab("settings")}
                          className="mt-3 inline-block rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-1 text-[11px] font-medium text-[var(--color-foreground)] hover:bg-[var(--color-background)] transition-colors"
                        >
                          Set date in settings &rarr;
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Planning Progress & Getting Started Checklist */}
              <div className="grid gap-6 lg:grid-cols-3">
                {/* Planning Progress Status */}
                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 sm:p-8 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-taupe)]">
                        Planning Progress
                      </span>
                      <span className="rounded-full bg-[var(--color-ivory)] px-2.5 py-0.5 text-[10px] font-medium text-[var(--color-taupe)]">
                        {completedCount === 0 ? "Not started" : `${completedCount} of ${checklist.length} ready`}
                      </span>
                    </div>

                    <h2 className="mt-4 font-serif text-2xl font-normal text-[var(--color-foreground)]">
                      {completedCount === 0
                        ? "Begin your preparations"
                        : completedCount === checklist.length
                        ? "Initial milestones complete"
                        : "Foundations in progress"}
                    </h2>

                    <p className="mt-2 text-xs leading-relaxed text-[var(--color-muted)]">
                      Wedora presents truthful planning metrics based strictly on your active milestones. We never fabricate estimated completion percentages from nonexistent data.
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-[var(--color-border-subtle)]">
                    <div className="flex items-center justify-between text-xs text-[var(--color-taupe)] mb-2">
                      <span>Initial preparation</span>
                      <span className="font-mono">{Math.round((completedCount / checklist.length) * 100)}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-[var(--color-ivory)] overflow-hidden">
                      <div
                        className="h-full bg-[var(--color-foreground)] transition-all duration-300 rounded-full"
                        style={{ width: `${(completedCount / checklist.length) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Getting-Started Checklist */}
                <div className="lg:col-span-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 sm:p-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-taupe)]">
                        Initial Checklist
                      </span>
                      <h2 className="mt-1 font-serif text-2xl font-normal text-[var(--color-foreground)]">
                        Getting Started Guide
                      </h2>
                    </div>
                    <span className="text-xs font-mono text-[var(--color-taupe)]">
                      {completedCount}/{checklist.length} Done
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-[var(--color-muted)]">
                    Check off foundational steps as you and your partner establish your celebration plan:
                  </p>

                  <div className="mt-5 space-y-2.5">
                    {checklist.map((item) => (
                      <label
                        key={item.id}
                        className={`flex items-center gap-3.5 p-3 rounded-xl border transition-all cursor-pointer ${
                          item.completed
                            ? "border-[var(--color-border-subtle)] bg-[var(--color-ivory)]/40 text-[var(--color-muted)]"
                            : "border-[var(--color-border)] bg-[var(--color-background)] hover:border-[var(--color-foreground)]/30 text-[var(--color-foreground)]"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={item.completed}
                          onChange={() => toggleChecklistItem(item.id)}
                          className="h-4 w-4 rounded-sm border-[var(--color-border)] text-[var(--color-foreground)] focus:ring-0 focus:outline-hidden"
                        />
                        <span className={`text-xs font-medium select-none ${item.completed ? "line-through opacity-70" : ""}`}>
                          {item.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Quick Actions Grid */}
              <div>
                <div className="flex items-baseline justify-between border-b border-[var(--color-border-subtle)] pb-4">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-taupe)]">
                      Quick Access
                    </span>
                    <h2 className="mt-1 font-serif text-2xl font-normal text-[var(--color-foreground)]">
                      Wedding Management Modules
                    </h2>
                  </div>
                  <span className="text-xs text-[var(--color-taupe)] hidden sm:inline">
                    Select a module to view or configure
                  </span>
                </div>

                <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {quickActions.map((action) => (
                    <button
                      key={action.title}
                      type="button"
                      onClick={action.action}
                      className="group flex flex-col justify-between rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-left shadow-xs transition-all hover:border-[var(--color-foreground)]/40 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-foreground)]"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-2xl" aria-hidden="true">
                            {action.icon}
                          </span>
                          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                            action.badge === "Active"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900"
                              : "border border-[var(--color-border)] bg-[var(--color-ivory)] text-[var(--color-taupe)]"
                          }`}>
                            {action.badge}
                          </span>
                        </div>

                        <h3 className="mt-4 font-serif text-xl font-normal text-[var(--color-foreground)] group-hover:text-[var(--color-foreground)]/90">
                          {action.title}
                        </h3>

                        <p className="mt-2 text-xs leading-relaxed text-[var(--color-muted)]">
                          {action.description}
                        </p>
                      </div>

                      <div className="mt-5 pt-3 border-t border-[var(--color-border-subtle)] flex items-center justify-between text-xs font-medium text-[var(--color-foreground)]">
                        <span>Open module</span>
                        <span className="group-hover:translate-x-1 transition-transform" aria-hidden="true">
                          &rarr;
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Planning Overview Sections (Events, Tasks, Guests, Activity) */}
              <div>
                <div className="border-b border-[var(--color-border-subtle)] pb-4">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-taupe)]">
                    Planning Overview
                  </span>
                  <h2 className="mt-1 font-serif text-2xl font-normal text-[var(--color-foreground)]">
                    Workspace Snapshots
                  </h2>
                </div>

                <div className="mt-6 grid gap-6 md:grid-cols-2">
                  {/* Snapshot 1: Upcoming Events (Real DB data) */}
                  <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 sm:p-7 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="font-serif text-lg font-normal text-[var(--color-foreground)] flex items-center gap-2">
                          <span>🗓️</span> Upcoming Events
                        </h3>
                        <button
                          type="button"
                          onClick={() => setActiveTab("events")}
                          className="text-xs font-medium text-[var(--color-foreground)] hover:underline"
                        >
                          View all ({initialEvents.length}) &rarr;
                        </button>
                      </div>

                      {upcomingDatedEvents.length > 0 ? (
                        <div className="mt-5 space-y-3">
                          {upcomingDatedEvents.map((ev) => (
                            <div
                              key={ev.id}
                              className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-background)] p-3.5 flex items-start justify-between gap-3"
                            >
                              <div>
                                <h4 className="font-serif text-base font-normal text-[var(--color-foreground)]">
                                  {ev.title}
                                </h4>
                                <div className="mt-1 text-[11px] text-[var(--color-muted)] flex items-center gap-2">
                                  <span>
                                    {new Date(`${ev.event_date}T00:00:00`).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                    })}
                                  </span>
                                  {ev.start_time && (
                                    <>
                                      <span>•</span>
                                      <span>{formatTime(ev.start_time)}</span>
                                    </>
                                  )}
                                  {ev.location && (
                                    <>
                                      <span>•</span>
                                      <span className="truncate max-w-[120px]">{ev.location}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="mt-6 rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-ivory)]/40 p-6 text-center">
                          <p className="text-xs font-medium text-[var(--color-foreground)]">
                            No upcoming dated events
                          </p>
                          <p className="mt-1 text-[11px] text-[var(--color-muted)] max-w-xs mx-auto">
                            Schedule multi-day festivities including your welcome dinner, ceremony, and reception.
                          </p>
                          {userCanEdit && (
                            <button
                              type="button"
                              onClick={() => setActiveTab("events")}
                              className="mt-4 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-1 text-[11px] font-medium text-[var(--color-foreground)] hover:bg-[var(--color-ivory)] transition-colors"
                            >
                              + Schedule Event
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Snapshot 2: Outstanding Tasks */}
                  <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 sm:p-7">
                    <div className="flex items-center justify-between">
                      <h3 className="font-serif text-lg font-normal text-[var(--color-foreground)] flex items-center gap-2">
                        <span>📋</span> Outstanding Tasks
                      </h3>
                      <button
                        type="button"
                        onClick={() =>
                          setActiveNoticeModal({
                            title: "Tasks & Milestones",
                            category: "Phase 6 Feature",
                            description:
                              "Full custom task checklists organized by timeline are scheduled for Phase 6. Track your progress with the Getting Started checklist above in the meantime.",
                          })
                        }
                        className="text-xs font-medium text-[var(--color-foreground)] hover:underline"
                      >
                        View checklist &rarr;
                      </button>
                    </div>

                    <div className="mt-6 rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-ivory)]/40 p-6 text-center">
                      <p className="text-xs font-medium text-[var(--color-foreground)]">
                        Timeline checklist unlocks in Phase 6
                      </p>
                      <p className="mt-1 text-[11px] text-[var(--color-muted)] max-w-xs mx-auto">
                        In the meantime, track your initial preparations using the Getting Started checklist on this page.
                      </p>
                    </div>
                  </div>

                  {/* Snapshot 3: Real Guest Overview */}
                  <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 sm:p-7 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="font-serif text-lg font-normal text-[var(--color-foreground)] flex items-center gap-2">
                          <span>👥</span> Guest Overview
                        </h3>
                        <button
                          type="button"
                          onClick={() => setActiveTab("guests")}
                          className="text-xs font-medium text-[var(--color-foreground)] hover:underline"
                        >
                          Manage guests &rarr;
                        </button>
                      </div>

                      <div className="mt-6 grid grid-cols-4 gap-2.5 text-center">
                        <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-background)] p-3">
                          <div className="text-lg font-serif font-normal text-[var(--color-foreground)]">{guestTotal}</div>
                          <div className="text-[9px] text-[var(--color-taupe)] uppercase tracking-wider mt-0.5">Total</div>
                        </div>
                        <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3 dark:border-emerald-900/30 dark:bg-emerald-950/20">
                          <div className="text-lg font-serif font-normal text-emerald-800 dark:text-emerald-300">{guestConfirmed}</div>
                          <div className="text-[9px] text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mt-0.5">Confirmed</div>
                        </div>
                        <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3 dark:border-blue-900/30 dark:bg-blue-950/20">
                          <div className="text-lg font-serif font-normal text-blue-800 dark:text-blue-300">{guestInvited}</div>
                          <div className="text-[9px] text-blue-700 dark:text-blue-400 uppercase tracking-wider mt-0.5">Invited</div>
                        </div>
                        <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-3 dark:border-amber-900/30 dark:bg-amber-950/20">
                          <div className="text-lg font-serif font-normal text-amber-800 dark:text-amber-300">{guestPending}</div>
                          <div className="text-[9px] text-amber-700 dark:text-amber-400 uppercase tracking-wider mt-0.5">Pending</div>
                        </div>
                      </div>

                      {guestTotal === 0 ? (
                        <p className="mt-4 text-center text-[11px] text-[var(--color-muted)]">
                          No guests added yet. Add family circles and track RSVP responses in real time.
                        </p>
                      ) : (
                        <p className="mt-4 text-center text-[11px] text-[var(--color-muted)]">
                          {guestConfirmed} attending • {guestPending} pending • {guestDeclined} declined ({Math.round(guestTotal > 0 ? (guestConfirmed / guestTotal) * 100 : 0)}% confirmed rate).
                        </p>
                      )}
                    </div>

                    {guestTotal === 0 && userCanEdit && (
                      <div className="mt-4 text-center">
                        <button
                          type="button"
                          onClick={() => setActiveTab("guests")}
                          className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-1 text-[11px] font-medium text-[var(--color-foreground)] hover:bg-[var(--color-ivory)] transition-colors"
                        >
                          + Add Guests
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Snapshot 4: Recent Activity */}
                  <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 sm:p-7">
                    <div className="flex items-center justify-between">
                      <h3 className="font-serif text-lg font-normal text-[var(--color-foreground)] flex items-center gap-2">
                        <span>⚡</span> Recent Activity
                      </h3>
                      <span className="text-[10px] font-mono text-[var(--color-taupe)]">Live log</span>
                    </div>

                    <div className="mt-6 space-y-3">
                      <div className="flex items-start gap-3 text-xs">
                        <div className="mt-1 h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                        <div>
                          <p className="font-medium text-[var(--color-foreground)]">
                            Phase 5 modules active
                          </p>
                          <p className="text-[11px] text-[var(--color-taupe-muted)]">
                            Real-time Guest List and Event Itineraries are enabled
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 text-xs pt-3 border-t border-[var(--color-border-subtle)]">
                        <div className="mt-1 h-2 w-2 rounded-full bg-[var(--color-taupe)] shrink-0" />
                        <div>
                          <p className="font-medium text-[var(--color-foreground)]">
                            Workspace initialized
                          </p>
                          <p className="text-[11px] text-[var(--color-taupe-muted)]">
                            Created on{" "}
                            {new Date(wedding.created_at).toLocaleDateString("en-US", {
                              month: "long",
                              day: "numeric",
                              year: "numeric",
                            })}{" "}
                            • Sole owner role assigned
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: GUESTS (Full Guest Manager) */}
          {activeTab === "guests" && (
            <GuestManager
              weddingId={wedding.id}
              initialGuests={initialGuests}
              userCanEdit={userCanEdit}
              weddingSlug={initialWebsite?.slug || undefined}
            />
          )}

          {/* TAB 3: EVENTS (Full Event Manager) */}
          {activeTab === "events" && (
            <EventManager
              weddingId={wedding.id}
              initialEvents={initialEvents}
              userCanEdit={userCanEdit}
            />
          )}

          {/* TAB 4: INVITATIONS & WEDDING WEBSITE */}
          {activeTab === "invitations" && (
            <WebsiteEditor
              weddingId={wedding.id}
              weddingTitle={wedding.title}
              weddingDate={wedding.wedding_date}
              weddingLocation={wedding.location}
              defaultSlug={
                wedding.title
                  ? wedding.title
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, "-")
                      .replace(/^-+|-+$/g, "")
                      .slice(0, 32)
                  : "celebration"
              }
              initialWebsite={initialWebsite}
              events={initialEvents}
              userCanEdit={userCanEdit}
            />
          )}

          {/* TAB: RSVP DASHBOARD */}
          {activeTab === "rsvp" && (
            <RsvpDashboard
              weddingId={wedding.id}
              website={initialWebsite}
              initialGuests={initialGuests}
              userCanEdit={userCanEdit}
            />
          )}

          {/* TAB 5: TASKS */}
          {activeTab === "tasks" && (
            <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 sm:p-12 text-center max-w-3xl mx-auto">
              <span className="text-3xl" aria-hidden="true">
                📋
              </span>
              <span className="block mt-3 text-[10px] font-mono uppercase tracking-widest text-[var(--color-taupe)]">
                Phase 6 • Coming Soon
              </span>
              <h2 className="mt-2 font-serif text-3xl font-normal text-[var(--color-foreground)]">
                Timeline Task Management
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-[var(--color-muted)]">
                Custom milestone task lists and vendor deadlines organized by month will unlock in Phase 6. Track your current preparation using the Getting Started checklist on your Overview.
              </p>

              <div className="mt-8">
                <button
                  type="button"
                  onClick={() => setActiveTab("overview")}
                  className="rounded-full bg-[var(--color-foreground)] px-6 py-2.5 text-xs font-medium text-[var(--color-background)] hover:opacity-90 transition-opacity"
                >
                  &larr; Back to Overview Checklist
                </button>
              </div>
            </div>
          )}

          {/* TAB 6: SETTINGS */}
          {activeTab === "settings" && (
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="border-b border-[var(--color-border-subtle)] pb-4">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-taupe)]">
                  Workspace Administration
                </span>
                <h2 className="mt-1 font-serif text-3xl font-normal text-[var(--color-foreground)]">
                  Wedding Settings & Team
                </h2>
              </div>

              {/* Workspace Details Card */}
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 sm:p-8">
                <h3 className="font-serif text-xl font-normal text-[var(--color-foreground)]">
                  Celebration Profile
                </h3>

                <dl className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
                  <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-background)] p-4">
                    <dt className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-taupe)]">Wedding Title</dt>
                    <dd className="mt-1 font-medium text-sm text-[var(--color-foreground)]">{wedding.title}</dd>
                  </div>

                  <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-background)] p-4">
                    <dt className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-taupe)]">Celebration Date</dt>
                    <dd className="mt-1 font-medium text-sm text-[var(--color-foreground)]">
                      {formattedWeddingDate || "Not set yet"}
                    </dd>
                  </div>

                  <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-background)] p-4">
                    <dt className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-taupe)]">Location / Venue</dt>
                    <dd className="mt-1 font-medium text-sm text-[var(--color-foreground)]">
                      {wedding.location || "Not specified yet"}
                    </dd>
                  </div>

                  <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-background)] p-4">
                    <dt className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-taupe)]">Workspace ID</dt>
                    <dd className="mt-1 font-mono text-[11px] text-[var(--color-taupe-muted)] break-all">{wedding.id}</dd>
                  </div>
                </dl>
              </div>

              {/* Collaborators & Roles */}
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 sm:p-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-serif text-xl font-normal text-[var(--color-foreground)]">
                      Workspace Members
                    </h3>
                    <p className="mt-1 text-xs text-[var(--color-muted)]">
                      Couples, coordinators, and collaborators with authorized access to this wedding.
                    </p>
                  </div>
                  <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-ivory)] px-2.5 py-1 text-[11px] font-mono text-[var(--color-taupe)]">
                    {members.length} {members.length === 1 ? "Member" : "Members"}
                  </span>
                </div>

                <div className="mt-6 divide-y border-y border-[var(--color-border-subtle)]">
                  {members.map((member) => (
                    <div key={member.id} className="py-3.5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-[var(--color-ivory)] border border-[var(--color-border)] flex items-center justify-center font-serif text-xs font-medium text-[var(--color-foreground)]">
                          {(member.profile?.full_name || "M").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-medium text-[var(--color-foreground)]">
                            {member.profile?.full_name || "Wedding Member"}
                          </p>
                          <p className="text-[10px] text-[var(--color-taupe-muted)] font-mono">
                            Joined {new Date(member.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                          </p>
                        </div>
                      </div>

                      <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-ivory)] px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-[var(--color-taupe)]">
                        {member.role}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex items-center justify-between pt-2">
                  <p className="text-xs text-[var(--color-muted)]">
                    Direct member invitations and role management will be unlocked in Phase 6.
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveNoticeModal({
                        title: "Member Invitations",
                        category: "Phase 6 Feature",
                        description:
                          "Secure invite link generation and partner delegation will be unlocked in Phase 6. The underlying database and RLS policies already enforce sole-owner invariants.",
                      })
                    }
                    className="rounded-full border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-2 text-xs font-medium text-[var(--color-foreground)] hover:bg-[var(--color-ivory)] transition-colors"
                  >
                    + Invite Collaborator
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Feature Notice Modal */}
      {activeNoticeModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4"
        >
          <div className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 sm:p-8 shadow-xl">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-taupe)]">
              {activeNoticeModal.category}
            </span>
            <h3 className="mt-2 font-serif text-2xl font-normal text-[var(--color-foreground)]">
              {activeNoticeModal.title}
            </h3>
            <p className="mt-3 text-xs leading-relaxed text-[var(--color-muted)]">
              {activeNoticeModal.description}
            </p>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveNoticeModal(null)}
                className="rounded-full bg-[var(--color-foreground)] px-5 py-2 text-xs font-medium text-[var(--color-background)] hover:opacity-90 transition-opacity"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Workspace Footer */}
      <footer className="border-t border-[var(--color-border)] py-6 text-center text-xs text-[var(--color-taupe)]">
        Wedora • Private, Calm, Free Wedding Planning
      </footer>
    </div>
  );
}
