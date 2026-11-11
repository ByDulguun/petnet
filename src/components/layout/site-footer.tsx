import { getTranslations } from "next-intl/server";
import { Mail } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { FacebookIcon, InstagramIcon } from "@/components/shared/social-icons";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Link } from "@/i18n/navigation";
import { FOOTER_NAV } from "@/lib/constants";

export async function SiteFooter() {
  const t = await getTranslations("footer");

  return (
    <footer className="border-t bg-card">
      <div className="container-page py-14 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_2fr]">
          <div className="max-w-sm space-y-4">
            <Logo />
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t("blurb")}
            </p>
            <div className="flex items-center gap-2 pt-1">
              <a
                href="https://facebook.com/petnet.mn"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="PetNet Facebook"
                className="flex size-9 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:bg-brand-soft hover:text-brand"
              >
                <FacebookIcon className="size-4" />
              </a>
              <a
                href="https://instagram.com/petnet.mn"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="PetNet Instagram"
                className="flex size-9 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:bg-brand-soft hover:text-brand"
              >
                <InstagramIcon className="size-4" />
              </a>
              <a
                href="mailto:hello@petnet.mn"
                aria-label="Email"
                className="flex size-9 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:bg-brand-soft hover:text-brand"
              >
                <Mail className="size-4" />
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {FOOTER_NAV.map((group) => (
              <div key={group.headingKey}>
                <h3 className="mb-4 text-sm font-semibold">{t(group.headingKey)}</h3>
                <ul className="space-y-2.5">
                  {group.items.map((item) => (
                    <li key={item.href}>
                      {item.comingSoon ? (
                        <span
                          aria-disabled="true"
                          className="inline-flex cursor-default items-center gap-1.5 text-sm text-muted-foreground/50"
                        >
                          {t(item.labelKey)}
                          <Badge variant="secondary" className="text-[10px] font-semibold text-muted-foreground/70">
                            {t("comingSoon")}
                          </Badge>
                        </span>
                      ) : (
                        <Link
                          href={item.href}
                          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                        >
                          {t(item.labelKey)}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            {t("copyright", { year: new Date().getFullYear() })}
          </p>
          <p className="text-xs text-muted-foreground">{t("tagline")}</p>
        </div>
      </div>
    </footer>
  );
}
