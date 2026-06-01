import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel handles the build output automatically — no "standalone" needed
  // "serverExternalPackages" is only needed while SQLite is still in use locally.
  // Remove this line after completing the Supabase migration.
  serverExternalPackages: ["better-sqlite3"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
    ],
  },
};

export default nextConfig;
