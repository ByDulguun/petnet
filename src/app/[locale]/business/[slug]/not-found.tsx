import Link from "next/link";
import { MapPin, Search } from "lucide-react";

import { PetNetMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export default function BusinessNotFound() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <PetNetMark className="size-16 opacity-60 grayscale" />
      <h1 className="mt-6 text-2xl font-extrabold tracking-tight sm:text-3xl">
        This place isn&apos;t on PetNet yet
      </h1>
      <p className="mt-2 max-w-md text-[15px] leading-relaxed text-muted-foreground">
        The business you&apos;re looking for may have moved, closed, or hasn&apos;t
        been listed. Explore the map to find great places nearby.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button className="rounded-full font-semibold" asChild>
          <Link href="/map">
            <MapPin className="size-4" />
            Open the Pet Map
          </Link>
        </Button>
        <Button variant="outline" className="rounded-full font-semibold" asChild>
          <Link href="/map?q=">
            <Search className="size-4" />
            Search services
          </Link>
        </Button>
      </div>
    </div>
  );
}
