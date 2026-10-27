import { WebsiteTemplate, PublicEventItem } from "@/types";
import { MinimalEditorialTemplate } from "./MinimalEditorialTemplate";
import { RoyalIndianTemplate } from "./RoyalIndianTemplate";
import { BotanicalRomanceTemplate } from "./BotanicalRomanceTemplate";

interface WebsiteTemplateRendererProps {
  template: WebsiteTemplate;
  title: string;
  coupleNames: string;
  welcomeMessage?: string | null;
  story?: string | null;
  venueDisplay?: string | null;
  dateDisplay?: string | null;
  events: PublicEventItem[];
  slug?: string;
  rsvpToken?: string | null;
  isPreview?: boolean;
}

export function WebsiteTemplateRenderer({
  template,
  title,
  coupleNames,
  welcomeMessage,
  story,
  venueDisplay,
  dateDisplay,
  events,
  slug,
  rsvpToken,
  isPreview = false,
}: WebsiteTemplateRendererProps) {
  switch (template) {
    case "royal_indian":
      return (
        <RoyalIndianTemplate
          title={title}
          coupleNames={coupleNames}
          welcomeMessage={welcomeMessage}
          story={story}
          venueDisplay={venueDisplay}
          dateDisplay={dateDisplay}
          events={events}
          slug={slug}
          rsvpToken={rsvpToken}
          isPreview={isPreview}
        />
      );
    case "botanical_romance":
      return (
        <BotanicalRomanceTemplate
          title={title}
          coupleNames={coupleNames}
          welcomeMessage={welcomeMessage}
          story={story}
          venueDisplay={venueDisplay}
          dateDisplay={dateDisplay}
          events={events}
          slug={slug}
          rsvpToken={rsvpToken}
          isPreview={isPreview}
        />
      );
    case "minimal_editorial":
    default:
      return (
        <MinimalEditorialTemplate
          title={title}
          coupleNames={coupleNames}
          welcomeMessage={welcomeMessage}
          story={story}
          venueDisplay={venueDisplay}
          dateDisplay={dateDisplay}
          events={events}
          slug={slug}
          rsvpToken={rsvpToken}
          isPreview={isPreview}
        />
      );
  }
}
