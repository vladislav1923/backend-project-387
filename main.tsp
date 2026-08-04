import "@typespec/http";
import "@typespec/openapi3";

using Http;

@service(#{ title: "Calendar Booking API" })
namespace CalendarBooking;

// ——— Models ———

model User {
  id: string;
  name: string;
}

model EventType {
  id: string;
  title: string;
  description: string;
  durationMinutes: int32;
}

model Slot {
  id: string;
  datetime: utcDateTime;
  eventTypeId: string;
}

model Guest {}

model Booking {
  id: string;
  slotId: string;
  eventTypeId: string;
  guest: Guest;
}

// ——— Request bodies ———

model CreateEventTypeRequest {
  title: string;
  description: string;
  durationMinutes: int32;
}

model BookRequest {
  slotId: string;
  eventTypeId: string;
  guest: Guest;
}

// ——— Routes ———

@route("/create-event-type")
interface CreateEventType {
  @post create(@body body: CreateEventTypeRequest): EventType;
}

@route("/event-types")
interface EventTypes {
  @get list(): EventType[];
}

@route("/book")
interface Book {
  @post create(@body body: BookRequest): Booking;
}

@route("/bookings")
interface Bookings {
  @get list(): Booking[];
}
