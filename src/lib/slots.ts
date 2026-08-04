import { isTimeOccupied } from "@/lib/bookings-store";
import {
  DAY_END_HOUR,
  DAY_START_HOUR,
  moscowDateOnly,
  moscowDateTime,
} from "@/lib/moscow-time";
import type { EventType, Slot } from "@/lib/types";

function parseDateOnly(dateOnly: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateOnly);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const probe = moscowDateTime(dateOnly, 12, 0);

  if (
    Number.isNaN(probe.getTime()) ||
    moscowDateOnly(probe) !==
      `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
  ) {
    return null;
  }

  return dateOnly;
}

function addMoscowDays(dateOnly: string, days: number): string {
  const noon = moscowDateTime(dateOnly, 12, 0);
  noon.setUTCDate(noon.getUTCDate() + days);
  return moscowDateOnly(noon);
}

export function formatDateOnly(date: Date): string {
  return moscowDateOnly(date);
}

export function bookingWindowBounds(from = new Date()): {
  start: string;
  end: string;
} {
  const start = moscowDateOnly(from);
  const end = addMoscowDays(start, 13);
  return { start, end };
}

export function isDateInBookingWindow(
  dateOnly: string,
  from = new Date(),
): boolean {
  const { start, end } = bookingWindowBounds(from);
  return dateOnly >= start && dateOnly <= end;
}

/** Consecutive slots for a Moscow calendar day, 10:00–17:00 Moscow time. */
export function generateAvailableSlots(
  eventType: EventType,
  dateOnly: string,
  now = new Date(),
): Slot[] {
  const day = parseDateOnly(dateOnly);
  if (!day || !isDateInBookingWindow(day, now)) {
    return [];
  }

  const duration = eventType.durationMinutes;
  if (!Number.isFinite(duration) || duration <= 0) {
    return [];
  }

  const slots: Slot[] = [];
  let cursor = moscowDateTime(day, DAY_START_HOUR, 0);
  const dayEnd = moscowDateTime(day, DAY_END_HOUR, 0);

  while (cursor.getTime() + duration * 60_000 <= dayEnd.getTime()) {
    if (cursor.getTime() > now.getTime()) {
      if (!isTimeOccupied(cursor, duration)) {
        const datetime = cursor.toISOString();
        slots.push({
          id: `${eventType.id}:${datetime}`,
          datetime,
          eventTypeId: eventType.id,
        });
      }
    }

    cursor = new Date(cursor.getTime() + duration * 60_000);
  }

  return slots;
}

export function findSlot(
  eventType: EventType,
  slotId: string,
  now = new Date(),
): Slot | undefined {
  const separator = slotId.indexOf(":");
  if (separator === -1) {
    return undefined;
  }

  const datetime = slotId.slice(separator + 1);
  const date = new Date(datetime);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return generateAvailableSlots(eventType, moscowDateOnly(date), now).find(
    (slot) => slot.id === slotId,
  );
}
