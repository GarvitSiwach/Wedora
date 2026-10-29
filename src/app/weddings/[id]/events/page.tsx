import { createClient } from "@/lib/supabase/server";
import { loadWorkspaceData } from "../loadWorkspaceData";
import { WorkspaceView } from "../WorkspaceView";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const instant = false;

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: wedding } = await supabase
    .from("weddings")
    .select("title")
    .eq("id", id)
    .single();

  return {
    title: wedding?.title ? `Events & Schedule — ${wedding.title} — Wedora` : "Events — Wedora",
    description: "Plan multi-day celebration itineraries, ceremonies, cocktail hours, and receptions.",
  };
}

export default async function WeddingEventsPage({ params }: PageProps) {
  const { id } = await params;
  const data = await loadWorkspaceData(id);

  return (
    <WorkspaceView
      wedding={data.wedding}
      currentUserRole={data.currentUserRole}
      userEmail={data.userEmail}
      userDisplayName={data.userDisplayName}
      members={data.members}
      initialGuests={data.guests}
      initialEvents={data.events}
      initialWebsite={data.website}
      initialCateringPlans={data.cateringPlans}
      userCanEdit={data.userCanEdit}
      defaultTab="events"
    />
  );
}
