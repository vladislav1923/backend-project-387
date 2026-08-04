import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { EventType } from "@/lib/types";
import { ClockIcon } from "lucide-react";

type EventTypeCardProps = {
  eventType: EventType;
  className?: string;
  onSelect?: (eventType: EventType) => void;
};

export function EventTypeCard({
  eventType,
  className,
  onSelect,
}: EventTypeCardProps) {
  const interactive = Boolean(onSelect);

  return (
    <Card
      className={cn(
        "h-full transition-shadow",
        interactive &&
          "cursor-pointer hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/50 outline-none",
        className,
      )}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={interactive ? () => onSelect?.(eventType) : undefined}
      onKeyDown={
        interactive
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSelect?.(eventType);
              }
            }
          : undefined
      }
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-lg">{eventType.title}</CardTitle>
          <Badge variant="secondary" className="shrink-0">
            <ClockIcon data-icon="inline-start" />
            {eventType.durationMinutes} min
          </Badge>
        </div>
        <CardDescription className="line-clamp-3">
          {eventType.description || "No description"}
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
