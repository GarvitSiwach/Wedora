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
