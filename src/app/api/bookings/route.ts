import { listBookedEvents } from "@/lib/bookings-store";

/** GET /bookings — TypeSpec Bookings.list (enriched for UI). */
export async function GET() {
  return Response.json(listBookedEvents());
}
