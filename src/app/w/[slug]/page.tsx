import { notFound } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PublicEventItem, WebsiteTemplate } from "@/types";
import { WebsiteTemplateRenderer } from "@/features/websites/templates/WebsiteTemplateRenderer";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export const instant = false;

export async function generateMetadata({ params }: PageProps) {
  await connection();

  const { slug } = await params;
  const cleanSlug = slug.toLowerCase().trim();
  const supabase = await createClient();

  // Try fetching public title and couple names
  const { data: website } = await supabase
    .from("wedding_websites")
    .select("couple_names, title")
    .eq("slug", cleanSlug)
    .eq("is_published", true)
    .maybeSingle();

  if (!website) {
    return {
      title: "Wedding Website — Wedora",
      description: "Private and ad-free wedding celebrations on Wedora.",
    };
  }

  return {
    title: `${website.couple_names} — Wedding Celebration`,
    description: `Celebration details, dates, and event itinerary for ${website.couple_names}.`,
  };
}

export default async function PublicWeddingPage({ params, searchParams }: PageProps) {
  await connection();

  const { slug } = await params;
  const search = searchParams ? await searchParams : {};
  const rsvpToken =
    typeof search.rsvp === "string"
      ? search.rsvp
      : typeof search.token === "string"
      ? search.token
      : null;
  const cleanSlug = slug.toLowerCase().trim();

  const supabase = await createClient();

  let isDatabaseError = false;
  let dbErrorMessage: string | null = null;

  // 1. Attempt retrieval via the secure public RPC
  const { data: rpcPayload, error: rpcError } = await supabase.rpc("get_public_wedding_by_slug", {
    p_slug: cleanSlug,
  });

  if (rpcError) {
    // Check if error is missing function or database failure
    if (rpcError.code === "42883" || rpcError.message?.includes("function") || rpcError.message?.includes("schema cache")) {
      // RPC not found in schema, we will try direct query fallback
    } else {
      isDatabaseError = true;
      dbErrorMessage = rpcError.message;
    }
  }

  if (rpcPayload && typeof rpcPayload === "object" && "website" in rpcPayload) {
    const pubData = rpcPayload as {
      website: {
        title: string;
        couple_names: string;
        welcome_message: string | null;
        story: string | null;
        venue_display: string | null;
        date_display: string | null;
        template: WebsiteTemplate;
        is_published: boolean;
        slug: string;
      };
      events: PublicEventItem[];
    };

    if (!pubData.website || !pubData.website.is_published) {
      notFound();
    }

    return (
      <WebsiteTemplateRenderer
        template={pubData.website.template || "minimal_editorial"}
        title={pubData.website.title}
        coupleNames={pubData.website.couple_names}
        welcomeMessage={pubData.website.welcome_message}
        story={pubData.website.story}
        venueDisplay={pubData.website.venue_display}
        dateDisplay={pubData.website.date_display}
        events={pubData.events || []}
        slug={cleanSlug}
        rsvpToken={rsvpToken}
      />
    );
  }

  // 2. Fallback: Query public table directly under public anon RLS policy
  const { data: website, error: websiteError } = await supabase
    .from("wedding_websites")
    .select(`
      id,
      wedding_id,
      title,
      couple_names,
      welcome_message,
      story,
      venue_display,
      date_display,
      template,
      is_published,
      slug
    `)
    .eq("slug", cleanSlug)
    .eq("is_published", true)
    .maybeSingle();

  if (websiteError) {
    isDatabaseError = true;
    dbErrorMessage = websiteError.message;

    // Distinguish missing migration / missing table in development
    if (
      process.env.NODE_ENV === "development" &&
      (websiteError.code === "42P01" ||
        websiteError.message?.includes("relation") ||
        websiteError.message?.includes("does not exist") ||
        websiteError.message?.includes("schema cache"))
    ) {
      return (
        <div className="min-h-screen bg-[var(--color-background)] px-6 py-16 flex items-center justify-center">
          <div className="max-w-xl w-full border border-amber-300 bg-amber-50/90 rounded-2xl p-8 text-[var(--color-foreground)] shadow-xs">
            <div className="flex items-center gap-2 text-amber-800 font-mono text-xs uppercase tracking-wider font-semibold">
              <span aria-hidden="true">⚠️</span> Supabase Database Migration Required
            </div>
            <h2 className="mt-3 font-serif text-2xl font-normal text-amber-950">
              Table &apos;wedding_websites&apos; Not Found
            </h2>
            <p className="mt-2 text-xs text-amber-900 leading-relaxed">
              The public route requested <code className="font-mono font-semibold">/w/{cleanSlug}</code>, but Supabase returned a database schema error:
            </p>
            <div className="mt-3 p-3 bg-white/90 rounded-lg text-xs font-mono text-red-700 border border-amber-200 break-words">
              {websiteError.message}
            </div>
            <div className="mt-4 pt-4 border-t border-amber-200/80 text-xs text-amber-900 space-y-2">
              <p className="font-medium">How to fix this in development:</p>
              <ol className="list-decimal pl-5 space-y-1 text-amber-800">
                <li>Open your Supabase Dashboard &gt; SQL Editor.</li>
                <li>
                  Run the migration file:
                  <code className="block mt-1 p-2 bg-amber-100/80 rounded font-mono text-[11px] select-all">
                    supabase/migrations/20261029000000_wedora_phase6_websites.sql
                  </code>
                </li>
                <li>Refresh this page once the migration is applied.</li>
              </ol>
            </div>
          </div>
        </div>
      );
    }
  }

  // If there was an unhandled system database error, throw or handle
  if (isDatabaseError && !website) {
    if (process.env.NODE_ENV === "development") {
      return (
        <div className="min-h-screen bg-[var(--color-background)] px-6 py-16 flex items-center justify-center">
          <div className="max-w-xl w-full border border-red-200 bg-red-50/90 rounded-2xl p-8 text-[var(--color-foreground)]">
            <div className="flex items-center gap-2 text-red-800 font-mono text-xs uppercase tracking-wider font-semibold">
              <span aria-hidden="true">✕</span> Supabase Database Error
            </div>
            <h2 className="mt-3 font-serif text-2xl font-normal text-red-950">
              Failed to query wedding website
            </h2>
            <p className="mt-2 text-xs text-red-900 leading-relaxed">
              Supabase reported an error while querying <code className="font-mono">/w/{cleanSlug}</code>:
            </p>
            <div className="mt-3 p-3 bg-white/90 rounded-lg text-xs font-mono text-red-700 border border-red-200 break-words">
              {dbErrorMessage || "Unknown query error"}
            </div>
          </div>
        </div>
      );
    }
    // In production, fallback to 404 to avoid leaking internal error specifics
    notFound();
  }

  // If query succeeded but no published website was found with this slug
  if (!website || !website.is_published) {
    notFound();
  }

  // Fetch only public event details (title, description, date, times, location)
  const { data: rawEvents } = await supabase
    .from("wedding_events")
    .select("id, title, description, event_date, start_time, end_time, location")
    .eq("wedding_id", website.wedding_id)
    .order("event_date", { ascending: true });

  const events = (rawEvents as unknown as PublicEventItem[]) || [];

  return (
    <WebsiteTemplateRenderer
      template={(website.template as WebsiteTemplate) || "minimal_editorial"}
      title={website.title}
      coupleNames={website.couple_names}
      welcomeMessage={website.welcome_message}
      story={website.story}
      venueDisplay={website.venue_display}
      dateDisplay={website.date_display}
      events={events}
      slug={cleanSlug}
      rsvpToken={rsvpToken}
    />
  );
}
