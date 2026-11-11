import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export function AdminNav({ active }: { active: "claims" | "reports" | "breeds" }) {
  const t = useTranslations("adminReports");

  const tabs = [
    { key: "claims" as const, href: "/admin/claims", label: t("navClaims") },
    { key: "reports" as const, href: "/admin/reports", label: t("navReports") },
    { key: "breeds" as const, href: "/admin/breeds", label: t("navBreeds") },
  ];

  return (
    <nav className="mb-6 flex gap-2" aria-label="Admin sections">
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          className={cn(
            "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
            active === tab.key
              ? "bg-brand-soft text-brand"
              : "text-muted-foreground hover:bg-secondary",
          )}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
