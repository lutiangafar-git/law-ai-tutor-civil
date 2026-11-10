import { Suspense } from "react";
import { OnboardingClient } from "./OnboardingClient";

export default function OnboardingPage() {
  return (
    <Suspense fallback={<p className="text-muted">Loading…</p>}>
      <OnboardingClient />
    </Suspense>
  );
}
