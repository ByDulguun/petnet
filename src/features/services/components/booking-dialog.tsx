"use client";

import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  CalendarCheck2,
  CheckCircle2,
  ChevronLeft,
  Clock3,
  Loader2,
  PawPrint,
  Plus,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "@/i18n/navigation";
import { formatMnt } from "@/lib/utils";
import type {
  BookingConfirmation,
  BookingSlot,
  ServiceView,
} from "@/lib/types";
import type { WorkingHour } from "@/lib/hours";
import { cn } from "@/lib/utils";

const noteSchema = z.object({
  note: z.string().trim().max(500).optional(),
});

type NoteForm = z.infer<typeof noteSchema>;

interface PetOption {
  id: string;
  name: string;
  avatarUrl?: string | null;
}

export function BookingDialog({
  businessSlug,
  businessName,
  services,
  hours,
  trigger,
  initialServiceId,
}: {
  businessSlug: string;
  businessName: string;
  services: ServiceView[];
  hours: WorkingHour[];
  trigger: React.ReactNode;
  initialServiceId?: string;
}) {
  const { status: sessionStatus } = useSession();
  const bookable = useMemo(() => services.filter((s) => s.isBookable), [services]);
  const [open, setOpen] = useState(false);
  const [serviceId, setServiceId] = useState<string | undefined>(initialServiceId);
  const [petId, setPetId] = useState<string | undefined>();
  const [date, setDate] = useState<Date | undefined>();
  const [time, setTime] = useState<string | undefined>();
  const [confirmation, setConfirmation] = useState<BookingConfirmation | null>(null);

  const service = bookable.find((s) => s.id === serviceId);
  const dateISO = date ? format(date, "yyyy-MM-dd") : undefined;
  const signedIn = sessionStatus === "authenticated";

  const openDays = useMemo(
    () => new Set(hours.filter((h) => h.is24h || (h.opensAt && h.closesAt)).map((h) => h.dayOfWeek)),
    [hours],
  );

  const { data: slots, isFetching: loadingSlots } = useQuery<BookingSlot[]>({
    queryKey: ["slots", businessSlug, serviceId, dateISO],
    queryFn: async () => {
      const res = await fetch(
        `/api/businesses/${businessSlug}/slots?serviceId=${serviceId}&date=${dateISO}`,
      );
      if (!res.ok) throw new Error("Failed to load availability");
      const data = (await res.json()) as { slots: BookingSlot[] };
      return data.slots;
    },
    enabled: Boolean(serviceId && dateISO),
  });

  const { data: pets, isFetching: loadingPets } = useQuery<PetOption[]>({
    queryKey: ["pets"],
    queryFn: async () => {
      const res = await fetch("/api/pets");
      if (!res.ok) throw new Error("Failed to load pets");
      const data = (await res.json()) as { pets: PetOption[] };
      return data.pets;
    },
    enabled: signedIn && open,
  });

  const form = useForm<NoteForm>({
    resolver: zodResolver(noteSchema),
    defaultValues: { note: "" },
  });

  const bookMutation = useMutation({
    mutationFn: async (values: NoteForm) => {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessSlug,
          serviceId,
          petId,
          date: dateISO,
          time,
          note: values.note,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Booking failed");
      return data.confirmation as BookingConfirmation;
    },
    onSuccess: (conf) => {
      setConfirmation(conf);
      toast.success("Booking request sent!");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function reset() {
    setServiceId(initialServiceId);
    setPetId(undefined);
    setDate(undefined);
    setTime(undefined);
    setConfirmation(null);
    form.reset();
    bookMutation.reset();
  }

  const selectedPet = pets?.find((p) => p.id === petId);

  const step: "service" | "datetime" | "pet" | "note" | "done" = confirmation
    ? "done"
    : !service
      ? "service"
      : !time
        ? "datetime"
        : !petId
          ? "pet"
          : "note";

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        {sessionStatus !== "loading" && !signedIn ? (
          <div className="py-2 text-center">
            <DialogHeader>
              <DialogTitle className="text-center text-xl">Sign in to book</DialogTitle>
              <DialogDescription className="text-center">
                Bookings are tied to your account and your pets, so the
                business knows who to expect. Sign in to continue.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-6 flex flex-col gap-2">
              <Button className="w-full rounded-full font-semibold" asChild>
                <Link href={`/login?next=/business/${businessSlug}`}>Log in</Link>
              </Button>
              <Button variant="outline" className="w-full rounded-full font-semibold" asChild>
                <Link href="/register">Create account</Link>
              </Button>
            </div>
          </div>
        ) : step === "done" && confirmation ? (
          <div className="py-4 text-center">
            <CheckCircle2 className="mx-auto size-14 text-success" aria-hidden="true" />
            <DialogHeader className="mt-4">
              <DialogTitle className="text-center text-xl">
                Booking request sent
              </DialogTitle>
              <DialogDescription className="text-center">
                {businessName} will confirm your{selectedPet ? ` visit for ${selectedPet.name}` : " request"} shortly
                — you&apos;ll get a notification, and you can check the status anytime under My Bookings.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-6 space-y-2 rounded-2xl bg-secondary p-4 text-left text-sm">
              <Row label="Booking ID" value={confirmation.id.slice(0, 10).toUpperCase()} mono />
              <Row label="Service" value={confirmation.serviceName} />
              <Row
                label="When"
                value={`${format(new Date(`${confirmation.date}T00:00:00`), "EEE, MMM d")} · ${confirmation.time}`}
              />
              <Row label="Duration" value={`${confirmation.durationMin} min`} />
              {confirmation.priceMnt !== undefined && (
                <Row
                  label="Price"
                  value={confirmation.priceMnt === 0 ? "Free" : formatMnt(confirmation.priceMnt)}
                />
              )}
            </div>
            <div className="mt-6 flex flex-col gap-2">
              <Button className="w-full rounded-full font-semibold" asChild>
                <Link href="/bookings">View my bookings</Link>
              </Button>
              <Button variant="outline" className="w-full rounded-full font-semibold" onClick={() => setOpen(false)}>
                Done
              </Button>
            </div>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {step !== "service" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="-ml-2 size-8"
                    aria-label="Back"
                    onClick={() => {
                      if (step === "note") setPetId(undefined);
                      else if (step === "pet") setTime(undefined);
                      else if (step === "datetime") setServiceId(undefined);
                    }}
                  >
                    <ChevronLeft className="size-4.5" />
                  </Button>
                )}
                Book at {businessName}
              </DialogTitle>
              <DialogDescription>
                {step === "service" && "Choose a service to see availability."}
                {step === "datetime" && `${service?.name} — pick a date and time.`}
                {step === "pet" && "Which pet is this for?"}
                {step === "note" &&
                  `${service?.name} · ${dateISO && format(new Date(`${dateISO}T00:00:00`), "EEE, MMM d")} at ${time}`}
              </DialogDescription>
            </DialogHeader>

            {step === "service" && (
              <div className="space-y-2" role="list" aria-label="Bookable services">
                {bookable.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    role="listitem"
                    onClick={() => setServiceId(s.id)}
                    className="flex w-full items-center justify-between gap-3 rounded-2xl border bg-card p-4 text-left transition-colors hover:border-brand/40 hover:bg-brand-soft/40"
                  >
                    <span>
                      <span className="block text-sm font-bold">{s.name}</span>
                      {s.description && (
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {s.description}
                        </span>
                      )}
                      <span className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        {s.durationMin && (
                          <span className="inline-flex items-center gap-1">
                            <Clock3 className="size-3.5" aria-hidden="true" />
                            {s.durationMin} min
                          </span>
                        )}
                      </span>
                    </span>
                    <span className="shrink-0 text-sm font-bold text-brand">
                      {s.priceMnt === 0
                        ? "Free"
                        : s.priceMnt
                          ? `${formatMnt(s.priceMnt)}${s.priceMaxMnt ? "+" : ""}`
                          : "—"}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {step === "datetime" && (
              <div className="space-y-4">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => {
                    setDate(d);
                    setTime(undefined);
                  }}
                  disabled={(d) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return d < today || !openDays.has(d.getDay());
                  }}
                  className="mx-auto rounded-2xl border"
                />
                {dateISO && (
                  <div aria-live="polite">
                    <p className="mb-2 text-sm font-bold">
                      Available times{" "}
                      {loadingSlots && (
                        <Loader2 className="ml-1 inline size-3.5 animate-spin" aria-label="Loading" />
                      )}
                    </p>
                    {slots && slots.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        Closed on this date — try another day.
                      </p>
                    )}
                    <div className="grid grid-cols-4 gap-2">
                      {slots?.map((slot) => (
                        <button
                          key={slot.time}
                          type="button"
                          disabled={!slot.available}
                          onClick={() => setTime(slot.time)}
                          className={cn(
                            "h-9 rounded-full border text-[13px] font-semibold transition-colors",
                            slot.available
                              ? "bg-card hover:border-brand/40 hover:bg-brand-soft hover:text-brand"
                              : "cursor-not-allowed bg-secondary text-muted-foreground/40 line-through",
                          )}
                        >
                          {slot.time}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {step === "pet" && (
              <div className="space-y-2">
                {loadingPets ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    <Loader2 className="mx-auto mb-2 size-5 animate-spin" />
                    Loading your pets…
                  </p>
                ) : pets && pets.length > 0 ? (
                  <div className="space-y-2" role="list" aria-label="Your pets">
                    {pets.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        role="listitem"
                        onClick={() => setPetId(p.id)}
                        className="flex w-full items-center gap-3 rounded-2xl border bg-card p-4 text-left transition-colors hover:border-brand/40 hover:bg-brand-soft/40"
                      >
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-soft">
                          <PawPrint className="size-5 text-brand" aria-hidden="true" />
                        </span>
                        <span className="text-sm font-bold">{p.name}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-2xl bg-secondary px-4 py-6 text-center text-sm text-muted-foreground">
                    You haven&apos;t added a pet yet.
                  </p>
                )}
                <Button variant="outline" className="w-full rounded-full font-semibold" asChild>
                  <Link href={`/pets/new?next=/business/${businessSlug}`}>
                    <Plus className="size-4" />
                    Add a new pet
                  </Link>
                </Button>
              </div>
            )}

            {step === "note" && (
              <form
                onSubmit={form.handleSubmit((values) => bookMutation.mutate(values))}
                className="space-y-4"
              >
                <div className="rounded-2xl bg-secondary p-4 text-sm">
                  <p className="font-bold">{selectedPet?.name}</p>
                  <p className="text-muted-foreground">
                    {service?.name} · {dateISO && format(new Date(`${dateISO}T00:00:00`), "EEE, MMM d")} at {time}
                  </p>
                </div>
                <Textarea
                  placeholder="Anything the team should know — behavior, allergies… (optional)"
                  rows={3}
                  {...form.register("note")}
                />
                <Button
                  type="submit"
                  disabled={bookMutation.isPending}
                  className="w-full rounded-full font-semibold"
                >
                  {bookMutation.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <CalendarCheck2 className="size-4" />
                  )}
                  Confirm booking
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Free cancellation up to 3 hours before your appointment.
                </p>
              </form>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("font-semibold", mono && "font-mono text-xs")}>{value}</span>
    </div>
  );
}
