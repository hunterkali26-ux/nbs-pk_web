"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function PageLoading() {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, [pathname]);

  if (!isLoading) return null;

  return (
    <div
      className="fixed top-0 left-0 w-full h-1 bg-amber-600/40 dark:bg-amber-500/60 z-[100] transition-opacity duration-300"
    >
      <div className="h-full bg-amber-600 dark:bg-amber-400 w-1/3 animate-pulse" />
    </div>
  );
}