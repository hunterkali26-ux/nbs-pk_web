import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

import { BottomNav } from "@/components/layout/BottomNav";
import { WhatsAppFloat } from "@/components/common/WhatsAppFloat";
import { MobileAppBanner } from "@/components/MobileAppBanner";
import { CartProvider } from "@/lib/cart-context";
import { WishlistProvider } from "@/lib/wishlist-context";
import { getSiteUrl } from "@/lib/site";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { ThemeScript } from "@/components/layout/ThemeScript";

export const metadata: Metadata = {
  // Site favicon — served from src/app/icon.png via the App Router file
  // convention. Next.js auto-generates <link rel="icon"> (plus touch icons)
  // from this file for every route; no manual icons entry needed here.
  // Canonical origin comes from NEXT_PUBLIC_SITE_URL (see src/lib/site.ts) so
  // canonical/OG URLs follow the deployed domain instead of being hardcoded.
  metadataBase: new URL(getSiteUrl()),
  title: "VEXIS pk — Premium watches, perfumes & shoes",
  description: "Luxury everyday essentials, delivered across Pakistan.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="bg-white text-slate-900 antialiased transition-colors duration-200 dark:bg-slate-950 dark:text-slate-100">
        <ThemeProvider>
          <CartProvider>
            <WishlistProvider>
              {/* Mobile bottom nav is fixed to the viewport — clear safe room
                  so page content is never hidden behind it. */}
              <div className="pb-[68px] md:pb-0">{children}</div>
              <BottomNav />
              {/* Floating WhatsApp chat widget — public storefront pages. */}
              <WhatsAppFloat />
              {/* Mobile app promotion banner — visible only on mobile screens. */}
              <MobileAppBanner />
            </WishlistProvider>
          </CartProvider>
        </ThemeProvider>
        {/* Vercel Web Analytics — no-ops in local dev, active on deployments. */}
        <Analytics />
        {/* Vercel Speed Insights — measures real-user Core Web Vitals on
            deployments; inert locally. */}
        <SpeedInsights />
      </body>
    </html>
  );
}
