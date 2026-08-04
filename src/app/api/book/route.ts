import { createBooking } from "@/lib/bookings-store";
import { getEventType } from "@/lib/event-types-store";
import { findSlot } from "@/lib/slots";
import type { BookRequest } from "@/lib/types";

/** POST /book — TypeSpec Book.create */
export async function POST(request: Request) {
  const body = (await request.json()) as Partial<BookRequest>;

  if (
    typeof body.slotId !== "string" ||
    !body.slotId ||
    typeof body.eventTypeId !== "string" ||
    !body.eventTypeId ||
    typeof body.guest !== "object" ||
    body.guest === null
  ) {
    return Response.json({ message: "Invalid BookRequest" }, { status: 400 });
  }

  const eventType = getEventType(body.eventTypeId);
  if (!eventType) {
    return Response.json({ message: "Event type not found" }, { status: 404 });
  }

  const slot = findSlot(eventType, body.slotId);
  if (!slot) {
    return Response.json(
      { message: "Slot is not available" },
      { status: 409 },
    );
  }

  try {
    const booking = createBooking(
      {
        slotId: body.slotId,
        eventTypeId: body.eventTypeId,
        guest: {},
      },
      eventType.durationMinutes,
    );
    return Response.json(booking);
  } catch (error) {
    if (error instanceof Error && error.message === "SLOT_OCCUPIED") {
      return Response.json(
        {
          message:
            "This time overlaps another booking. Guests cannot book events at the same time.",
        },
        { status: 409 },
      );
    }
    if (error instanceof Error && error.message === "INVALID_SLOT") {
      return Response.json({ message: "Invalid slot" }, { status: 400 });
    }
    throw error;
  }
}
