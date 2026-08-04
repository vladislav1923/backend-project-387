import { Badge } from "@/components/ui/badge";
import {
  Card,
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
import { formatMoscowDateTime } from "@/lib/moscow-time";
import type { BookedEvent } from "@/lib/types";
import { CalendarCheckIcon, ClockIcon } from "lucide-react";

type BookedEventsListProps = {
  bookings: BookedEvent[];
  loading?: boolean;
};

export function BookedEventsList({
  bookings,
  loading = false,
}: BookedEventsListProps) {
  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {[0, 1].map((key) => (
          <div
            key={key}
            className="h-24 animate-pulse rounded-xl bg-muted/70 ring-1 ring-foreground/5"
          />
        ))}
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <Empty className="border border-dashed bg-card/60 py-10">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <CalendarCheckIcon />
          </EmptyMedia>
          <EmptyTitle>No bookings yet</EmptyTitle>
          <EmptyDescription>
            Confirmed meetings will show up here.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  const now = Date.now();

  return (
    <ul className="flex list-none flex-col gap-3">
      {bookings.map((booking) => {
        const start = new Date(booking.datetime);
        const isPast = start.getTime() < now;

        return (
          <li key={booking.id}>
            <Card className={isPast ? "opacity-70" : undefined}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-base">{booking.title}</CardTitle>
                  <Badge variant={isPast ? "outline" : "secondary"}>
                    <ClockIcon data-icon="inline-start" />
                    {booking.durationMinutes} min
                  </Badge>
                </div>
                <CardDescription>
                  {formatMoscowDateTime(start)}
                  {isPast ? " · past" : ""}
                </CardDescription>
              </CardHeader>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
