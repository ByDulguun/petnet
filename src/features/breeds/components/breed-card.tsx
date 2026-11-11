import { PawPrint } from "lucide-react";
import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/navigation";

export interface BreedCardData {
  slug: string;
  name: string;
  nameMn: string | null;
  summary: string;
  coverImage: string | null;
  temperament: string[];
}

export function BreedCard({ breed }: { breed: BreedCardData }) {
  return (
    <Link
      href={`/breeds/${breed.slug}`}
      className="group block overflow-hidden rounded-3xl border bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lifted"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
        {breed.coverImage ? (
          <Image
            src={breed.coverImage}
            alt=""
            fill
            sizes="(min-width: 1024px) 20rem, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <PawPrint className="size-10 text-muted-foreground/40" aria-hidden="true" />
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-bold">{breed.name}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{breed.summary}</p>
        {breed.temperament.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {breed.temperament.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="rounded-full font-medium">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
