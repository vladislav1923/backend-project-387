import type { CreateEventTypeRequest, EventType } from "@/lib/types";

const globalStore = globalThis as typeof globalThis & {
  __eventTypesStore?: EventType[];
};

function getStore(): EventType[] {
  if (!globalStore.__eventTypesStore) {
    globalStore.__eventTypesStore = [];
  }
  return globalStore.__eventTypesStore;
}

export function listEventTypes(): EventType[] {
  return [...getStore()];
}

export function getEventType(id: string): EventType | undefined {
  return getStore().find((eventType) => eventType.id === id);
}

export function createEventType(body: CreateEventTypeRequest): EventType {
  const eventType: EventType = {
    id: crypto.randomUUID(),
    title: body.title,
    description: body.description,
    durationMinutes: body.durationMinutes,
  };

  getStore().unshift(eventType);
  return eventType;
}
