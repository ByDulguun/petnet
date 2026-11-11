"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Save } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface DayRow {
  dayOfWeek: number;
  isOpen: boolean;
  is24h: boolean;
  opensAt: string;
  closesAt: string;
}

const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

export interface InitialHour {
  dayOfWeek: number;
  opensAt: string | null;
  closesAt: string | null;
  is24h: boolean;
}

export function BusinessHoursForm({ initial }: { initial: InitialHour[] }) {
  const t = useTranslations("businessAvailability");
  const tDays = useTranslations("days");

  const [rows, setRows] = useState<DayRow[]>(() =>
    DISPLAY_ORDER.map((dayOfWeek) => {
      const existing = initial.find((h) => h.dayOfWeek === dayOfWeek);
      return {
        dayOfWeek,
        isOpen: Boolean(existing?.is24h || (existing?.opensAt && existing?.closesAt)),
        is24h: existing?.is24h ?? false,
        opensAt: existing?.opensAt ?? "09:00",
        closesAt: existing?.closesAt ?? "18:00",
      };
    }),
  );

  function updateRow(dayOfWeek: number, patch: Partial<DayRow>) {
    setRows((prev) => prev.map((r) => (r.dayOfWeek === dayOfWeek ? { ...r, ...patch } : r)));
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/business/hours", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hours: rows }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("genericError"));
    },
    onSuccess: () => toast.success(t("saveSuccess")),
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.dayOfWeek} className="rounded-2xl border bg-card p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="w-28 shrink-0 text-sm font-bold">{tDays(String(row.dayOfWeek))}</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{t("openToggle")}</span>
              <Switch
                checked={row.isOpen}
                onCheckedChange={(v) => updateRow(row.dayOfWeek, { isOpen: v })}
              />
            </div>
          </div>
          {row.isOpen && (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <Switch
                  checked={row.is24h}
                  onCheckedChange={(v) => updateRow(row.dayOfWeek, { is24h: v })}
                />
                {t("open24hToggle")}
              </label>
              {!row.is24h && (
                <div className={cn("flex items-center gap-2")}>
                  <span className="text-xs text-muted-foreground">{t("opensLabel")}</span>
                  <Input
                    type="time"
                    className="h-8 w-28"
                    value={row.opensAt}
                    onChange={(e) => updateRow(row.dayOfWeek, { opensAt: e.target.value })}
                  />
                  <span className="text-xs text-muted-foreground">{t("closesLabel")}</span>
                  <Input
                    type="time"
                    className="h-8 w-28"
                    value={row.closesAt}
                    onChange={(e) => updateRow(row.dayOfWeek, { closesAt: e.target.value })}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      <Button
        onClick={() => saveMutation.mutate()}
        disabled={saveMutation.isPending}
        className="w-full rounded-full font-semibold"
      >
        {saveMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
        {t("saveButton")}
      </Button>
    </div>
  );
}
