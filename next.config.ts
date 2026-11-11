import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const LEGACY_ROUTES: [string, string][] = [
  ["shops", "map?category=pet-shop"],
  ["vets", "map?category=veterinary-clinic"],
  ["grooming", "map?category=grooming-salon"],
  ["hotels", "map?category=pet-hotel"],
  ["training", "map?category=dog-trainer"],
  ["search", "map"],
];

const nextConfig: NextConfig = {
  // Self-contained output (server + only the node_modules it actually
  // needs) — makes Docker/self-host/Railway/Fly deploys fast and small.
  // Harmless on Vercel, which manages its own output regardless.
  output: "standalone",
  images: {
    remotePatterns: [
      // demo/mock imagery until Cloudinary assets are wired up
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
  async redirects() {
    // Legacy Module 0 directory URLs → unified explorer, in both the
    // unprefixed form (middleware adds the locale after the redirect) and
    // the locale-prefixed form.
    return LEGACY_ROUTES.flatMap(([from, to]) => [
      { source: `/${from}`, destination: `/${to}`, permanent: false },
      {
        source: `/:locale(mn|en)/${from}`,
        destination: `/:locale/${to}`,
        permanent: false,
      },
    ]);
  },
};

export default withNextIntl(nextConfig);
