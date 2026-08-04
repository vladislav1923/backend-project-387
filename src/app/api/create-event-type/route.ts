import { createEventType } from "@/lib/event-types-store";
import type { CreateEventTypeRequest } from "@/lib/types";

/** POST /create-event-type — TypeSpec CreateEventType.create */
export async function POST(request: Request) {
  const body = (await request.json()) as Partial<CreateEventTypeRequest>;

  if (
    typeof body.title !== "string" ||
    !body.title.trim() ||
    typeof body.description !== "string" ||
    typeof body.durationMinutes !== "number" ||
    !Number.isFinite(body.durationMinutes) ||
    body.durationMinutes <= 0
  ) {
    return Response.json(
      { message: "Invalid CreateEventTypeRequest" },
      { status: 400 },
    );
  }

  const eventType = createEventType({
    title: body.title.trim(),
    description: body.description.trim(),
    durationMinutes: Math.round(body.durationMinutes),
  });

  return Response.json(eventType, { status: 200 });
}
