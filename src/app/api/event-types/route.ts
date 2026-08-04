import { listEventTypes } from "@/lib/event-types-store";

/** GET /event-types — TypeSpec EventTypes.list */
export async function GET() {
  return Response.json(listEventTypes());
}
