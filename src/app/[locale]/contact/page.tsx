import type { Metadata } from "next";
import { Mail } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { FacebookIcon, InstagramIcon } from "@/components/shared/social-icons";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contactPage" });
  return { title: t("title") };
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("contactPage");

  return (
    <article className="container-page max-w-2xl pt-8 pb-16 lg:pb-24">
      <h1 className="text-2xl font-extrabold tracking-tight text-balance sm:text-3xl">
        {t("title")}
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{t("intro")}</p>

      <div className="mt-8 rounded-3xl border bg-card p-6">
        <p className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
          {t("emailLabel")}
        </p>
        <Button className="mt-3 rounded-full font-semibold" asChild>
          <a href={`mailto:${t("emailValue")}`}>
            <Mail className="size-4" />
            {t("emailValue")}
          </a>
        </Button>

        <p className="mt-6 text-xs font-bold tracking-wide text-muted-foreground uppercase">
          {t("socialLabel")}
        </p>
        <div className="mt-3 flex items-center gap-2">
          <a
            href="https://facebook.com/petnet.mn"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="PetNet Facebook"
            className="flex size-10 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:bg-brand-soft hover:text-brand"
          >
            <FacebookIcon className="size-4.5" />
          </a>
          <a
            href="https://instagram.com/petnet.mn"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="PetNet Instagram"
            className="flex size-10 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:bg-brand-soft hover:text-brand"
          >
            <InstagramIcon className="size-4.5" />
          </a>
        </div>
      </div>

      <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
        {t.rich("businessNote", {
          link: (chunks) => (
            <Link href="/business/join" className="font-semibold text-brand underline underline-offset-2">
              {chunks}
            </Link>
          ),
        })}
      </p>
    </article>
  );
}
