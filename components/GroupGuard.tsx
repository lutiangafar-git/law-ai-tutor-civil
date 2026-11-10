"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { loadState } from "@/lib/storage";

/** Redirects to onboarding when no group is chosen yet. */
export function GroupGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (pathname.startsWith("/onboarding")) {
      setReady(true);
      return;
    }
    const state = loadState();
    if (!state.userGroup) {
      router.replace("/onboarding");
      return;
    }
    if (!state.usageNoticeSeen) {
      router.replace("/onboarding?notice=1");
      return;
    }
    setReady(true);
  }, [pathname, router]);

  if (!ready) {
    return (
      <p className="text-muted" role="status">
        Loading…
      </p>
    );
  }

  return <>{children}</>;
}
