"use client";

import { useState } from "react";
import Image from "next/image";
import { Images } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { MediaView } from "@/lib/types";
import { cn } from "@/lib/utils";

export function BusinessGallery({
  media,
  businessName,
}: {
  media: MediaView[];
  businessName: string;
}) {
  const [open, setOpen] = useState(false);
  const images = media.filter((m) => m.type === "IMAGE");
  if (images.length === 0) return null;

  const [main, ...rest] = images;
  const side = rest.slice(0, 4);

  return (
    <>
      <div className="relative">
        {/* Desktop: main + 2×2 grid; Mobile: swipeable strip */}
        <div className="hidden gap-2 overflow-hidden rounded-3xl sm:grid sm:h-[26rem] sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="group relative size-full overflow-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            aria-label={`Open photo gallery of ${businessName}`}
          >
            <Image
              src={main.url}
              alt={main.alt ?? businessName}
              fill
              priority
              sizes="(min-width: 640px) 50vw, 100vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          </button>
          <div
            className={cn(
              "grid gap-2",
              side.length <= 1 ? "grid-cols-1" : "grid-cols-2",
              side.length > 2 ? "grid-rows-2" : "grid-rows-1",
            )}
          >
            {side.map((m, i) => (
              <button
                key={m.url + i}
                type="button"
                onClick={() => setOpen(true)}
                className="group relative size-full overflow-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                aria-label={`Open photo ${i + 2} of ${businessName}`}
              >
                <Image
                  src={m.url}
                  alt={m.alt ?? ""}
                  fill
                  sizes="25vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
              </button>
            ))}
          </div>
        </div>

        <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto rounded-3xl sm:hidden">
          {images.map((m, i) => (
            <button
              key={m.url + i}
              type="button"
              onClick={() => setOpen(true)}
              className="relative aspect-[4/3] w-[88%] shrink-0 snap-center overflow-hidden rounded-2xl"
              aria-label={`Open photo ${i + 1} of ${businessName}`}
            >
              <Image
                src={m.url}
                alt={m.alt ?? ""}
                fill
                priority={i === 0}
                sizes="88vw"
                className="object-cover"
              />
            </button>
          ))}
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => setOpen(true)}
          className="absolute right-3 bottom-3 rounded-full border bg-card/90 font-semibold shadow-soft backdrop-blur-sm"
        >
          <Images className="size-4" />
          All photos ({images.length})
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{businessName} — photos</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            {images.map((m, i) => (
              <div key={m.url + i} className="relative aspect-[16/10] overflow-hidden rounded-2xl">
                <Image
                  src={m.url}
                  alt={m.alt ?? `Photo ${i + 1}`}
                  fill
                  sizes="(min-width: 640px) 42rem, 100vw"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
