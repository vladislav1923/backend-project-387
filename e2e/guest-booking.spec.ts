import { expect, test } from "@playwright/test";
import {
  bookViaApi,
  bookingDay,
  createEventTypeViaApi,
  listBookingsViaApi,
  listSlotsViaApi,
  selectCalendarDay,
  slotDateTimeLabel,
  slotTimeLabel,
  uniqueTitle,
} from "./helpers";

test.describe("guest booking", () => {
  test("books an event type through calendar and slots", async ({
    page,
    request,
  }) => {
    const title = uniqueTitle("Product demo");
    const eventType = await createEventTypeViaApi(request, {
      title,
      description: "A walkthrough for new customers",
      durationMinutes: 30,
    });

    const day = bookingDay();
    const slots = await listSlotsViaApi(request, eventType.id, day);
    expect(slots.length).toBeGreaterThan(0);
    expect(slotTimeLabel(slots[0]!.datetime)).toBe("10:00");
    const targetSlot = slots[0]!;
    const slotLabel = slotTimeLabel(targetSlot.datetime);

    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /choose an event/i }),
    ).toBeVisible();

    await page.getByRole("button", { name: title }).click();
    await expect(
      page.getByRole("heading", { name: title, exact: true }),
    ).toBeVisible();
    await expect(page.getByText(/pick a day/i)).toBeVisible();

    await selectCalendarDay(page, day);
    await expect(
      page.getByText(new RegExp(`${eventType.durationMinutes}-minute slots`, "i")),
    ).toBeVisible();

    await page.getByRole("button", { name: new RegExp(slotLabel) }).click();

    await expect(
      page.getByRole("heading", { name: /you're booked/i }),
    ).toBeVisible();
    await expect(page.getByText(title)).toBeVisible();
    await expect(page.getByText(new RegExp(slotLabel))).toBeVisible();
    await expect(page.getByText(/booking id/i)).toBeVisible();

    await page.getByRole("button", { name: /book another/i }).click();
    await expect(
      page.getByRole("heading", { name: /booked events/i }),
    ).toBeVisible();
    await expect(
      page
        .locator("section")
        .filter({ has: page.getByRole("heading", { name: /booked events/i }) })
        .getByText(title, { exact: true }),
    ).toBeVisible();
  });

  test("hides overlapping times after another event is booked", async ({
    page,
    request,
  }) => {
    const firstTitle = uniqueTitle("Design review");
    const secondTitle = uniqueTitle("Sales call");

    const first = await createEventTypeViaApi(request, {
      title: firstTitle,
      durationMinutes: 30,
    });
    const second = await createEventTypeViaApi(request, {
      title: secondTitle,
      durationMinutes: 30,
    });

    const day = bookingDay();
    const firstSlots = await listSlotsViaApi(request, first.id, day);
    expect(firstSlots.length).toBeGreaterThan(0);

    const occupied = firstSlots[0]!;
    await bookViaApi(request, occupied);

    const remainingForSecond = await listSlotsViaApi(request, second.id, day);
    expect(
      remainingForSecond.some((slot) => slot.datetime === occupied.datetime),
    ).toBe(false);

    const occupiedLabel = slotTimeLabel(occupied.datetime);

    await page.goto("/");
    await page.getByRole("button", { name: secondTitle }).click();
    await selectCalendarDay(page, day);

    await expect(
      page.getByRole("button", { name: new RegExp(occupiedLabel) }),
    ).toHaveCount(0);

    if (remainingForSecond.length > 0) {
      const freeLabel = slotTimeLabel(remainingForSecond[0]!.datetime);
      await expect(
        page.getByRole("button", { name: new RegExp(freeLabel) }),
      ).toBeVisible();
    }
  });

  test("lists booked events on the index page", async ({ page, request }) => {
    const title = uniqueTitle("Team sync");
    const eventType = await createEventTypeViaApi(request, {
      title,
      durationMinutes: 30,
    });

    const day = bookingDay();
    const slots = await listSlotsViaApi(request, eventType.id, day);
    expect(slots.length).toBeGreaterThan(0);

    const slot = slots[0]!;
    await bookViaApi(request, slot);

    const bookings = await listBookingsViaApi(request);
    expect(bookings.some((booking) => booking.title === title)).toBe(true);

    const when = slotDateTimeLabel(slot.datetime);

    await page.goto("/");
    const bookedSection = page
      .locator("section")
      .filter({ has: page.getByRole("heading", { name: /booked events/i }) });
    const bookedItem = bookedSection
      .getByRole("listitem")
      .filter({ hasText: title });

    await expect(
      page.getByRole("heading", { name: /booked events/i }),
    ).toBeVisible();
    await expect(bookedItem.getByText(title, { exact: true })).toBeVisible();
    await expect(bookedItem.getByText(when)).toBeVisible();
    await expect(bookedItem.getByText("30 min")).toBeVisible();
  });
});
