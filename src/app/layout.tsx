import type { Metadata } from "next";
import "./globals.css";

import { BottomNav } from "@/components/layout/BottomNav";
import { CartProvider } from "@/lib/cart-context";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { ThemeScript } from "@/components/layout/ThemeScript";

export const metadata: Metadata = {
  metadataBase: new URL("https://vexis.pk"),
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
            {/* Mobile bottom nav is fixed to the viewport — clear safe room
                so page content is never hidden behind it. */}
            <div className="pb-[68px] md:pb-0">{children}</div>
            <BottomNav />
          </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
