"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { CreateEventTypeRequest, EventType } from "@/lib/types";
import { PlusIcon } from "lucide-react";

type CreateEventTypeDialogProps = {
  onCreated: (eventType: EventType) => void;
};

export function CreateEventTypeDialog({
  onCreated,
}: CreateEventTypeDialogProps) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("30");

  function resetForm() {
    setTitle("");
    setDescription("");
    setDurationMinutes("30");
    setError(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const body: CreateEventTypeRequest = {
      title: title.trim(),
      description: description.trim(),
      durationMinutes: Number(durationMinutes),
    };

    try {
      const response = await fetch("/api/create-event-type", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;
        throw new Error(payload?.message ?? "Failed to create event type");
      }

      const created = (await response.json()) as EventType;
      onCreated(created);
      resetForm();
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          resetForm();
        }
      }}
    >
      <DialogTrigger
        render={<Button size="lg" className="gap-2 shadow-sm" />}
      >
        <PlusIcon />
        New event type
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" showCloseButton>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>Create event type</DialogTitle>
            <DialogDescription>
              Define a bookable meeting template with a title, description, and
              duration.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="event-title">Title</FieldLabel>
              <Input
                id="event-title"
                name="title"
                placeholder="Product demo"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                autoFocus
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="event-description">Description</FieldLabel>
              <Textarea
                id="event-description"
                name="description"
                placeholder="A short walkthrough for new customers."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                required
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="event-duration">
                Duration (minutes)
              </FieldLabel>
              <Input
                id="event-duration"
                name="durationMinutes"
                type="number"
                min={1}
                step={1}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                required
              />
            </Field>
          </FieldGroup>

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancel
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
