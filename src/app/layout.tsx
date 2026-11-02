import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

import { BottomNav } from "@/components/layout/BottomNav";
import { PageLoading } from "@/components/layout/PageLoading";
import { WhatsAppFloat } from "@/components/common/WhatsAppFloat";
import { MobileAppBanner } from "@/components/MobileAppBanner";
import { CartProvider } from "@/lib/cart-context";
import { WishlistProvider } from "@/lib/wishlist-context";
import { getSiteUrl } from "@/lib/site";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { ThemeScript } from "@/components/layout/ThemeScript";

export const metadata: Metadata = {
  // Site favicon — served from Vercel Blob CDN
  metadataBase: new URL(getSiteUrl()),
  icons: {
    icon: "https://4upsg7iazjf61bbi.public.blob.vercel-storage.com/assets/icon.png",
  },
  title: "NBS-pk — Premium Leather Shoes from Multan",
  description: "New Brand Shoes Multan — Pure leather footwear crafted since 2015.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="bg-white text-slate-900 antialiased transition-colors duration-200 dark:bg-slate-950 dark:text-slate-100" suppressHydrationWarning>
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
        <PageLoading />
        {/* Vercel Web Analytics — no-ops in local dev, active on deployments. */}
        <Analytics />
        {/* Vercel Speed Insights — measures real-user Core Web Vitals on
            deployments; inert locally. */}
        <SpeedInsights />
      </body>
    </html>
  );
}
