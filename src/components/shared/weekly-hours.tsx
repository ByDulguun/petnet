"use client";

import { useTranslations } from "next-intl";

import type { weeklySchedule } from "@/lib/hours";
import { cn } from "@/lib/utils";

type ScheduleRow = ReturnType<typeof weeklySchedule>[number];

/** Renders a business's weekly hours, today's row highlighted. */
export function WeeklyHours({
  schedule,
  today,
}: {
  schedule: ScheduleRow[];
  today: number;
}) {
  const t = useTranslations("openStatus");
  const days = useTranslations("days");

  function label(row: ScheduleRow): string {
    if (row.kind === "allDay") return t("allDay");
    if (row.kind === "closed") return t("closedLabel");
    return t("range", { opensAt: row.opensAt ?? "", closesAt: row.closesAt ?? "" });
  }

  return (
    <ul className="mt-3 space-y-1.5">
      {schedule.map((row) => (
        <li
          key={row.dayOfWeek}
          className={cn(
            "flex items-center justify-between rounded-lg px-2 py-1 text-[13px]",
            row.dayOfWeek === today && "bg-brand-soft font-semibold text-brand",
          )}
        >
          <span>{days(String(row.dayOfWeek))}</span>
          <span>{label(row)}</span>
        </li>
      ))}
    </ul>
  );
}
