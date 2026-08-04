/** Types aligned with TypeSpec models in main.tsp */

export type User = {
  id: string;
  name: string;
};

export type EventType = {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
};

export type Slot = {
  id: string;
  datetime: string;
  eventTypeId: string;
};

export type Guest = Record<string, never>;

export type Booking = {
  id: string;
  slotId: string;
  eventTypeId: string;
  guest: Guest;
};

export type CreateEventTypeRequest = {
  title: string;
  description: string;
  durationMinutes: number;
};

export type BookRequest = {
  slotId: string;
  eventTypeId: string;
  guest: Guest;
};

/** Booking enriched for UI lists (title + start time). */
export type BookedEvent = Booking & {
  title: string;
  description: string;
  durationMinutes: number;
  datetime: string;
};
