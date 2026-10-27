/**
 * Shared global TypeScript types and definitions for Wedora.
 */

export type Nullable<T> = T | null;

export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

export type InvitationStatus = "pending" | "invited" | "confirmed" | "declined";

export interface WeddingGuest {
  id: string;
  wedding_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  household_name: string | null;
  invitation_status: InvitationStatus;
  dietary_notes: string | null;
  notes: string | null;
  invitation_token?: string | null;
  max_attendees: number;
  attendee_count: number;
  meal_preference?: string | null;
  guest_message?: string | null;
  responded_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface WeddingEvent {
  id: string;
  wedding_id: string;
  title: string;
  description: string | null;
  event_date: string | null;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  created_at: string;
  updated_at: string;
}

export type WebsiteTemplate = "minimal_editorial" | "royal_indian" | "botanical_romance";

export interface WeddingWebsite {
  id: string;
  wedding_id: string;
  title: string;
  couple_names: string;
  welcome_message: string | null;
  story: string | null;
  venue_display: string | null;
  date_display: string | null;
  template: WebsiteTemplate;
  is_published: boolean;
  slug: string;
  rsvp_enabled?: boolean;
  rsvp_deadline?: string | null;
  ask_meal_preference?: boolean;
  meal_options?: string[];
  allow_guest_message?: boolean;
  created_at: string;
  updated_at: string;
}

export interface PublicEventItem {
  id: string;
  title: string;
  description: string | null;
  event_date: string | null;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
}

export interface PublicWeddingPayload {
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
    rsvp_enabled?: boolean;
    rsvp_deadline?: string | null;
    ask_meal_preference?: boolean;
    meal_options?: string[];
    allow_guest_message?: boolean;
  };
  events: PublicEventItem[];
}

export interface PublicRsvpGuest {
  id: string;
  full_name: string;
  invitation_status: InvitationStatus;
  max_attendees: number;
  attendee_count: number;
  meal_preference?: string | null;
  guest_message?: string | null;
  responded_at?: string | null;
}

export interface RsvpSettings {
  rsvp_enabled: boolean;
  rsvp_deadline: string | null;
  ask_meal_preference: boolean;
  meal_options: string[];
  allow_guest_message: boolean;
  is_closed: boolean;
}

export interface PublicRsvpPayload {
  guest: PublicRsvpGuest;
  settings: RsvpSettings;
}

