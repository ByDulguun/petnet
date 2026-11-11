"use client";

import { Check, Heart, Navigation, Phone, Share2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { googleMapsDirectionsUrl } from "@/lib/geo";
import { cn } from "@/lib/utils";

import { useFavorites } from "../hooks";

export function BusinessActions({
  slug,
  name,
  phone,
  latitude,
  longitude,
}: {
  slug: string;
  name: string;
  phone?: string;
  latitude: number;
  longitude: number;
}) {
  const { isFavorite, toggle } = useFavorites();
  const saved = isFavorite(slug);
  const [justShared, setJustShared] = useState(false);

  async function share() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.share) {
        await navigator.share({ title: `${name} · PetNet`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setJustShared(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setJustShared(false), 2000);
    } catch {
      // user dismissed the share sheet — nothing to do
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {phone && (
        <Button className="rounded-full font-semibold" asChild>
          <a href={`tel:${phone.replace(/\s/g, "")}`}>
            <Phone className="size-4" />
            Call
          </a>
        </Button>
      )}
      <Button variant="outline" className="rounded-full font-semibold" asChild>
        <a
          href={googleMapsDirectionsUrl({ lat: latitude, lng: longitude })}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Navigation className="size-4" />
          Directions
        </a>
      </Button>
      <Button
        variant="outline"
        className="rounded-full font-semibold"
        onClick={share}
        aria-label={`Share ${name}`}
      >
        {justShared ? <Check className="size-4 text-success" /> : <Share2 className="size-4" />}
        Share
      </Button>
      <Button
        variant="outline"
        className={cn("rounded-full font-semibold", saved && "border-danger/40 text-danger")}
        onClick={() => {
          toggle(slug);
          toast(saved ? "Removed from saved places" : "Saved to your places");
        }}
        aria-pressed={saved}
        aria-label={saved ? `Remove ${name} from saved places` : `Save ${name}`}
      >
        <Heart className={cn("size-4", saved && "fill-danger")} />
        {saved ? "Saved" : "Save"}
      </Button>
    </div>
  );
}
