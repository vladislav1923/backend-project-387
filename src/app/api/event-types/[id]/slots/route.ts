import { getEventType } from "@/lib/event-types-store";
import { generateAvailableSlots } from "@/lib/slots";

/** GET /event-types/:id/slots?date=YYYY-MM-DD */
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const eventType = getEventType(id);

  if (!eventType) {
    return Response.json({ message: "Event type not found" }, { status: 404 });
  }

  const date = new URL(request.url).searchParams.get("date");
  if (!date) {
    return Response.json(
      { message: "Query parameter date (YYYY-MM-DD) is required" },
      { status: 400 },
    );
  }

  return Response.json(generateAvailableSlots(eventType, date));
}
