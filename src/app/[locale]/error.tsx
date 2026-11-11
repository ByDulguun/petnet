"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { RefreshCcw } from "lucide-react";

import { PetNetMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errors");

  useEffect(() => {
    // surface for observability tooling (Sentry etc. later)
    console.error(error);
  }, [error]);

  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <PetNetMark className="size-16 opacity-60 grayscale" />
      <h1 className="mt-6 text-2xl font-extrabold tracking-tight sm:text-3xl">
        {t("errorTitle")}
      </h1>
      <p className="mt-2 max-w-md text-[15px] leading-relaxed text-muted-foreground">
        {t("errorDesc")}
      </p>
      {error.digest && (
        <p className="mt-2 font-mono text-xs text-muted-foreground/60">
          {t("errorId", { id: error.digest })}
        </p>
      )}
      <Button onClick={reset} className="mt-8 rounded-full font-semibold">
        <RefreshCcw className="size-4" />
        {t("tryAgain")}
      </Button>
    </div>
  );
}
