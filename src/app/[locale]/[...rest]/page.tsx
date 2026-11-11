import { notFound } from "next/navigation";

// Any unmatched path inside a locale renders the localized 404.
export default function CatchAllPage() {
  notFound();
}
