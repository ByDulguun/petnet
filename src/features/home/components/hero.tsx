"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { CalendarCheck2, MapPin, Search, ShieldCheck, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Link, useRouter } from "@/i18n/navigation";

const EASE = [0.16, 1, 0.3, 1] as const;

export function Hero() {
  const t = useTranslations("home.hero");
  const router = useRouter();

  const quickSearches = [
    { label: t("quickVets"), href: "/map?category=veterinary-clinic" },
    { label: t("quickGrooming"), href: "/map?category=grooming-salon" },
    { label: t("quickParks"), href: "/map?category=dog-park" },
  ];

  // reduced-motion users get these without transforms via MotionConfig
  const enter = (delay: number) => ({
    initial: { opacity: 0, y: 28 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, delay, ease: EASE },
  });

  function onSearch(formData: FormData) {
    const q = String(formData.get("q") ?? "").trim();
    router.push(q ? `/map?q=${encodeURIComponent(q)}` : "/map");
  }

  return (
    <section className="relative overflow-hidden">
      {/* ambient background */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 -right-32 size-[34rem] rounded-full bg-brand/10 blur-3xl" />
        <div className="absolute top-40 -left-40 size-[28rem] rounded-full bg-brand-blue/10 blur-3xl" />
      </div>

      <div className="container-page grid items-center gap-12 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8 lg:py-24">
        {/* Copy + search */}
        <div className="max-w-xl">
          <motion.div {...enter(0)}>
            <span className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand-soft px-3.5 py-1.5 text-[13px] font-semibold text-brand">
              {t("badge")}
            </span>
          </motion.div>

          <motion.h1
            {...enter(0.08)}
            className="mt-5 text-4xl leading-[1.08] font-extrabold tracking-tight text-balance sm:text-5xl lg:text-6xl"
          >
            {t("title1")}{" "}
            <span className="relative">
              <span className="text-brand">{t("title2")}</span>
              <svg
                viewBox="0 0 220 12"
                aria-hidden="true"
                className="absolute -bottom-2 left-0 h-3 w-full text-brand/30"
                preserveAspectRatio="none"
              >
                <path
                  d="M3 9C60 3 160 3 217 9"
                  stroke="currentColor"
                  strokeWidth="5"
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
            </span>
          </motion.h1>

          <motion.p
            {...enter(0.16)}
            className="mt-6 text-lg leading-relaxed text-muted-foreground"
          >
            {t("subtitle")}
          </motion.p>

          {/* Search */}
          <motion.form
            {...enter(0.24)}
            action={onSearch}
            className="mt-8 flex items-center gap-2 rounded-full border bg-card p-2 pl-5 shadow-soft transition-shadow focus-within:shadow-lifted"
          >
            <Search className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
            <input
              type="search"
              name="q"
              placeholder={t("searchPlaceholder")}
              aria-label={t("searchLabel")}
              className="h-11 w-full min-w-0 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground/70"
            />
            <Button type="submit" size="lg" className="rounded-full px-6 font-semibold">
              {t("searchButton")}
            </Button>
          </motion.form>

          <motion.div {...enter(0.32)} className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-[13px] text-muted-foreground">{t("popular")}</span>
            {quickSearches.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full border bg-card px-3.5 py-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:border-brand/30 hover:bg-brand-soft hover:text-brand"
              >
                {item.label}
              </Link>
            ))}
          </motion.div>
        </div>

        {/* Visual */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: EASE }}
          className="relative mx-auto hidden w-full max-w-lg lg:block"
        >
          <div className="relative aspect-[4/5] overflow-hidden rounded-[2.5rem] shadow-lifted">
            <Image
              src="https://images.unsplash.com/photo-1518717758536-85ae29035b6d?auto=format&fit=crop&w=1000&q=80"
              alt={t("heroAlt")}
              fill
              priority
              sizes="(min-width: 1024px) 32rem, 0px"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
          </div>

          {/* floating: vaccination reminder */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.55, ease: EASE }}
            className="absolute top-14 -left-10 flex items-center gap-3 rounded-2xl border bg-card/90 p-4 shadow-lifted backdrop-blur-md"
          >
            <div className="flex size-10 items-center justify-center rounded-xl bg-success-soft">
              <CalendarCheck2 className="size-5 text-success" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-bold">{t("cardVaccine")}</p>
              <p className="text-xs text-muted-foreground">{t("cardVaccineSub")}</p>
            </div>
          </motion.div>

          {/* floating: verified clinic */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.7, ease: EASE }}
            className="absolute -right-8 bottom-24 flex items-center gap-3 rounded-2xl border bg-card/90 p-4 shadow-lifted backdrop-blur-md"
          >
            <div className="flex size-10 items-center justify-center rounded-xl bg-brand-blue-soft">
              <ShieldCheck className="size-5 text-brand-blue" aria-hidden="true" />
            </div>
            <div>
              <p className="flex items-center gap-1.5 text-sm font-bold">
                {t("cardClinic")}
                <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-warning">
                  <Star className="size-3.5 fill-current" aria-hidden="true" />
                  4.9
                </span>
              </p>
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="size-3" aria-hidden="true" />
                {t("cardClinicSub")}
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
