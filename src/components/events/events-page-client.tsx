"use client";

import { useEffect, useState } from "react";
import { CreateEventTypeDialog } from "@/components/events/create-event-type-dialog";
import { EventTypeCard } from "@/components/events/event-type-card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import type { EventType } from "@/lib/types";
import { CalendarDaysIcon } from "lucide-react";

export function EventsPageClient() {
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_oklch(0.95_0.02_250)_0%,_transparent_55%)] dark:bg-[radial-gradient(ellipse_at_top,_oklch(0.25_0.03_250)_0%,_transparent_55%)]"
      />

      <main className="relative mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-6 py-12 md:py-16">
        <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex max-w-xl flex-col gap-2">
            <p className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
              Event types
            </p>
            <h1 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">
              Your bookable events
            </h1>
            <p className="text-base text-muted-foreground md:text-lg">
              Create meeting templates guests can book. Each type has a title,
              description, and duration in minutes.
            </p>
          </div>
          <CreateEventTypeDialog
            onCreated={(created) =>
              setEventTypes((current) => [created, ...current])
            }
          />
        </header>

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {[0, 1].map((key) => (
              <div
                key={key}
                className="h-40 animate-pulse rounded-xl bg-muted/70 ring-1 ring-foreground/5"
              />
            ))}
          </div>
        ) : eventTypes.length === 0 ? (
          <Empty className="border border-dashed bg-card/60 py-16">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <CalendarDaysIcon />
              </EmptyMedia>
              <EmptyTitle>No event types yet</EmptyTitle>
              <EmptyDescription>
                Create your first event type to start offering bookable slots.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ul className="grid list-none gap-4 sm:grid-cols-2">
            {eventTypes.map((eventType) => (
              <li key={eventType.id}>
                <EventTypeCard eventType={eventType} />
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
