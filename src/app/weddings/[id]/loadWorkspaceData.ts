import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { WeddingGuest, WeddingEvent, WeddingWebsite, WeddingCateringPlan } from "@/types";
import { MemberData, WeddingData } from "./WorkspaceView";

export async function loadWorkspaceData(id: string) {
  await connection();

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    notFound();
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect(`/login?next=/weddings/${id}`);
  }

  // Fetch wedding protected by RLS
  const { data: wedding, error: weddingError } = await supabase
    .from("weddings")
    .select(`
      id,
      title,
      slug,
      wedding_date,
      location,
      creator_id,
      created_at,
      updated_at
    `)
    .eq("id", id)
    .single();

  if (weddingError || !wedding) {
    notFound();
  }

  // Fetch current user's role
  const { data: userMembership, error: memberError } = await supabase
    .from("wedding_members")
    .select("role")
    .eq("wedding_id", id)
    .eq("user_id", user.id)
    .single();

  if (memberError || !userMembership) {
    notFound();
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", user.id)
    .single();

  // Fetch collaborators
  const { data: rawMembers } = await supabase
    .from("wedding_members")
    .select(`
      id,
      role,
      created_at,
      profile:profiles (
        id,
        full_name,
        avatar_url
      )
    `)
    .eq("wedding_id", id)
    .order("created_at", { ascending: true });

  const members = (rawMembers as unknown as MemberData[]) || [];

  // Fetch guests (scoped to wedding)
  const { data: rawGuests } = await supabase
    .from("wedding_guests")
    .select("*")
    .eq("wedding_id", id)
    .order("created_at", { ascending: false });

  const guests = (rawGuests as unknown as WeddingGuest[]) || [];

  // Fetch events (scoped to wedding)
  const { data: rawEvents } = await supabase
    .from("wedding_events")
    .select("*")
    .eq("wedding_id", id)
    .order("event_date", { ascending: true });

  const events = (rawEvents as unknown as WeddingEvent[]) || [];

  // Fetch website configuration if exists
  const { data: rawWebsite } = await supabase
    .from("wedding_websites")
    .select("*")
    .eq("wedding_id", id)
    .maybeSingle();

  const website = (rawWebsite as unknown as WeddingWebsite) || null;

  // Fetch catering plans (scoped to wedding)
  let cateringPlans: WeddingCateringPlan[] = [];
  try {
    const { data: rawCateringPlans, error: cateringError } = await supabase
      .from("wedding_catering_plans")
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
      .eq("wedding_id", id)
      .order("created_at", { ascending: true });

    if (!cateringError && rawCateringPlans) {
      cateringPlans = rawCateringPlans as unknown as WeddingCateringPlan[];
    }
  } catch {
    // Graceful fallback if table is not yet populated
  }

  const displayName = profile?.full_name?.trim() || user.email?.split("@")[0] || "Planner";
  const userCanEdit =
    userMembership.role === "owner" ||
    userMembership.role === "partner" ||
    userMembership.role === "collaborator";

  return {
    wedding: wedding as WeddingData,
    currentUserRole: userMembership.role,
    userEmail: user.email || "",
    userDisplayName: displayName,
    members,
    guests,
    events,
    website,
    cateringPlans,
    userCanEdit,
  };
}
