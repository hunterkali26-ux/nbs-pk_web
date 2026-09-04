import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.1.16', '192.168.11.161', '192.168.100.24', 'localhost:3000', 'cavalry-unbridle-displace.ngrok-free.dev'],
  
  // Yahan par devIndicators add kar do
  devIndicators: false,

  // Safety net for the legacy raw-file upload path: allow large media bodies
  // through Server Actions. The admin product forms now upload directly to
  // Supabase Storage from the browser, so normal payloads stay tiny — this
  // only guards the fallback path (and any future direct-action uploads).
  experimental: {
    serverActions: {
      bodySizeLimit: "200mb",
    },
  },

  // Allow Next.js's image optimizer to fetch and process product/category
  // photos stored in Supabase Storage (project-ref subdomains vary) and
  // external domains like evoque.pk.
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "**.supabase.in",
        pathname: "/storage/v1/object/public/**",
      },
      // Catch-all for all HTTPS image domains (evoique.pk, CDNs, etc.)
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;