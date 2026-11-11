"use client";

import { useTranslations } from "next-intl";

import type { OpenStatus } from "@/lib/hours";

/** Renders a structured OpenStatus in the active locale. */
export function useOpenStatusText(): (status: OpenStatus) => string {
  const t = useTranslations("openStatus");
  const days = useTranslations("days");

  return (status: OpenStatus) => {
    switch (status.kind) {
      case "open":
        return t("open", { time: status.time ?? "" });
      case "closesSoon":
        return t("closesSoon", { time: status.time ?? "" });
      case "open24h":
        return t("open24h");
      case "opensLater":
        return t("opensLater", { time: status.time ?? "" });
      case "opensTomorrow":
        return t("opensTomorrow", { time: status.time ?? "" });
      case "opensOnDay":
        return t("opensOnDay", {
          time: status.time ?? "",
          day: days(String(status.dayOfWeek ?? 0)),
        });
      case "notListed":
        return t("notListed");
      case "tempClosed":
        return t("tempClosed");
    }
  };
}

export function OpenStatusText({ status }: { status: OpenStatus }) {
  const format = useOpenStatusText();
  return <>{format(status)}</>;
}
