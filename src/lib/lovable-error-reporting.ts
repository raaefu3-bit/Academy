// Standalone error reporting stub (was Lovable-specific).
// Swap in Sentry / your own reporter as needed.
export function reportLovableError(error: unknown, context: Record<string, unknown> = {}) {
  if (typeof console !== "undefined") {
    console.error("[app error]", error, context);
  }
}
