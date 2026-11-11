import { getTranslations } from "next-intl/server";
import { ArrowRight, PawPrint } from "lucide-react";

import { PetNetMark } from "@/components/brand/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FadeUp } from "@/components/shared/motion";
import { Link } from "@/i18n/navigation";
import { AUTH_ROUTES_LIVE } from "@/lib/constants";

export async function HomeCta() {
  const t = await getTranslations("home.cta");
  const tNav = await getTranslations("nav");

  return (
    <section className="container-page pb-20 lg:pb-28">
      <FadeUp>
        <div className="relative overflow-hidden rounded-[2.5rem] bg-[#0f172a] px-6 py-16 text-center sm:px-12 lg:py-20 dark:border">
          {/* ambient glows */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <div className="absolute -top-24 -left-16 size-80 rounded-full bg-brand/25 blur-3xl" />
            <div className="absolute -right-16 -bottom-24 size-80 rounded-full bg-brand-blue/25 blur-3xl" />
            <PawPrint className="absolute top-10 left-[12%] size-8 rotate-[-18deg] text-white/10" />
            <PawPrint className="absolute top-24 right-[10%] size-6 rotate-[24deg] text-white/10" />
            <PawPrint className="absolute bottom-12 left-[22%] size-5 rotate-[10deg] text-white/10" />
            <PawPrint className="absolute right-[24%] bottom-20 size-9 rotate-[-8deg] text-white/10" />
          </div>

          <div className="relative mx-auto max-w-2xl">
            <PetNetMark className="mx-auto size-14" />
            <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-balance text-white sm:text-4xl">
              {t("title")}
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-slate-300">{t("subtitle")}</p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              {AUTH_ROUTES_LIVE ? (
                <Button
                  size="lg"
                  className="h-12 rounded-full bg-brand px-8 text-[15px] font-bold text-white hover:bg-brand/90"
                  asChild
                >
                  <Link href="/register">
                    {t("primary")}
                    <ArrowRight className="size-4.5" />
                  </Link>
                </Button>
              ) : (
                <Button
                  size="lg"
                  disabled
                  className="h-12 gap-2 rounded-full bg-brand/40 px-8 text-[15px] font-bold text-white/70"
                >
                  {t("primary")}
                  <Badge variant="secondary" className="bg-white/15 text-[10px] font-semibold text-white/80">
                    {tNav("comingSoon")}
                  </Badge>
                </Button>
              )}
              <Button
                size="lg"
                variant="outline"
                disabled
                className="h-12 gap-2 rounded-full border-white/20 bg-white/5 px-8 text-[15px] font-semibold text-white/60"
              >
                {t("secondary")}
                <Badge variant="secondary" className="bg-white/15 text-[10px] font-semibold text-white/80">
                  {tNav("comingSoon")}
                </Badge>
              </Button>
            </div>
          </div>
        </div>
      </FadeUp>
    </section>
  );
}
