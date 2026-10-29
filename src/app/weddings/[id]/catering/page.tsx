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
    title: wedding?.title
      ? `Food & Catering — ${wedding.title} — Wedora`
      : "Food & Catering — Wedora",
    description:
      "Manage event-aware catering plans, meal counts, vendor coordination, and dietary requirements.",
  };
}

export default async function WeddingCateringPage({ params }: PageProps) {
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
      defaultTab="catering"
    />
  );
}
