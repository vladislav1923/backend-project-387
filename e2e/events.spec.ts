import { expect, test } from "@playwright/test";
import {
  createEventTypeViaUi,
  uniqueTitle,
} from "./helpers";

test.describe("organizer events", () => {
  test("creates an event type from the dialog form", async ({ page }) => {
    const title = uniqueTitle("Strategy call");

    await createEventTypeViaUi(page, {
      title,
      description: "30-minute planning session",
      durationMinutes: 30,
    });

    await expect(page.getByText("30-minute planning session")).toBeVisible();
    await expect(page.getByText("30 min")).toBeVisible();
  });
});
