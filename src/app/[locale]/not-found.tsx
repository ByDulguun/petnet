import { useTranslations } from "next-intl";
import { Home, Search } from "lucide-react";

import { PetNetMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export default function NotFound() {
  const t = useTranslations("errors");

  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <div className="relative">
        <p
          className="text-[7rem] leading-none font-extrabold tracking-tight text-secondary select-none sm:text-[9rem]"
          aria-hidden="true"
        >
          404
        </p>
        <PetNetMark className="absolute top-1/2 left-1/2 size-16 -translate-x-1/2 -translate-y-1/2" />
      </div>
      <h1 className="mt-4 text-2xl font-extrabold tracking-tight sm:text-3xl">
        {t("notFoundTitle")}
      </h1>
      <p className="mt-2 max-w-md text-[15px] leading-relaxed text-muted-foreground">
        {t("notFoundDesc")}
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button className="rounded-full font-semibold" asChild>
          <Link href="/">
            <Home className="size-4" />
            {t("backHome")}
          </Link>
        </Button>
        <Button variant="outline" className="rounded-full font-semibold" asChild>
          <Link href="/map">
            <Search className="size-4" />
            {t("searchPetNet")}
          </Link>
        </Button>
      </div>
    </div>
  );
}
