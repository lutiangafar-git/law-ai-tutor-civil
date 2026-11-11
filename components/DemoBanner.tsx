/** Shown on any screen whose topic is demo content (status: demo in its source file). */
export function DemoBanner() {
  return (
    <p
      role="note"
      className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900"
    >
      <strong>Demo content: pending lawyer review.</strong> This topic was drafted from the
      Civil Code and a past bar question for demonstration. Check the official source before
      relying on it.
    </p>
  );
}
