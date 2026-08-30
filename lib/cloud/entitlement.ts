import { apiFetch } from "@/lib/nela-api";
import type { EntitlementResponse } from "./types";

export async function fetchEntitlement(): Promise<EntitlementResponse> {
  return apiFetch<EntitlementResponse>("/v1/me/entitlement");
}

export function canUseMode(
  entitlement: EntitlementResponse | null,
  mode: "fast" | "smart" | "deep" | "auto",
): boolean {
  if (!entitlement?.cloudEnabled) return false;

  const hasCredits =
    entitlement.paidCloud || entitlement.credits.trialCredits > 0;
  const hasFastFree = entitlement.fastFree.remaining > 0;

  if (mode === "fast") {
    return hasFastFree || hasCredits;
  }
  if (mode === "smart" || mode === "deep") {
    return hasCredits;
  }
  // auto — server picks lane; allow when any cloud path is available
  return hasFastFree || hasCredits;
}

/** UI hint when a mode is selectable but may bill credits on send. */
export function modeAccessHint(
  entitlement: EntitlementResponse | null,
  mode: "fast" | "smart" | "deep" | "auto",
): string | undefined {
  if (!entitlement?.cloudEnabled) return "Cloud is not enabled on your account";
  if (canUseMode(entitlement, mode)) {
    if (
      (mode === "smart" || mode === "deep" || mode === "auto") &&
      !entitlement.paidCloud &&
      entitlement.credits.trialCredits > 0
    ) {
      return "Uses trial credits";
    }
    if (mode === "fast" && entitlement.fastFree.remaining > 0) {
      return "Uses free Fast quota";
    }
    return undefined;
  }
  if (mode === "fast" || mode === "auto") {
    return "Fast quota exhausted — upgrade or wait for reset";
  }
  return "Smart/Deep need credits or a paid plan";
}

export function quotaLabel(entitlement: EntitlementResponse | null): string {
  if (!entitlement) return "";
  if (entitlement.paidCloud) {
    return `${entitlement.credits.balance} credits`;
  }
  const parts: string[] = [];
  if (entitlement.fastFree.remaining > 0) {
    parts.push(
      `Fast ${entitlement.fastFree.remaining}/${entitlement.fastFree.limit} per ${entitlement.fastFree.windowHours}h`,
    );
  }
  if (entitlement.credits.trialCredits > 0) {
    parts.push(`${entitlement.credits.trialCredits} trial credits`);
  }
  return parts.join(" · ") || "Sign in for Cloud access";
}
