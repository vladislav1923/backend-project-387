"use client";

import {
  formatMoscowDateTime,
  formatMoscowTime,
} from "@/lib/moscow-time";
import type { BookedEvent, Booking, EventType, Slot } from "@/lib/types";
import {
  ArrowLeftIcon,
  CalendarDaysIcon,
  CheckCircle2Icon,
  ClockIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { addDays, format, startOfDay } from "date-fns";
import { EventTypeCard } from "@/components/events/event-type-card";
import { BookedEventsList } from "@/components/guest/booked-events-list";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

type Step = "list" | "calendar" | "slots" | "confirmed";

function toDateOnly(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function GuestBookingPage() {
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [bookings, setBookings] = useState<BookedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [step, setStep] = useState<Step>("list");
  const [selectedEventType, setSelectedEventType] = useState<EventType | null>(
    null,
  );
  const [selectedDay, setSelectedDay] = useState<Date | undefined>();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [bookingPending, setBookingPending] = useState(false);
  const [booking, setBooking] = useState<Booking | null>(null);

  const today = useMemo(() => startOfDay(new Date()), []);
  const windowEnd = useMemo(() => addDays(today, 13), [today]);

  const loadBookings = useCallback(async () => {
    setBookingsLoading(true);
    try {
      const response = await fetch("/api/bookings");
      if (!response.ok) {
        throw new Error("Failed to load bookings");
      }
      const data = (await response.json()) as BookedEvent[];
      setBookings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load bookings");
    } finally {
      setBookingsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/event-types");
        if (!response.ok) {
          throw new Error("Failed to load event types");
        }
        const data = (await response.json()) as EventType[];
        if (!cancelled) {
          setEventTypes(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();
    void loadBookings();
    return () => {
      cancelled = true;
    };
  }, [loadBookings]);

  useEffect(() => {
    if (!selectedEventType || !selectedDay || step !== "slots") {
      return;
    }

    let cancelled = false;

    async function loadSlots() {
      setSlotsLoading(true);
      setError(null);
      try {
        const date = toDateOnly(selectedDay!);
        const response = await fetch(
          `/api/event-types/${selectedEventType!.id}/slots?date=${date}`,
        );
        if (!response.ok) {
          throw new Error("Failed to load slots");
        }
        const data = (await response.json()) as Slot[];
        if (!cancelled) {
          setSlots(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load slots");
          setSlots([]);
        }
      } finally {
        if (!cancelled) {
          setSlotsLoading(false);
        }
      }
    }

    void loadSlots();
    return () => {
      cancelled = true;
    };
  }, [selectedEventType, selectedDay, step]);

  function selectEventType(eventType: EventType) {
    setSelectedEventType(eventType);
    setSelectedDay(undefined);
    setSelectedSlot(null);
    setBooking(null);
    setSlots([]);
    setError(null);
    setStep("calendar");
  }

  function selectDay(day: Date | undefined) {
    if (!day) {
      return;
    }
    setSelectedDay(day);
    setSelectedSlot(null);
    setError(null);
    setStep("slots");
  }

  async function bookSlot(slot: Slot) {
    if (!selectedEventType) {
      return;
    }

    setSelectedSlot(slot);
    setBookingPending(true);
    setError(null);

    try {
      const response = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotId: slot.id,
          eventTypeId: selectedEventType.id,
          guest: {},
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;
        throw new Error(payload?.message ?? "Failed to book slot");
      }

      const created = (await response.json()) as Booking;
      setBooking(created);
      setStep("confirmed");
      void loadBookings();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to book");
      setSlots((current) => current.filter((item) => item.id !== slot.id));
    } finally {
      setBookingPending(false);
    }
  }

  function resetToList() {
    setStep("list");
    setSelectedEventType(null);
    setSelectedDay(undefined);
    setSelectedSlot(null);
    setBooking(null);
    setSlots([]);
    setError(null);
    void loadBookings();
  }

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_oklch(0.95_0.02_160)_0%,_transparent_55%)] dark:bg-[radial-gradient(ellipse_at_top,_oklch(0.25_0.03_160)_0%,_transparent_55%)]"
      />

      <main className="relative mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-12 md:py-16">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex max-w-xl flex-col gap-2">
            <p className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
              Guest booking
            </p>
            <h1 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">
              {step === "list" && "Choose an event"}
              {step === "calendar" && selectedEventType?.title}
              {step === "slots" && selectedEventType?.title}
              {step === "confirmed" && "You're booked"}
            </h1>
            <p className="text-base text-muted-foreground md:text-lg">
              {step === "list" &&
                "Pick an event type to see available days for the next two weeks."}
              {step === "calendar" &&
                "Select a day within the next two weeks."}
              {step === "slots" &&
                selectedDay &&
                `Available ${selectedEventType?.durationMinutes}-minute slots on ${format(selectedDay, "EEEE, MMM d")} (10:00–17:00 Moscow time).`}
              {step === "confirmed" &&
                "Your meeting is confirmed. See you then."}
            </p>
          </div>

          {step !== "list" ? (
            <Button
              variant="outline"
              onClick={() => {
                if (step === "confirmed") {
                  resetToList();
                  return;
                }
                if (step === "slots") {
                  setStep("calendar");
                  setSelectedSlot(null);
                  setSlots([]);
                  return;
                }
                resetToList();
              }}
            >
              <ArrowLeftIcon data-icon="inline-start" />
              {step === "confirmed" ? "Book another" : "Back"}
            </Button>
          ) : null}
        </header>

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        {step === "list" ? (
          <div className="flex flex-col gap-10">
            <section className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <h2 className="font-heading text-xl font-semibold tracking-tight">
                  Event types
                </h2>
                <p className="text-sm text-muted-foreground">
                  Select a type to book a time.
                </p>
              </div>

              {loading ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {[0, 1].map((key) => (
                    <div
                      key={key}
                      className="h-36 animate-pulse rounded-xl bg-muted/70 ring-1 ring-foreground/5"
                    />
                  ))}
                </div>
              ) : eventTypes.length === 0 ? (
                <Empty className="border border-dashed bg-card/60 py-16">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <CalendarDaysIcon />
                    </EmptyMedia>
                    <EmptyTitle>No events to book</EmptyTitle>
                    <EmptyDescription>
                      An organizer needs to create event types before guests can
                      book.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <ul className="grid list-none gap-4 sm:grid-cols-2">
                  {eventTypes.map((eventType) => (
                    <li key={eventType.id}>
                      <EventTypeCard
                        eventType={eventType}
                        onSelect={selectEventType}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <h2 className="font-heading text-xl font-semibold tracking-tight">
                  Booked events
                </h2>
                <p className="text-sm text-muted-foreground">
                  Upcoming meetings appear first.
                </p>
              </div>
              <BookedEventsList
                bookings={bookings}
                loading={bookingsLoading}
              />
            </section>
          </div>
        ) : null}

        {step === "calendar" && selectedEventType ? (
          <Card className="mx-auto w-fit">
            <CardHeader>
              <CardTitle>Pick a day</CardTitle>
              <CardDescription>
                Booking window: {format(today, "MMM d")} –{" "}
                {format(windowEnd, "MMM d")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDay}
                onSelect={selectDay}
                disabled={{ before: today, after: windowEnd }}
                defaultMonth={today}
              />
            </CardContent>
          </Card>
        ) : null}

        {step === "slots" && selectedEventType && selectedDay ? (
          <div className="mx-auto flex w-full max-w-md flex-col gap-4">
            {slotsLoading ? (
              <div className="flex flex-col gap-2">
                {[0, 1, 2, 3].map((key) => (
                  <div
                    key={key}
                    className="h-11 animate-pulse rounded-lg bg-muted/70"
                  />
                ))}
              </div>
            ) : slots.length === 0 ? (
              <Empty className="border border-dashed bg-card/60 py-12">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <ClockIcon />
                  </EmptyMedia>
                  <EmptyTitle>No slots left</EmptyTitle>
                  <EmptyDescription>
                    Try another day in the calendar.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <ul className="flex list-none flex-col gap-2">
                {slots.map((slot) => {
                  const time = formatMoscowTime(new Date(slot.datetime));
                  const isSelected = selectedSlot?.id === slot.id;
                  return (
                    <li key={slot.id}>
                      <Button
                        variant={isSelected ? "default" : "outline"}
                        className="h-11 w-full justify-between px-4"
                        disabled={bookingPending}
                        onClick={() => void bookSlot(slot)}
                      >
                        <span className="inline-flex items-center gap-2">
                          <ClockIcon />
                          {time}
                        </span>
                        <span className="text-xs opacity-80">
                          {bookingPending && isSelected
                            ? "Booking…"
                            : `${selectedEventType.durationMinutes} min`}
                        </span>
                      </Button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        ) : null}

        {step === "confirmed" && booking && selectedEventType && selectedSlot ? (
          <Card className="mx-auto w-full max-w-md">
            <CardHeader>
              <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-muted">
                <CheckCircle2Icon className="size-5" />
              </div>
              <CardTitle>{selectedEventType.title}</CardTitle>
              <CardDescription>
                {formatMoscowDateTime(new Date(selectedSlot.datetime))} ·{" "}
                {selectedEventType.durationMinutes} min
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Booking ID{" "}
              <span className="font-mono text-foreground">
                {booking.id.slice(0, 8)}
              </span>
            </CardContent>
          </Card>
        ) : null}
      </main>
    </div>
  );
}
