// Opening-hours logic. All computations use the business's local timezone
// (Asia/Ulaanbaatar, UTC+8, no DST) regardless of where the server runs.
// Statuses are returned as structured data (kind + params) so the UI can
// render them in any locale via the `openStatus` message namespace.

export interface WorkingHour {
  dayOfWeek: number; // 0 = Sunday … 6 = Saturday
  opensAt: string | null; // "09:00"; null = closed
  closesAt: string | null;
  is24h: boolean;
}

export type OpenStatusKind =
  | "open"
  | "closesSoon"
  | "open24h"
  | "opensLater"
  | "opensTomorrow"
  | "opensOnDay"
  | "notListed"
  | "tempClosed";

export interface OpenStatus {
  isOpen: boolean;
  is24h: boolean;
  kind: OpenStatusKind;
  time?: string;
  dayOfWeek?: number;
}

const TIME_ZONE = "Asia/Ulaanbaatar";

/** Parses an `<input type="datetime-local">` value (no timezone of its
 * own) as Ulaanbaatar wall-clock time — UTC+8, no DST, so a fixed offset
 * is correct regardless of what timezone the server or the visitor's
 * device is actually in. Used for event start/end times. */
export function ubLocalInputToDate(value: string): Date {
  return new Date(`${value}:00+08:00`);
}

/** Inverse of ubLocalInputToDate: formats a stored UTC instant back into
 * the "YYYY-MM-DDTHH:mm" shape a datetime-local input expects, as it
 * would read on a clock in Ulaanbaatar. */
export function dateToUbLocalInput(date: Date): string {
  const shifted = new Date(date.getTime() + 8 * 60 * 60 * 1000);
  return shifted.toISOString().slice(0, 16);
}

/** Current weekday + minutes-since-midnight in Ulaanbaatar. */
export function nowInUlaanbaatar(now = new Date()): {
  dayOfWeek: number;
  minutes: number;
} {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const dayOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(
    get("weekday"),
  );
  // Intl can emit "24:xx" for midnight with hour12: false
  const hour = Number(get("hour")) % 24;
  const minutes = hour * 60 + Number(get("minute"));
  return { dayOfWeek: Math.max(0, dayOfWeek), minutes };
}

function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function getOpenStatus(hours: WorkingHour[], now = new Date()): OpenStatus {
  if (hours.length === 0) {
    return { isOpen: false, is24h: false, kind: "notListed" };
  }

  const { dayOfWeek, minutes } = nowInUlaanbaatar(now);
  const today = hours.find((h) => h.dayOfWeek === dayOfWeek);

  if (today?.is24h) {
    return { isOpen: true, is24h: true, kind: "open24h" };
  }

  if (today?.opensAt && today.closesAt) {
    const opens = toMinutes(today.opensAt);
    const closes = toMinutes(today.closesAt);

    if (minutes >= opens && minutes < closes) {
      const closingSoon = closes - minutes <= 60;
      return {
        isOpen: true,
        is24h: false,
        kind: closingSoon ? "closesSoon" : "open",
        time: today.closesAt,
      };
    }
    if (minutes < opens) {
      return { isOpen: false, is24h: false, kind: "opensLater", time: today.opensAt };
    }
  }

  // Closed for today — find the next day with hours.
  for (let offset = 1; offset <= 7; offset++) {
    const day = (dayOfWeek + offset) % 7;
    const next = hours.find((h) => h.dayOfWeek === day);
    if (next?.is24h || (next?.opensAt && next.closesAt)) {
      const time = next.is24h ? "00:00" : (next.opensAt as string);
      if (offset === 1) {
        return { isOpen: false, is24h: false, kind: "opensTomorrow", time };
      }
      return { isOpen: false, is24h: false, kind: "opensOnDay", time, dayOfWeek: day };
    }
  }

  return { isOpen: false, is24h: false, kind: "tempClosed" };
}

export function isOpen24Hours(hours: WorkingHour[]): boolean {
  return hours.length > 0 && hours.every((h) => h.is24h);
}

export type ScheduleRowKind = "allDay" | "range" | "closed";

/** Weekly schedule rows for display, Monday first. Day names come from i18n. */
export function weeklySchedule(hours: WorkingHour[]): {
  dayOfWeek: number;
  kind: ScheduleRowKind;
  opensAt?: string;
  closesAt?: string;
}[] {
  const order = [1, 2, 3, 4, 5, 6, 0];
  return order.map((dayOfWeek) => {
    const h = hours.find((x) => x.dayOfWeek === dayOfWeek);
    if (h?.is24h) return { dayOfWeek, kind: "allDay" as const };
    if (h?.opensAt && h.closesAt)
      return { dayOfWeek, kind: "range" as const, opensAt: h.opensAt, closesAt: h.closesAt };
    return { dayOfWeek, kind: "closed" as const };
  });
}
