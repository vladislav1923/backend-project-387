import { getEventType } from "@/lib/event-types-store";
import type { BookedEvent, Booking, BookRequest } from "@/lib/types";

const globalStore = globalThis as typeof globalThis & {
  __bookingsStore?: Booking[];
};

function getStore(): Booking[] {
  if (!globalStore.__bookingsStore) {
    globalStore.__bookingsStore = [];
  }
  return globalStore.__bookingsStore;
}

export function listBookings(): Booking[] {
  return [...getStore()];
}

export function parseSlotDatetime(slotId: string): Date | null {
  const separator = slotId.indexOf(":");
  if (separator === -1) {
    return null;
  }

  const date = new Date(slotId.slice(separator + 1));
  return Number.isNaN(date.getTime()) ? null : date;
}

function intervalEnd(start: Date, durationMinutes: number): number {
  return start.getTime() + durationMinutes * 60_000;
}

/** True when [aStart, aEnd) overlaps [bStart, bEnd). */
export function intervalsOverlap(
  aStart: Date,
  aDurationMinutes: number,
  bStart: Date,
  bDurationMinutes: number,
): boolean {
  const aEnd = intervalEnd(aStart, aDurationMinutes);
  const bEnd = intervalEnd(bStart, bDurationMinutes);
  return aStart.getTime() < bEnd && bStart.getTime() < aEnd;
}

export function getBookingInterval(
  booking: Booking,
): { start: Date; durationMinutes: number } | null {
  const start = parseSlotDatetime(booking.slotId);
  if (!start) {
    return null;
  }

  const eventType = getEventType(booking.eventTypeId);
  if (!eventType) {
    return null;
  }

  return { start, durationMinutes: eventType.durationMinutes };
}

/** Any existing booking that overlaps the proposed time window. */
export function findOverlappingBooking(
  start: Date,
  durationMinutes: number,
): Booking | undefined {
  return getStore().find((booking) => {
    const interval = getBookingInterval(booking);
    if (!interval) {
      return false;
    }

    return intervalsOverlap(
      start,
      durationMinutes,
      interval.start,
      interval.durationMinutes,
    );
  });
}

export function isTimeOccupied(
  start: Date,
  durationMinutes: number,
): boolean {
  return Boolean(findOverlappingBooking(start, durationMinutes));
}

export function toBookedEvent(booking: Booking): BookedEvent | null {
  const start = parseSlotDatetime(booking.slotId);
  const eventType = getEventType(booking.eventTypeId);
  if (!start || !eventType) {
    return null;
  }

  return {
    ...booking,
    title: eventType.title,
    description: eventType.description,
    durationMinutes: eventType.durationMinutes,
    datetime: start.toISOString(),
  };
}

/** Upcoming bookings first, then past; within each group by start time. */
export function listBookedEvents(): BookedEvent[] {
  const now = Date.now();

  return listBookings()
    .map(toBookedEvent)
    .filter((item): item is BookedEvent => item !== null)
    .sort((a, b) => {
      const aTime = new Date(a.datetime).getTime();
      const bTime = new Date(b.datetime).getTime();
      const aUpcoming = aTime >= now;
      const bUpcoming = bTime >= now;

      if (aUpcoming !== bUpcoming) {
        return aUpcoming ? -1 : 1;
      }

      return aUpcoming ? aTime - bTime : bTime - aTime;
    });
}

export function createBooking(
  body: BookRequest,
  durationMinutes: number,
): Booking {
  const start = parseSlotDatetime(body.slotId);
  if (!start) {
    throw new Error("INVALID_SLOT");
  }

  if (isTimeOccupied(start, durationMinutes)) {
    throw new Error("SLOT_OCCUPIED");
  }

  const booking: Booking = {
    id: crypto.randomUUID(),
    slotId: body.slotId,
    eventTypeId: body.eventTypeId,
    guest: body.guest,
  };

  getStore().push(booking);
  return booking;
}
