/** Europe/Moscow is UTC+3 year-round (no DST). */
export const MOSCOW_TZ = "Europe/Moscow";
export const MOSCOW_OFFSET = "+03:00";

export const DAY_START_HOUR = 10;
export const DAY_END_HOUR = 17;

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

/** Calendar date in Moscow as YYYY-MM-DD. */
export function moscowDateOnly(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: MOSCOW_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** Instant for a Moscow wall-clock time on a YYYY-MM-DD date. */
export function moscowDateTime(
  dateOnly: string,
  hour: number,
  minute = 0,
): Date {
  return new Date(
    `${dateOnly}T${pad2(hour)}:${pad2(minute)}:00${MOSCOW_OFFSET}`,
  );
}

export function formatMoscowTime(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: MOSCOW_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function formatMoscowDateTime(date: Date): string {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: MOSCOW_TZ,
    weekday: "long",
  }).format(date);
  const monthDay = new Intl.DateTimeFormat("en-US", {
    timeZone: MOSCOW_TZ,
    month: "short",
    day: "numeric",
  }).format(date);

  return `${weekday}, ${monthDay} · ${formatMoscowTime(date)}`;
}
