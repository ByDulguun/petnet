import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BadgeCheck,
  CalendarDays,
  ChevronRight,
  Clock3,
  ExternalLink,
  Globe,
  MapPin,
  Phone,
  Star,
} from "lucide-react";

import { CategoryIcon, toneClasses } from "@/components/shared/category-icon";
import { FadeUp } from "@/components/shared/motion";
import { OpenStatusText } from "@/components/shared/open-status";
import { SectionHeading } from "@/components/shared/section-heading";
import {
  FacebookIcon,
  InstagramIcon,
  TikTokIcon,
} from "@/components/shared/social-icons";
import { WeeklyHours } from "@/components/shared/weekly-hours";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { BookingDialog } from "@/features/services/components/booking-dialog";
import { BusinessActions } from "@/features/services/components/business-actions";
import { BusinessCard } from "@/features/services/components/business-card";
import { BusinessGallery } from "@/features/services/components/business-gallery";
import { ReviewsSection } from "@/features/services/components/reviews-section";
import { ReportDialog } from "@/features/reports/components/report-dialog";
import { SITE } from "@/lib/constants";
import {
  googleMapsPlaceUrl,
  googleStreetViewUrl,
} from "@/lib/geo";
import { nowInUlaanbaatar, weeklySchedule } from "@/lib/hours";
import { formatMnt, toSafeJsonLd } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  getAllBusinessSlugs,
  getBusinessDetail,
  getNearbyBusinesses,
  getReviews,
} from "@/server/services/business-service";

// ISR: open/closed labels refresh every 5 minutes without losing SSG speed.
export const revalidate = 300;

export async function generateStaticParams() {
  const slugs = await getAllBusinessSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const business = await getBusinessDetail(slug);
  if (!business) return { title: "Business not found" };

  const title = `${business.name} — ${business.category.name} in ${business.district}`;
  const description = `${business.tagline ?? ""} ★ ${business.ratingAvg.toFixed(1)} (${business.ratingCount} reviews) · ${business.address}, ${business.city}. View services, prices, hours and book on PetNet.`;

  return {
    title,
    description,
    alternates: { canonical: `/business/${business.slug}` },
    openGraph: {
      title,
      description,
      type: "website",
      url: `${SITE.url}/business/${business.slug}`,
      images: business.coverUrl
        ? [{ url: business.coverUrl, width: 1200, height: 750, alt: business.name }]
        : undefined,
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

const CATEGORY_SCHEMA_TYPE: Record<string, string> = {
  "veterinary-clinic": "VeterinaryCare",
  "emergency-vet": "VeterinaryCare",
  "pet-shop": "PetStore",
  "pet-friendly-cafe": "CafeOrCoffeeShop",
  "pet-friendly-hotel": "Hotel",
};

const DAY_SCHEMA = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export default async function BusinessPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const business = await getBusinessDetail(slug);
  if (!business) notFound();

  const [reviews, nearby] = await Promise.all([
    getReviews(slug, "newest"),
    getNearbyBusinesses(slug, 4),
  ]);
  const schedule = weeklySchedule(business.hours);
  const today = nowInUlaanbaatar().dayOfWeek;
  const bookableServices = business.services.filter((s) => s.isBookable);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": CATEGORY_SCHEMA_TYPE[business.category.slug] ?? "LocalBusiness",
    name: business.name,
    description: business.description,
    url: `${SITE.url}/business/${business.slug}`,
    telephone: business.phone,
    image: business.media.map((m) => m.url),
    priceRange: business.priceLevel ? "₮".repeat(business.priceLevel) : undefined,
    address: {
      "@type": "PostalAddress",
      streetAddress: business.address,
      addressLocality: business.city,
      addressRegion: business.district,
      addressCountry: "MN",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: business.latitude,
      longitude: business.longitude,
    },
    aggregateRating:
      business.ratingCount > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: business.ratingAvg,
            reviewCount: business.ratingCount,
            bestRating: 5,
          }
        : undefined,
    openingHoursSpecification: business.hours.map((h) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: DAY_SCHEMA[h.dayOfWeek],
      opens: h.is24h ? "00:00" : h.opensAt,
      closes: h.is24h ? "23:59" : h.closesAt,
    })),
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE.url },
      { "@type": "ListItem", position: 2, name: "Pet Map", item: `${SITE.url}/map` },
      {
        "@type": "ListItem",
        position: 3,
        name: business.category.name,
        item: `${SITE.url}/map?category=${business.category.slug}`,
      },
      { "@type": "ListItem", position: 4, name: business.name },
    ],
  };

  return (
    <article className="container-page pt-4 pb-16 lg:pb-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toSafeJsonLd(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toSafeJsonLd(breadcrumbLd) }}
      />

      {/* breadcrumbs */}
      <nav aria-label="Breadcrumb" className="mb-4">
        <ol className="flex flex-wrap items-center gap-1 text-[13px] text-muted-foreground">
          <li>
            <Link href="/" className="transition-colors hover:text-foreground">
              Home
            </Link>
          </li>
          <ChevronRight className="size-3.5" aria-hidden="true" />
          <li>
            <Link href="/map" className="transition-colors hover:text-foreground">
              Pet Map
            </Link>
          </li>
          <ChevronRight className="size-3.5" aria-hidden="true" />
          <li>
            <Link
              href={`/map?category=${business.category.slug}`}
              className="transition-colors hover:text-foreground"
            >
              {business.category.name}
            </Link>
          </li>
          <ChevronRight className="size-3.5" aria-hidden="true" />
          <li aria-current="page" className="font-semibold text-foreground">
            {business.name}
          </li>
        </ol>
      </nav>

      <BusinessGallery media={business.media} businessName={business.name} />

      {/* header */}
      <header className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3.5">
          {business.logoUrl && (
            <div className="relative size-14 shrink-0 overflow-hidden rounded-2xl border-2 border-background shadow-soft ring-1 ring-border sm:size-16">
              <Image
                src={business.logoUrl}
                alt={`${business.name} logo`}
                fill
                sizes="4rem"
                className="object-cover"
              />
            </div>
          )}
          <div className="min-w-0">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
                toneClasses(business.category.tone),
              )}
            >
              <CategoryIcon icon={business.category.icon} className="size-3.5" />
              {business.category.name}
            </span>
            <h1 className="mt-2.5 flex items-center gap-2 text-2xl font-extrabold tracking-tight text-balance sm:text-3xl">
              {business.name}
              {business.isVerified && (
                <BadgeCheck
                  className="size-6 shrink-0 text-brand-blue"
                  aria-label="Verified business"
                />
              )}
            </h1>
            {business.tagline && (
              <p className="mt-1 text-[15px] text-muted-foreground">{business.tagline}</p>
            )}
            <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              <span className="inline-flex items-center gap-1.5 font-semibold">
                <Star className="size-4 fill-warning text-warning" aria-hidden="true" />
                {business.ratingAvg.toFixed(1)}
                <a href="#reviews" className="font-normal text-muted-foreground underline-offset-4 hover:underline">
                  ({business.ratingCount} reviews)
                </a>
              </span>
              <span aria-hidden="true" className="text-muted-foreground">·</span>
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <MapPin className="size-4" aria-hidden="true" />
                {business.address}, {business.district}
              </span>
              <span aria-hidden="true" className="text-muted-foreground">·</span>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 font-semibold",
                  business.openStatus.isOpen ? "text-success" : "text-muted-foreground",
                )}
              >
                <Clock3 className="size-4" aria-hidden="true" />
                <OpenStatusText status={business.openStatus} />
              </span>
            </div>
          </div>
        </div>

        <BusinessActions
          slug={business.slug}
          name={business.name}
          phone={business.phone}
          latitude={business.latitude}
          longitude={business.longitude}
        />
      </header>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_22rem]">
        {/* ── main column ── */}
        <div className="min-w-0 space-y-12">
          {/* about */}
          <section aria-labelledby="about-heading">
            <h2 id="about-heading" className="text-xl font-extrabold tracking-tight sm:text-2xl">
              About
            </h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">{business.description}</p>

            {business.amenityDetails.length > 0 && (
              <ul className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2" aria-label="Amenities">
                {business.amenityDetails.map((a) => (
                  <li key={a.slug} className="flex items-center gap-2.5 text-sm">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary">
                      <CategoryIcon icon={a.icon} className="size-4 text-muted-foreground" />
                    </span>
                    {a.name}
                  </li>
                ))}
              </ul>
            )}

            {business.tags.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-1.5">
                {business.tags.map((tag) => (
                  <Link key={tag} href={`/map?q=${encodeURIComponent(tag)}`}>
                    <Badge
                      variant="secondary"
                      className="rounded-full font-medium capitalize transition-colors hover:bg-brand-soft hover:text-brand"
                    >
                      {tag}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* services & pricing */}
          {business.services.length > 0 && (
            <section aria-labelledby="services-heading">
              <h2 id="services-heading" className="text-xl font-extrabold tracking-tight sm:text-2xl">
                Services & pricing
              </h2>
              <ul className="mt-4 divide-y rounded-3xl border bg-card">
                {business.services.map((service) => (
                  <li key={service.id} className="flex items-center justify-between gap-4 p-4 sm:px-5">
                    <div className="min-w-0">
                      <p className="text-sm font-bold">{service.name}</p>
                      {service.description && (
                        <p className="mt-0.5 text-[13px] text-muted-foreground">
                          {service.description}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-muted-foreground">
                        {service.durationMin ? `${service.durationMin} min` : null}
                        {service.durationMin && service.categoryName ? " · " : null}
                        {service.categoryName}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="text-sm font-bold whitespace-nowrap">
                        {service.priceMnt === 0
                          ? "Free"
                          : service.priceMnt
                            ? `${formatMnt(service.priceMnt)}${service.priceMaxMnt ? ` – ${formatMnt(service.priceMaxMnt)}` : ""}`
                            : "Ask"}
                      </span>
                      {service.isBookable && (
                        <BookingDialog
                          businessSlug={business.slug}
                          businessName={business.name}
                          services={business.services}
                          hours={business.hours}
                          initialServiceId={service.id}
                          trigger={
                            <Button size="sm" variant="outline" className="rounded-full font-semibold">
                              Book
                            </Button>
                          }
                        />
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* staff */}
          {business.staff.length > 0 && (
            <section aria-labelledby="team-heading">
              <h2 id="team-heading" className="text-xl font-extrabold tracking-tight sm:text-2xl">
                The team
              </h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {business.staff.map((member) => (
                  <div key={member.id} className="flex items-start gap-4 rounded-3xl border bg-card p-5">
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand-soft text-lg font-extrabold text-brand">
                      {member.name.slice(0, 1)}
                    </span>
                    <div className="min-w-0">
                      <p className="font-bold">{member.name}</p>
                      {member.title && (
                        <p className="text-[13px] font-medium text-brand">{member.title}</p>
                      )}
                      {member.specialty && (
                        <p className="mt-0.5 text-[13px] text-muted-foreground">
                          {member.specialty}
                        </p>
                      )}
                      {member.bio && (
                        <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                          {member.bio}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* faqs */}
          {business.faqs.length > 0 && (
            <section aria-labelledby="faq-heading">
              <h2 id="faq-heading" className="text-xl font-extrabold tracking-tight sm:text-2xl">
                Frequently asked
              </h2>
              <Accordion type="single" collapsible className="mt-2">
                {business.faqs.map((faq, i) => (
                  <AccordionItem key={i} value={`faq-${i}`}>
                    <AccordionTrigger className="text-left text-sm font-bold">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>
          )}

          <ReviewsSection
            businessSlug={business.slug}
            ratingAvg={business.ratingAvg}
            ratingCount={business.ratingCount}
            ratingBreakdown={business.ratingBreakdown}
            initialReviews={reviews}
          />
        </div>

        {/* ── sidebar ── */}
        <aside className="space-y-5 lg:sticky lg:top-20 lg:self-start">
          {/* booking card */}
          <div className="rounded-3xl border bg-card p-5 shadow-soft">
            {bookableServices.length > 0 ? (
              <>
                <p className="text-sm font-bold">Book an appointment</p>
                <p className="mt-1 text-[13px] text-muted-foreground">
                  The business confirms your request · free cancellation up to 3 h before
                </p>
                <BookingDialog
                  businessSlug={business.slug}
                  businessName={business.name}
                  services={business.services}
                  hours={business.hours}
                  trigger={
                    <Button className="mt-4 w-full rounded-full font-semibold" size="lg">
                      <CalendarDays className="size-4.5" />
                      Check availability
                    </Button>
                  }
                />
              </>
            ) : (
              <>
                <p className="text-sm font-bold">Get in touch</p>
                <p className="mt-1 text-[13px] text-muted-foreground">
                  This business takes requests by phone.
                </p>
                {business.phone && (
                  <Button className="mt-4 w-full rounded-full font-semibold" size="lg" asChild>
                    <a href={`tel:${business.phone.replace(/\s/g, "")}`}>
                      <Phone className="size-4.5" />
                      {business.phone}
                    </a>
                  </Button>
                )}
              </>
            )}
          </div>

          {/* hours */}
          <div className="rounded-3xl border bg-card p-5">
            <p className="flex items-center justify-between text-sm font-bold">
              Opening hours
              <span
                className={cn(
                  "text-xs font-semibold",
                  business.openStatus.isOpen ? "text-success" : "text-muted-foreground",
                )}
              >
                <OpenStatusText status={business.openStatus} />
              </span>
            </p>
            <WeeklyHours schedule={schedule} today={today} />
            {business.holidays.length > 0 && (
              <p className="mt-3 rounded-xl bg-warning-soft px-3 py-2 text-xs leading-relaxed text-warning">
                Holiday hours apply {business.holidays.map((h) => h.name).filter((v, i, a) => a.indexOf(v) === i).join(", ")} — check before visiting.
              </p>
            )}
          </div>

          {/* location & contact */}
          <div className="rounded-3xl border bg-card p-5">
            <p className="text-sm font-bold">Location & contact</p>
            <p className="mt-2 flex items-start gap-2 text-[13px] text-muted-foreground">
              <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              {business.address}, {business.district}, {business.city}
            </p>
            <div className="mt-3 grid grid-cols-1 gap-2">
              <Button variant="outline" size="sm" className="justify-start rounded-xl" asChild>
                <a
                  href={googleMapsPlaceUrl(
                    { lat: business.latitude, lng: business.longitude },
                    business.name,
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="size-4" />
                  Open in Google Maps
                </a>
              </Button>
              <Button variant="outline" size="sm" className="justify-start rounded-xl" asChild>
                <a
                  href={googleStreetViewUrl({ lat: business.latitude, lng: business.longitude })}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="size-4" />
                  Street View
                </a>
              </Button>
              {business.website && (
                <Button variant="outline" size="sm" className="justify-start rounded-xl" asChild>
                  <a href={business.website} target="_blank" rel="noopener noreferrer">
                    <Globe className="size-4" />
                    Website
                  </a>
                </Button>
              )}
            </div>

            {(business.facebook || business.instagram || business.tiktok) && (
              <>
                <Separator className="my-4" />
                <div className="flex items-center gap-2">
                  {business.facebook && (
                    <a
                      href={business.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${business.name} on Facebook`}
                      className="flex size-9 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:bg-brand-soft hover:text-brand"
                    >
                      <FacebookIcon className="size-4" />
                    </a>
                  )}
                  {business.instagram && (
                    <a
                      href={business.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${business.name} on Instagram`}
                      className="flex size-9 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:bg-brand-soft hover:text-brand"
                    >
                      <InstagramIcon className="size-4" />
                    </a>
                  )}
                  {business.tiktok && (
                    <a
                      href={business.tiktok}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${business.name} on TikTok`}
                      className="flex size-9 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:bg-brand-soft hover:text-brand"
                    >
                      <TikTokIcon className="size-4" />
                    </a>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="flex justify-center">
            <ReportDialog targetType="business" targetId={business.id} />
          </div>
        </aside>
      </div>

      {/* nearby */}
      {nearby.length > 0 && (
        <FadeUp className="mt-16">
          <SectionHeading
            eyebrow="Nearby"
            title="More places around here"
            href="/map"
            hrefLabel="Open the map"
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
            {nearby.map((b) => (
              <BusinessCard key={b.id} business={b} layout="tile" />
            ))}
          </div>
        </FadeUp>
      )}
    </article>
  );
}
