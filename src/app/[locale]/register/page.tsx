import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { PetNetMark } from "@/components/brand/logo";
import { RegisterForm } from "@/features/auth/components/register-form";
import { auth } from "@/lib/auth";
import { Link, redirect } from "@/i18n/navigation";
import { isSafeRedirectPath } from "@/lib/utils";

// Checks the visitor's session to decide whether to redirect away — must
// never be served from a static/prerendered cache (see Phase 2 header bug).
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });
  return { title: t("registerTitle") };
}

export default async function RegisterPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { next } = await searchParams;

  const session = await auth();
  if (session?.user) {
    redirect({ href: isSafeRedirectPath(next) ? next : "/", locale });
  }

  const t = await getTranslations("auth");

  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-16">
      <div className="w-full max-w-sm">
        <div className="text-center">
          <PetNetMark className="mx-auto size-12" />
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight">{t("registerTitle")}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{t("registerSubtitle")}</p>
        </div>

        <div className="mt-8 rounded-3xl border bg-card p-6 shadow-soft">
          <RegisterForm next={next} />
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {t("switchToLogin")}{" "}
          <Link
            href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"}
            className="font-semibold text-brand hover:underline"
          >
            {t("loginLink")}
          </Link>
        </p>
      </div>
    </div>
  );
}
