import { expect, type APIRequestContext, type Page } from "@playwright/test";
import { addDays, format } from "date-fns";
import {
  formatMoscowDateTime,
  formatMoscowTime,
} from "../src/lib/moscow-time";
import type { EventType, Slot } from "../src/lib/types";

export type CreateEventTypeInput = {
  title: string;
  description?: string;
  durationMinutes?: number;
};

export function uniqueTitle(prefix: string): string {
  return `${prefix} ${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Prefer tomorrow so weekday business-hour slots are available. */
export function bookingDay(from = new Date()): Date {
  return addDays(from, 1);
}

export function slotTimeLabel(datetime: string): string {
  return formatMoscowTime(new Date(datetime));
}

export function slotDateTimeLabel(datetime: string): string {
  return formatMoscowDateTime(new Date(datetime));
}

export async function createEventTypeViaApi(
  request: APIRequestContext,
  input: CreateEventTypeInput,
): Promise<EventType> {
  const response = await request.post("/api/create-event-type", {
    data: {
      title: input.title,
      description: input.description ?? "E2E event description",
      durationMinutes: input.durationMinutes ?? 30,
    },
  });

  expect(response.ok()).toBeTruthy();
  return (await response.json()) as EventType;
}

export async function listSlotsViaApi(
  request: APIRequestContext,
  eventTypeId: string,
  day: Date,
): Promise<Slot[]> {
  const date = format(day, "yyyy-MM-dd");
  const response = await request.get(
    `/api/event-types/${eventTypeId}/slots?date=${date}`,
  );
  expect(response.ok()).toBeTruthy();
  return (await response.json()) as Slot[];
}

export async function bookViaApi(
  request: APIRequestContext,
  slot: Slot,
): Promise<void> {
  const response = await request.post("/api/book", {
    data: {
      slotId: slot.id,
      eventTypeId: slot.eventTypeId,
      guest: {},
    },
  });
  expect(response.ok()).toBeTruthy();
}

export async function listBookingsViaApi(
  request: APIRequestContext,
): Promise<Array<{ id: string; title: string; datetime: string }>> {
  const response = await request.get("/api/bookings");
  expect(response.ok()).toBeTruthy();
  return (await response.json()) as Array<{
    id: string;
    title: string;
    datetime: string;
  }>;
}

export async function selectCalendarDay(page: Page, day: Date): Promise<void> {
  const dataDay = day.toLocaleDateString();
  const dayButton = page.locator(`[data-day="${dataDay}"]`);
  await expect(dayButton).toBeVisible();
  await dayButton.click();
}

export async function createEventTypeViaUi(
  page: Page,
  input: CreateEventTypeInput,
): Promise<void> {
  await page.goto("/events");
  await page.getByRole("button", { name: /new event type/i }).click();
  await expect(
    page.getByRole("heading", { name: /create event type/i }),
  ).toBeVisible();

  await page.getByLabel("Title").fill(input.title);
  await page
    .getByLabel("Description")
    .fill(input.description ?? "Created from Playwright");
  await page
    .getByLabel("Duration (minutes)")
    .fill(String(input.durationMinutes ?? 30));
  await page.getByRole("button", { name: /^create$/i }).click();

  await expect(page.getByText(input.title, { exact: true })).toBeVisible();
}
